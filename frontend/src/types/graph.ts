// Type definitions for graph data structures

export interface Node {
  id: number;
  label: string;
  x?: number;
  y?: number;
  color?: {
    border?: string;
    background?: string;
    highlight?: {
      border?: string;
      background?: string;
    };
  };
}

export interface Edge {
  id: string;
  from: number;
  to: number;
  color?: {
    color?: string;
  };
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export interface PartitionResult {
  partition: number[];
  cutSize: number;
}

export type AlgorithmType =
  | 'kernighan-lin'
  | 'fiduccia-mattheyses'
  | 'metis';
