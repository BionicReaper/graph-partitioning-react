import { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import Sidebar from './components/Sidebar';
import AddButton from './components/AddButton';
import PlayButton from './components/PlayButton';
import './App.css';
import { Network } from 'vis-network/standalone/esm/vis-network';
import { algorithms, visOptions } from './utils/constants';
import { Plus, Cable } from 'lucide-react';

type ActiveMode = 'node' | 'edge' | null;

function App() {
  // VisJS network
  const containerRef = useRef<HTMLDivElement | null>(null);
  const networkRef = useRef<Network>();

  // Keys Pressed
  const keysPressed = useRef<Set<string>>(new Set());


  useEffect(() => {
    if (containerRef.current) {
      // Create network after the container is available
      networkRef.current = new Network(containerRef.current, {}, visOptions);

      // Add event listeners to document for adding nodes and edges
      document.addEventListener('addNode', () => {
        console.log('Node added, resetting active mode');
        setActiveMode(null);
      });
      document.addEventListener('addEdge', () => {
        console.log('Edge added, resetting active mode');
        setActiveMode(null);
      });

      // Add event listener for hotkeys
      document.addEventListener('keydown', (event) => {
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
      });

      // Prevent holding keys from firing multiple times
      document.addEventListener('keyup', (event) => {
        keysPressed.current.delete(event.key);
      });

      return () => {
        // Cleanup event listeners on unmount
        document.removeEventListener('addNode', () => { });
        document.removeEventListener('addEdge', () => { });
        document.removeEventListener('keydown', () => { });
        document.removeEventListener('keyup', () => { });
      };
    }
  }, []);

  // App state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<ActiveMode>(null);
  const [currentAlgorithmId, setCurrentAlgorithmId] = useState<string>('kernighan-lin');

  // Sidebar toggle handler

  const toggleSidebar = (): void => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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
  const runAlgorithm = (): void => {
    console.log('Running algorithm:', currentAlgorithmId);
    // TODO: Implement algorithm execution
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

  return (
    <Box className="app" w="100vw" h="100vh" bg="gray.50">
      <div ref={containerRef} className="graph-canvas" style={{ height: '100vh' }} />
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <PlayButton
        onRun={runAlgorithm}
        onSelectAlgorithm={selectAlgorithm}
        algorithms={algorithms}
        currentAlgorithmId={currentAlgorithmId}
      />
      <AddButton
        onClick={toggleAddEdge}
        icon={Cable}
        label="Add Edge"
        position="middle"
        colorPalette="teal"
        active={activeMode === 'edge'}
      />
      <AddButton
        onClick={toggleAddNode}
        icon={Plus}
        label="Add Node"
        position="bottom"
        colorPalette="green"
        active={activeMode === 'node'}
      />
    </Box>
  );
}

export default App;
