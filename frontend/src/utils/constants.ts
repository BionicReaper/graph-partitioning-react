const AddNodeEvent = new Event('addNode');
const AddEdgeEvent = new Event('addEdge');

const canHover = window.matchMedia('(hover: hover)').matches;

let nodeIdCounter = 0;

export const getNextNodeLabel = (): string => (nodeIdCounter++).toString();
export const resetNodeIdCounter = (value = 0): void => { nodeIdCounter = value; };

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
    hover: canHover,
    multiselect: true,
    selectable: true,
  },
  manipulation: {
    enabled: false,
    addNode: (data: any, callback: any) => {
      data.label = getNextNodeLabel();
      callback(data);
      document.dispatchEvent(AddNodeEvent);
    },
    addEdge: (data: any, callback: any) => {
      callback(data);
      document.dispatchEvent(AddEdgeEvent);
    },
  }
};


// Algorithm options
export const algorithms = [
  { id: 'kernighan-lin', name: 'Kernighan-Lin', description: 'KernighanLinDescription' },
  { id: 'fiduccia-mattheyses', name: 'Fiduccia-Mattheyses', description: 'FiducciaMattheysesDescription' },
  { id: 'metis', name: 'METIS', description: 'MetisDescription' },
];

export type StepSettingMode = 'always' | 'onFirstReach' | 'never';

export const stepSettingModes: StepSettingMode[] = ['always', 'onFirstReach', 'never'];

export const stepSettingLabelKeys: Record<StepSettingMode, string> = {
  always: 'StepSettingAlways',
  onFirstReach: 'StepSettingOnFirstReach',
  never: 'StepSettingNever',
};

export const shouldTriggerOnStep = (mode: StepSettingMode, firstReach: boolean): boolean =>
  mode === 'always' || (mode === 'onFirstReach' && firstReach);