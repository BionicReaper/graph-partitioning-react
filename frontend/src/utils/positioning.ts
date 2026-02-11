import { DataSet, Network } from "vis-network/standalone/esm/vis-network";

const centerX = 0;
const centerY = 0;
const baseDistanceBetweenPartitions = 800;
const baseCircleRadius = 300;
const startAngle = Math.PI / 2; // 90 degrees

export const calculateX = (index: number, partition: number, totalNodes: number): number => {
    const nodesInPartition = (partition === 0) ? Math.ceil(totalNodes / 2) : Math.floor(totalNodes / 2);
    
    // Partition 0: left semicircle (π/2 to 3π/2), Partition 1: right semicircle (-π/2 to π/2)
    const angle = (partition === 0)
        ? startAngle + (Math.PI * index) / (nodesInPartition - 1)
        : startAngle - (Math.PI * index) / (nodesInPartition - 1);
    
    // Scale radius and distance with number of nodes
    const scaleFactor = totalNodes / 10;
    const circleRadius = baseCircleRadius * scaleFactor;
    const distanceBetweenPartitions = baseDistanceBetweenPartitions * scaleFactor;
    
    // Offset left for partition 0, right for partition 1
    const partitionOffset = partition === 0 ? -distanceBetweenPartitions / 2 : distanceBetweenPartitions / 2;
    
    return centerX + partitionOffset + circleRadius * Math.cos(angle);
}

export const calculateY = (index: number, partition: number, totalNodes: number): number => {
    const nodesInPartition = (partition === 0) ? Math.ceil(totalNodes / 2) : Math.floor(totalNodes / 2);
    
    // Partition 0: left semicircle (π/2 to 3π/2), Partition 1: right semicircle (π/2 to -π/2)
    const angle = (partition === 0)
        ? startAngle + (Math.PI * index) / (nodesInPartition - 1)
        : startAngle - (Math.PI * index) / (nodesInPartition - 1);
    
    // Scale radius with number of nodes
    const scaleFactor = totalNodes / 10;
    const circleRadius = baseCircleRadius * scaleFactor;
    
    return centerY + circleRadius * Math.sin(angle);
}

export const updateDataSetPositions = (
    network: Network | undefined,
    nodes: DataSet<any, "id">
) => {
    if (!network) return;
    const allPositions = network.getPositions();
    const updates = Object.keys(allPositions || {}).map((nodeId) => ({
      id: nodeId,
      x: allPositions?.[nodeId].x || 0,
      y: allPositions?.[nodeId].y || 0
    }));
    nodes.update(updates);
}