import { DataSet } from "vis-network/standalone/esm/vis-network";
import { getNextNodeLabel, resetNodeIdCounter } from "./constants";
import { calculateX, calculateY } from "./positioning";

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
  let currentIndexA = 0;
  let currentIndexB = 0;

  const nodeRecords = Array.from({ length: nodeCount }, () => {
    const nextLabel = getNextNodeLabel();
    const currentIndex = 
      (Number(nextLabel) % 2 === 0)
        ? currentIndexA++
        : currentIndexB++;
    return {
      label: nextLabel,
      x: calculateX(currentIndex, Number(nextLabel) % 2, nodeCount),
      y: calculateY(currentIndex, Number(nextLabel) % 2, nodeCount)
    }
  });
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
