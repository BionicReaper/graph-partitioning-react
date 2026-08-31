import { DataSet } from "vis-network/standalone/esm/vis-network";
import { getNextNodeLabel, resetNodeIdCounter } from "./constants";
import { calculateX, calculateY } from "./positioning";

export type GraphGenerationOptions =
  | {
      mode: 'uniform';
      nodeCount: number;
      edgeProbability: number;
    }
  | {
      mode: 'regions';
      regionNodeCounts: [number, number];
      intraRegionProbability: number;
      interRegionProbability: number;
    };

export function generateRandomGraph(
  nodeDataSet: DataSet<any, "id">,
  edgeDataSet: DataSet<any, "id">,
  nodeCount: number,
  edgeProbability: number
): void {
  const count = Math.max(0, Math.floor(nodeCount));
  const probability = Math.min(1, Math.max(0, edgeProbability));

  edgeDataSet.clear();
  nodeDataSet.clear();
  resetNodeIdCounter(0);

  let currentIndexA = 0;
  let currentIndexB = 0;

  const nodeRecords = Array.from({ length: count }, () => {
    const nextLabel = getNextNodeLabel();
    const currentIndex = 
      (Number(nextLabel) % 2 === 0)
        ? currentIndexA++
        : currentIndexB++;
    return {
      label: nextLabel,
      x: calculateX(currentIndex, Number(nextLabel) % 2, count),
      y: calculateY(currentIndex, Number(nextLabel) % 2, count)
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

export function generateRegionGraph(
  nodeDataSet: DataSet<any, "id">,
  edgeDataSet: DataSet<any, "id">,
  regionNodeCounts: [number, number],
  intraRegionProbability: number,
  interRegionProbability: number
): void {
  const counts = regionNodeCounts.map((count) => Math.max(0, Math.floor(count)));
  const intraProbability = Math.min(1, Math.max(0, intraRegionProbability));
  const interProbability = Math.min(1, Math.max(0, interRegionProbability));

  edgeDataSet.clear();
  nodeDataSet.clear();
  resetNodeIdCounter(0);

  const nodeRecords = counts.flatMap((count, region) =>
    Array.from({ length: count }, (_, currentIndex) => ({
      label: getNextNodeLabel(),
      x: calculateX(currentIndex, region, 2 * count),
      y: calculateY(currentIndex, region, 2 * count)
    }))
  );
  const nodeRegions = counts.flatMap((count, region) => Array.from({ length: count }, () => region));
  const nodeIds = nodeDataSet.add(nodeRecords);

  const edgeRecords: { from: any; to: any }[] = [];
  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      const probability = (nodeRegions[i] === nodeRegions[j]) ? intraProbability : interProbability;
      if (Math.random() < probability) {
        edgeRecords.push({ from: nodeIds[i], to: nodeIds[j] });
      }
    }
  }
  edgeDataSet.add(edgeRecords);
}
