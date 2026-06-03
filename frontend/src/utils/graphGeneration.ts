import { DataSet } from "vis-network/standalone/esm/vis-network";
import { getNextNodeLabel, resetNodeIdCounter } from "./constants";

export function generateRandomGraph(
  nodeDataSet: DataSet<any, "id">,
  edgeDataSet: DataSet<any, "id">,
  minNodes: number,
  maxNodes: number,
  edgeProbability: number
): void {
  const lo = Math.max(0, Math.min(minNodes, maxNodes));
  const hi = Math.max(0, Math.max(minNodes, maxNodes));
  const probability = Math.min(1, Math.max(0, edgeProbability));

  edgeDataSet.clear();
  nodeDataSet.clear();
  resetNodeIdCounter(0);

  const nodeCount = Math.floor(Math.random() * (hi - lo + 1)) + lo;

  const nodeRecords = Array.from({ length: nodeCount }, () => ({ label: getNextNodeLabel() }));
  const nodeIds = nodeDataSet.add(nodeRecords);

  const edgeRecords: { from: any; to: any }[] = [];
  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      if (Math.random() < probability) {
        edgeRecords.push({ from: nodeIds[i], to: nodeIds[j] });
      }
    }
  }
  edgeDataSet.add(edgeRecords);
}
