const AddNodeEvent = new Event('addNode');
const AddEdgeEvent = new Event('addEdge');

let nodeIdCounter = 0;

export const defaultVisOptions: any = {
  nodes: {
    shape: 'dot',
    size: 26,
    font: {
      size: 14,
      color: '#000000',
    },
    borderWidth: 2,
    color: {
      border: '#2B7CE9',
      background: '#97C2FC',
      highlight: {
        border: '#2B7CE9',
        background: '#D2E5FF',
      },
    },
    mass: 1
  },
  edges: {
    width: 2,
    color: { color: '#848484' },
    smooth: {
      enabled: true,
      type: 'continuous',
      roundness: 0
    },
  },
  physics: {
    enabled: true,
    stabilization: {
      enabled: true,
      iterations: 1000
    },
    solver: 'forceAtlas2Based',
    forceAtlas2Based: {
      gravitationalConstant: -100,
      centralGravity: 0.01,
      springConstant: 1,
      springLength: 120,
      avoidOverlap: 1,
      damping: 0.95
    },
    minVelocity: 0.00001,
    maxVelocity: 35
  },
  interaction: {
    dragNodes: true,
    dragView: true,
    zoomView: true,
    hover: true,
    multiselect: true,
    selectable: true,
  },
  manipulation: {
    enabled: false,
    addNode: (data: any, callback: any) => {
      document.dispatchEvent(AddNodeEvent);
      data.label = nodeIdCounter.toString();
      nodeIdCounter += 1;
      callback(data);
    },
    addEdge: (data: any, callback: any) => {
      document.dispatchEvent(AddEdgeEvent);
      callback(data);
    },
  }
};


// Algorithm options
export const algorithms = [
  { id: 'kernighan-lin', name: 'Kernighan-Lin', description: 'Classic graph bisection' },
  { id: 'fiduccia-mattheyses', name: 'Fiduccia-Mattheyses', description: 'Fast heuristic method' },
  { id: 'metis', name: 'METIS', description: 'Multilevel graph partitioning' },
];