import { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import Sidebar from './components/Sidebar';
import AddButton from './components/AddButton';
import PlayButton from './components/PlayButton';
import './App.css';
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network';
import { algorithms, defaultVisOptions } from './utils/constants';
import { Plus, Cable, Minimize, Maximize, Trash2 } from 'lucide-react';
import { runKernighanLin } from './algorithms/kernighan-lin';
import { getPauseStatus, getSimulationSpeedFactor, pauseAnimation, resumeAnimation, runAnimationSequence, setSimulationSpeedFactor } from './utils/animationRunner';
import { updateDataSetPositions } from './utils/positioning';
import FullscreenButton from './components/FullscreenButton';
import { useTranslation } from 'react-i18next';
import DeleteButton from './components/DeleteButton';

type ActiveMode = 'node' | 'edge' | null;

function App() {
  const { t } = useTranslation();

  const nodesRef = useRef(new DataSet<any, "id">([]));
  const edgesRef = useRef(new DataSet<any, "id">([]));
  // VisJS network
  const containerRef = useRef<HTMLDivElement | null>(null);
  const networkRef = useRef<Network>();

  const [ensureControlsAttached, setEnsureControlsAttached] = useState<boolean>(false); // Ensure controls are attached on late network initialization

  useEffect(() => {
    if (containerRef.current) {
      // Create network after the container is available
      // Override manipulation.addEdge so we can check for duplicate edges using edgesRef
      const visOptions = {
        ...defaultVisOptions,
        manipulation: {
          ...defaultVisOptions.manipulation,
          addEdge: (data: any, callback: any) => {
            // Prevent self-loop
            if (data.to === data.from) return;
            // Prevent duplicate edge in either direction
            const exists = edgesRef.current.get().some((e: any) =>
              (e.from === data.from && e.to === data.to) || (e.from === data.to && e.to === data.from)
            );
            if (exists) {
              console.log('Edge already exists, skipping addEdge');
              return;
            }
            // No duplicate found — proceed with add
            if (defaultVisOptions.manipulation?.addEdge) {
              // preserve any behavior in default options (like dispatching events)
              defaultVisOptions.manipulation.addEdge(data, callback);
            } else {
              callback(data);
            }
          }
        }
      };

      if (networkRef.current === undefined) {
        networkRef.current = new Network(containerRef.current, { nodes: nodesRef.current, edges: edgesRef.current }, visOptions);
      }

      // Add event listeners to document for adding nodes and edges

      const addNodeListener = () => {
        networkRef.current?.unselectAll();
        (networkRef.current as any).body.emitter.emit('select', { nodes: [], edges: [] });
        networkRef.current?.addNodeMode();
      };

      const addEdgeListener = () => {
        networkRef.current?.unselectAll();
        (networkRef.current as any).body.emitter.emit('select', { nodes: [], edges: [] });
        networkRef.current?.addEdgeMode();
      };

      document.addEventListener('addNode', addNodeListener);
      document.addEventListener('addEdge', addEdgeListener);

      setEnsureControlsAttached(prev => !prev); // Controls can now be safely attached

      return () => {
        // Cleanup event listeners on unmount
        document.removeEventListener('addNode', addNodeListener);
        document.removeEventListener('addEdge', addEdgeListener);
      };
    }
  }, [containerRef, nodesRef, edgesRef, defaultVisOptions]);

  // App state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<ActiveMode>(null);
  const [currentAlgorithmId, setCurrentAlgorithmId] = useState<string>('kernighan-lin');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [physicsEnabled, setPhysicsEnabled] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Delete handler

  const [hasSelection, setHasSelection] = useState<boolean>(false);

  const hasSelected = useCallback((): boolean => {
    const selection = networkRef.current?.getSelection();
    if (!selection) return false;
    const { nodes: selectedNodes, edges: selectedEdges } = selection;
    return selectedNodes.length > 0 || selectedEdges.length > 0;
  }, [networkRef]);

  const deleteSelected = useCallback((): void => {
    // Delete selected nodes and edges
    networkRef.current?.deleteSelected();
    networkRef.current?.unselectAll();
    setHasSelection(false);

    // Disable edit mode to fix an issue where a selection remains after delete
    setActiveMode(null);
    networkRef.current?.disableEditMode();

  }, [networkRef, setHasSelection, setActiveMode]);

  useEffect(() => {
    const handleSelectionChange = () => {
      // Change state for delete button
      setHasSelection(hasSelected());
    }
    networkRef.current?.on('select', handleSelectionChange);
    networkRef.current?.on('dragStart', handleSelectionChange);

    return () => {
      networkRef.current?.off('select', handleSelectionChange);
      networkRef.current?.off('dragStart', handleSelectionChange);
    }
  }, [networkRef, setHasSelection, hasSelected]);

  // Select handler

  const unselectAll = useCallback((): void => {
    networkRef.current?.unselectAll();
    (networkRef.current as any).body.emitter.emit('select', { nodes: [], edges: [] });
  }, [networkRef]);

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback((): void => {
    const el = document.documentElement;
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) { /* Safari */
        (document as any).webkitExitFullscreen();
      }
    } else {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsElement = document.fullscreenElement || (document as any).webkitFullscreenElement;
      setIsFullscreen(!!fsElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    }
  }, [setIsFullscreen]);

  // Sidebar toggle handler

  const toggleSidebar = useCallback((): void => {
    setIsSidebarOpen(prev => !prev);
  }, [setIsSidebarOpen]);

  // Toggle physics handler
  const togglePhysics = useCallback((): void => {
    setPhysicsEnabled((prev) => !prev);
  }, [setPhysicsEnabled]);

  // Add node handler
  const toggleAddNode = useCallback((): void => {
    if (!networkRef.current) return;
    setActiveMode((prev) => {
      if (prev === 'node') {
        networkRef.current?.disableEditMode();
        return null;
      } else {
        networkRef.current?.addNodeMode();
        return 'node';
      }
    });
    unselectAll();
  }, [networkRef, setActiveMode, unselectAll]);

  // Add edge handler
  const toggleAddEdge = useCallback((): void => {
    if (!networkRef.current) return;
    setActiveMode((prev) => {
      if (prev === 'edge') {
        networkRef.current?.disableEditMode();
        return null;
      } else {
        networkRef.current?.addEdgeMode();
        return 'edge';
      }
    });
    unselectAll();
  }, [networkRef, setActiveMode, unselectAll]);

  // Run algorithm handler
  const runAlgorithm = useCallback(async (): Promise<void> => {
    console.log('Running algorithm:', currentAlgorithmId);
    if (!networkRef.current || isRunning) return;

    setIsRunning(true);
    setPhysicsEnabled(false); // Disable physics during and after animation
    updateDataSetPositions(networkRef.current, nodesRef.current);
    console.log('Current graph state before algorithm:');
    console.log(nodesRef.current.get(), edgesRef.current.get());

    const result = runKernighanLin(networkRef.current, nodesRef.current, edgesRef.current);
    console.log('Algorithm result:', result);

    await runAnimationSequence(result.animation, nodesRef.current, edgesRef.current);
    console.log('Animation sequence completed');

    networkRef.current?.setOptions(
      {
        ...defaultVisOptions,
        physics: { ...defaultVisOptions.physics, enabled: false },
        manipulation: {
          ...defaultVisOptions.manipulation,
          addEdge: (data: any, callback: any) => {
            // Prevent self-loop
            if (data.to === data.from) return;
            // Prevent duplicate edge in either direction
            const exists = edgesRef.current.get().some((e: any) =>
              (e.from === data.from && e.to === data.to) || (e.from === data.to && e.to === data.from)
            );
            if (exists) {
              console.log('Edge already exists, skipping addEdge');
              return;
            }
            // No duplicate found — proceed with add
            if (defaultVisOptions.manipulation?.addEdge) {
              // preserve any behavior in default options (like dispatching events)
              defaultVisOptions.manipulation.addEdge(data, callback);
            } else {
              callback(data);
            }
          }
        }
      });
    setIsRunning(false);
  }, [networkRef, isRunning, setIsRunning, setPhysicsEnabled, nodesRef, edgesRef, currentAlgorithmId]);

  // Select algorithm handler
  const selectAlgorithm = useCallback((algorithmId: string): void => {
    setCurrentAlgorithmId(algorithmId);
    console.log('Selected algorithm:', algorithmId);
  }, [setCurrentAlgorithmId]);

  // Grid Moving Background

  const updateBackground = useCallback(() => {
    if (!networkRef.current || !containerRef.current) return;
    const view = (networkRef.current as any).canvas.body.view;
    const { translation, scale } = view;

    // Each grid cell’s base size
    const baseGridSize = 40;
    const gridSize = baseGridSize * scale;

    // Offset comes directly from the translation values
    const offsetX = translation.x % gridSize;
    const offsetY = translation.y % gridSize;

    containerRef.current.style.backgroundSize = `${gridSize}px ${gridSize}px`;
    containerRef.current.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
  }, [networkRef, containerRef]);

  useEffect(() => {
    if (networkRef.current) {
      // Update on zoom and drag
      networkRef.current.on("zoom", updateBackground);
      networkRef.current.on("dragEnd", updateBackground);
      networkRef.current.on("afterDrawing", updateBackground);
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.off("zoom", updateBackground);
        networkRef.current.off("dragEnd", updateBackground);
        networkRef.current.off("afterDrawing", updateBackground);
      }
    }
  }, [networkRef, updateBackground]);

  // Update physics when physicsEnabled changes
  useEffect(() => {
    if (networkRef.current) {
      networkRef.current.setOptions({
        physics: {
          enabled: physicsEnabled
        }
      });
    }
  }, [networkRef, physicsEnabled]);

  // Control keys whether an algorithm is running

  // Keys Pressed
  const keysPressed = useRef<Set<string>>(new Set());

  const idleKeyDownFunction = useCallback((event: KeyboardEvent) => {
    const pressedKey = event.key.toLowerCase();
    if (keysPressed.current.has(pressedKey)) return; // already pressed, ignore
    keysPressed.current.add(pressedKey);
    if (pressedKey === 'n') {
      event.preventDefault();
      toggleAddNode();
    } else if (pressedKey === 'e') {
      event.preventDefault();
      toggleAddEdge();
    } else if (pressedKey === 'escape') {
      event.preventDefault();
      setActiveMode(null);
      unselectAll();
      networkRef.current?.disableEditMode();
    } else if (pressedKey === 'delete') {
      event.preventDefault();
      deleteSelected();
    }
  }, [keysPressed, toggleAddNode, toggleAddEdge, setActiveMode, unselectAll, deleteSelected]);

  const simulationKeyDownFunction = useCallback((event: KeyboardEvent) => {
    const pressedKey = event.key.toLowerCase();
    if (keysPressed.current.has(pressedKey)) return; // already pressed, ignore
    keysPressed.current.add(pressedKey);
    if (pressedKey === 'p' || pressedKey === 'f9') {
      event.preventDefault();
      const isPaused = getPauseStatus();
      console.log('Toggling pause. Currently paused:', isPaused);
      if (isPaused) {
        console.log('Resuming animation');
        resumeAnimation();
      } else {
        console.log('Pausing animation');
        pauseAnimation().catch((err) => {
          console.error('Error pausing animation:', err);
        });
      }
    } else if (pressedKey === '-') {
      event.preventDefault();
      console.log('Decreasing simulation speed');
      const currentFactor = getSimulationSpeedFactor(true);
      const newFactor = Math.max(0.5, currentFactor / 2);
      setSimulationSpeedFactor(newFactor, true);
      console.log('New simulation speed factor:', newFactor);
    } else if (pressedKey === '=') {
      event.preventDefault();
      console.log('Increasing simulation speed');
      const currentFactor = getSimulationSpeedFactor(true);
      const newFactor = Math.min(128.0, currentFactor * 2);
      setSimulationSpeedFactor(newFactor, true);
      console.log('New simulation speed factor:', newFactor);
    }
  }, [keysPressed]);

  const keyUpFunction = useCallback((event: KeyboardEvent) => {
    const releasedKey = event.key.toLowerCase();
    keysPressed.current.delete(releasedKey);
  }, [keysPressed]);

  useEffect(() => {
    if (!networkRef.current) return;
    if (isRunning) {
      document.addEventListener('keydown', simulationKeyDownFunction);
      document.addEventListener('keyup', keyUpFunction);

      setActiveMode(null);
      networkRef.current?.disableEditMode();

      return () => {
        document.removeEventListener('keydown', simulationKeyDownFunction);
        document.removeEventListener('keyup', keyUpFunction);
      }

    } else {
      document.addEventListener('keydown', idleKeyDownFunction);
      document.addEventListener('keyup', keyUpFunction);

      return () => {
        document.removeEventListener('keydown', idleKeyDownFunction);
        document.removeEventListener('keyup', keyUpFunction);
      }
    }
  }, [isRunning, networkRef, setActiveMode, simulationKeyDownFunction, idleKeyDownFunction, keyUpFunction, ensureControlsAttached]);

  return (
    <Box className="app" w="100dvw" h="100dvh" bg="gray.50">
      <div ref={containerRef} className="graph-canvas" style={{ height: '100dvh' }} />
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        disablePhysicsToggle={isRunning}
        physicsEnabled={physicsEnabled}
        onTogglePhysics={togglePhysics}
      />
      <PlayButton
        onRun={runAlgorithm}
        onSelectAlgorithm={selectAlgorithm}
        algorithms={algorithms}
        currentAlgorithmId={currentAlgorithmId}
        disabled={isRunning}
      />
      <FullscreenButton
        onClick={toggleFullscreen}
        icon={isFullscreen ? Minimize : Maximize}
        label={t('ToggleFullscreen')}
        position="middle"
        colorPalette='cyan'
        fullscreenColorPalette='cyan'
      />
      <AddButton
        onClick={toggleAddEdge}
        icon={Cable}
        label={t('AddEdge')}
        position="middle"
        colorPalette="teal"
        active={activeMode === 'edge'}
        disabled={isRunning}
      />
      <AddButton
        onClick={toggleAddNode}
        icon={Plus}
        label={t('AddNode')}
        position="bottom"
        colorPalette="green"
        active={activeMode === 'node'}
        disabled={isRunning}
      />
      <DeleteButton
        onClick={deleteSelected}
        icon={Trash2}
        label={t('Delete')}
        position="bottom"
        colorPalette="red"
        disabled={!hasSelection}
      />
    </Box>
  );
}

export default App;
