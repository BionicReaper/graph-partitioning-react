import { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import Sidebar from './components/Sidebar';
import AddButton from './components/AddButton';
import PlayButton from './components/PlayButton';
import './App.css';
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network';
import { algorithms, defaultVisOptions } from './utils/constants';
import { Plus, Cable } from 'lucide-react';
import { runKernighanLin } from './algorithms/kernighan-lin';
import { getPauseStatus, getSimulationSpeedFactor, pauseAnimation, resumeAnimation, runAnimationSequence, setSimulationSpeedFactor } from './utils/animationRunner';
import { updateDataSetPositions } from './utils/positioning';

type ActiveMode = 'node' | 'edge' | null;

function App() {
  const nodesRef = useRef(new DataSet<any, "id">([]));
  const edgesRef = useRef(new DataSet<any, "id">([]));
  // VisJS network
  const containerRef = useRef<HTMLDivElement | null>(null);
  const networkRef = useRef<Network>();

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

      networkRef.current = new Network(containerRef.current, { nodes: nodesRef.current, edges: edgesRef.current }, visOptions);

      // Add event listeners to document for adding nodes and edges
      document.addEventListener('addNode', () => {
        networkRef.current?.addNodeMode();
      });
      document.addEventListener('addEdge', () => {
        networkRef.current?.addEdgeMode();
      });

      return () => {
        // Cleanup event listeners on unmount
        document.removeEventListener('addNode', () => { });
        document.removeEventListener('addEdge', () => { });
      };
    }
  }, []);

  // App state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<ActiveMode>(null);
  const [currentAlgorithmId, setCurrentAlgorithmId] = useState<string>('kernighan-lin');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [physicsEnabled, setPhysicsEnabled] = useState<boolean>(true);

  // Control keys whether an algorithm is running

  // Keys Pressed
  const keysPressed = useRef<Set<string>>(new Set());

  const idleKeyDownFunction = useCallback((event: KeyboardEvent) => {
    if (keysPressed.current.has(event.key)) return; // already pressed, ignore
    keysPressed.current.add(event.key);
    if (event.key === 'n') {
      event.preventDefault();
      toggleAddNode();
    } else if (event.key === 'e') {
      event.preventDefault();
      toggleAddEdge();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setActiveMode(null);
      networkRef.current?.unselectAll();
      networkRef.current?.disableEditMode();
    } else if (event.key === 'Delete') {
      event.preventDefault();
      networkRef.current?.deleteSelected();
    }
  }, []);

  const simulationKeyDownFunction = useCallback((event: KeyboardEvent) => {
    if (keysPressed.current.has(event.key)) return; // already pressed, ignore
    keysPressed.current.add(event.key);
    if (event.key === 'p' || event.key === 'F9') {
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
    } else if (event.key === '-') {
      event.preventDefault();
      console.log('Decreasing simulation speed');
      const currentFactor = getSimulationSpeedFactor();
      const newFactor = Math.max(0.5, currentFactor / 2);
      setSimulationSpeedFactor(newFactor);
      console.log('New simulation speed factor:', newFactor);
    } else if (event.key === '=') {
      event.preventDefault();
      console.log('Increasing simulation speed');
      const currentFactor = getSimulationSpeedFactor();
      const newFactor = Math.min(128.0, currentFactor * 2);
      setSimulationSpeedFactor(newFactor);
      console.log('New simulation speed factor:', newFactor);
    }
  }, []);

  const keyUpFunction = useCallback((event: KeyboardEvent) => {
    keysPressed.current.delete(event.key);
  }, []);

  useEffect(() => {
    if (isRunning) {
      document.removeEventListener('keydown', idleKeyDownFunction);
      document.removeEventListener('keyup', keyUpFunction);

      document.addEventListener('keydown', simulationKeyDownFunction);
      document.addEventListener('keyup', keyUpFunction);

      setActiveMode(null);
      networkRef.current?.disableEditMode();
    } else {
      document.removeEventListener('keydown', simulationKeyDownFunction);
      document.removeEventListener('keyup', keyUpFunction);

      document.addEventListener('keydown', idleKeyDownFunction);
      document.addEventListener('keyup', keyUpFunction);

    }
  }, [isRunning]);

  // Sidebar toggle handler

  const toggleSidebar = (): void => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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
    networkRef.current.unselectAll();
  }, []);

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
    networkRef.current.unselectAll();
  }, []);

  // Run algorithm handler (placeholder for now)
  const runAlgorithm = async (): Promise<void> => {
    console.log('Running algorithm:', currentAlgorithmId);
    if (!networkRef.current || isRunning) return;

    setIsRunning(true);
    updateDataSetPositions(networkRef.current, nodesRef.current);
    console.log('Current graph state before algorithm:');
    console.log(nodesRef.current.get(), edgesRef.current.get());

    const result = runKernighanLin(networkRef.current, nodesRef.current, edgesRef.current);
    console.log('Algorithm result:', result);

    await runAnimationSequence(result.animation, nodesRef.current, edgesRef.current);
    console.log('Animation sequence completed');

    networkRef.current?.setOptions({ ...defaultVisOptions, physics: { ...defaultVisOptions.physics, enabled: physicsEnabled } });
    setIsRunning(false);
  };

  // Select algorithm handler
  const selectAlgorithm = (algorithmId: string): void => {
    setCurrentAlgorithmId(algorithmId);
    console.log('Selected algorithm:', algorithmId);
  };

  // Grid Moving Background

  const updateBackground = () => {
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
  };

  useEffect(() => {
    if (networkRef.current) {
      // Update on zoom and drag
      networkRef.current.on("zoom", updateBackground);
      networkRef.current.on("dragEnd", updateBackground);
      networkRef.current.on("afterDrawing", updateBackground);
    }
  }, [updateBackground]);

  // Update physics when physicsEnabled changes
  useEffect(() => {
    if (networkRef.current) {
      networkRef.current.setOptions({
        physics: {
          enabled: physicsEnabled
        }
      });
    }
  }, [physicsEnabled]);

  return (
    <Box className="app" w="100vw" h="100vh" bg="gray.50">
      <div ref={containerRef} className="graph-canvas" style={{ height: '100vh' }} />
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
      <AddButton
        onClick={toggleAddEdge}
        icon={Cable}
        label="Add Edge"
        position="middle"
        colorPalette="teal"
        active={activeMode === 'edge'}
        disabled={isRunning}
      />
      <AddButton
        onClick={toggleAddNode}
        icon={Plus}
        label="Add Node"
        position="bottom"
        colorPalette="green"
        active={activeMode === 'node'}
        disabled={isRunning}
      />
    </Box>
  );
}

export default App;
