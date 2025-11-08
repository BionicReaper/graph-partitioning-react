const AddNodeEvent = new Event('addNode');
const AddEdgeEvent = new Event('addEdge');

export const visOptions: any = {
  nodes: {
    shape: 'dot',
    size: 28,
    font: {
      size: 14,
      color: '#ffffff',
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
  },
  edges: {
    width: 2,
    color: { color: '#848484' },
    smooth: {
      type: 'continuous',
    },
  },
  physics: {
    enabled: true,
    stabilization: {
      enabled: true,
      iterations: 1000,
    },
    barnesHut: {
      gravitationalConstant: -2000,
      springConstant: 0.001,
      springLength: 200,
    },
  },
  interaction: {
    dragNodes: true,
    dragView: true,
    zoomView: true,
    hover: true,
    multiselect: true,
  },
  manipulation: {
    enabled: false,
    addNode: (data: any, callback: any) => {
      document.dispatchEvent(AddNodeEvent);
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