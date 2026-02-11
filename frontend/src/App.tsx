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
import { runAnimationSequence } from './utils/animationRunner';
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
      networkRef.current = new Network(containerRef.current, { nodes: nodesRef.current, edges: edgesRef.current }, defaultVisOptions);

      // Add event listeners to document for adding nodes and edges
      document.addEventListener('addNode', () => {
        setActiveMode(null);
      });
      document.addEventListener('addEdge', () => {
        setActiveMode(null);
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

  const keyDownFunction = useCallback((event: KeyboardEvent) => {
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
      networkRef.current?.disableEditMode();
    } else if (event.key === 'Delete') {
      event.preventDefault();
      networkRef.current?.deleteSelected();
    }
  }, []);

  const keyUpFunction = useCallback((event: KeyboardEvent) => {
    keysPressed.current.delete(event.key);
  }, []);

  useEffect(() => {
    if (isRunning) {
      document.removeEventListener('keydown', keyDownFunction);
      document.removeEventListener('keyup', keyUpFunction);
      setActiveMode(null);
      networkRef.current?.disableEditMode();
    } else {
      // Re-add event listener for hotkeys
      document.addEventListener('keydown', keyDownFunction);

      // Prevent holding keys from firing multiple times
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

    await runAnimationSequence(result.animation);
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
