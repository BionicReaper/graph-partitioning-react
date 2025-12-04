import { DataSet, Network } from "vis-network/standalone/esm/vis-network";
import { moveNode } from "../utils/animations";

export interface KLNode {
    index: number;
    id: string; // Original ID for mapping back
    dValue: number;
    cValue: Array<number>; // Cost of possible edges to nodes in the other partition
    partition: number;
    locked: boolean;
}

export interface KLEdge {
    from: number;
    to: number;
    id: string; // Original edge ID for mapping back
}


export function runKernighanLin(
    network: Network,
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">
): {
    partition: { [key: string]: number };
    cutSize: number;
    animation: Array<{
        animationCallback: () => () =>void;
        description: string;
        timeBeforeNext: number;
    }>;
} {
    // Convert DataSet to array format with index mapping
    // Time complexity: O(n + m) where n = nodes, m = edges

    const originalNodes = nodeDataSet.get();
    const originalEdges = edgeDataSet.get();

    // Create ID to index mapping - O(n)
    const idToIndex = new Map<number | string, number>();
    originalNodes.forEach((node, idx) => {
        idToIndex.set(node.id, idx);
    });

    // Convert nodes to array format - O(n)
    const nodes: KLNode[] = originalNodes.map((node, idx) => ({
        index: idx,
        id: node.id,
        dValue: 0,
        cValue: Array(originalNodes.length).fill(0),
        partition: idx % 2, // Initial partitioning: even index -> partition 0, odd index -> partition 1
        locked: false,
    }));


    // Convert edges to array format using index mapping - O(m)
    const edges: KLEdge[] = originalEdges
        .map(edge => {
            const fromIdx = idToIndex.get(edge.from);
            const toIdx = idToIndex.get(edge.to);

            nodes[fromIdx!].cValue[toIdx!] = 1; // Assuming unweighted graph, cost = 1
            nodes[toIdx!].cValue[fromIdx!] = 1; // Undirected graph

            if (nodes[fromIdx!].partition !== nodes[toIdx!].partition) {
                nodes[fromIdx!].dValue += 1;
                nodes[toIdx!].dValue += 1;
            } else {
                nodes[fromIdx!].dValue -= 1;
                nodes[toIdx!].dValue -= 1;
            }

            if (fromIdx !== undefined && toIdx !== undefined) {
                return { from: fromIdx, to: toIdx, id: edge.id };
            }
            return null;
        })
        .filter((edge): edge is KLEdge => edge !== null);

    const exchangePairs: Array<{ a: number; b: number; gain: number }> = [];

    const partitionA: number[] = [];
    const partitionB: number[] = [];

    nodes.forEach(node => {
        if (node.partition === 0) {
            partitionA.push(node.index);
        } else {
            partitionB.push(node.index);
        }
    });

    for (let i = 0; i < Math.floor(nodes.length / 2); i++) {
        let maxGain = undefined;
        partitionA.sort((a, b) => nodes[b].dValue - nodes[a].dValue);
        partitionB.sort((a, b) => nodes[b].dValue - nodes[a].dValue);

        let idxA = 0;
        let idxB = 0;

        let bestSwap: { a: number, b: number };

        // TODO: RECHECK DECREASING LOGIC
        while (idxA < partitionA.length && idxB < partitionB.length && (!maxGain || nodes[partitionA[idxA]].dValue + nodes[partitionB[idxB]].dValue > maxGain)) {
            const nodeA = nodes[partitionA[idxA]];
            const nodeB = nodes[partitionB[idxB]];

            const gain = nodeA.dValue + nodeB.dValue - 2 * nodeA.cValue[nodeB.index];
            if (maxGain === undefined || gain > maxGain) {
                maxGain = gain;
                bestSwap = { a: nodeA.index, b: nodeB.index };
            }

            if (nodeA.dValue - nodes[partitionA[idxA + 1]]?.dValue < nodeB.dValue - nodes[partitionB[idxB + 1]]?.dValue || idxB + 1 >= partitionA.length) {
                idxA++;
            } else {
                idxB++;
            }
        }

        exchangePairs.push({ a: bestSwap!.a, b: bestSwap!.b, gain: maxGain! });

        // Lock nodes
        nodes[bestSwap!.a].locked = true;
        nodes[bestSwap!.b].locked = true;

        // Swap partitions
        nodes[bestSwap!.a].partition = 1;
        nodes[bestSwap!.b].partition = 0;

        // Update dValues
        nodes.forEach(node => {
            if (!node.locked) {
                node.dValue += (node.partition === 0 ? 2 : -2) * (nodes[bestSwap!.a].cValue[node.index] - nodes[bestSwap!.b].cValue[node.index]);
            }
        });

        // Remove locked nodes from partitions
        partitionA.splice(partitionA.indexOf(bestSwap!.a), 1);
        partitionB.splice(partitionB.indexOf(bestSwap!.b), 1);


    }

    // Calculate cumulative gains
    const cumulativeGains: number[] = [];
    let cumulative = 0;
    exchangePairs.forEach(pair => {
        cumulative += pair.gain;
        cumulativeGains.push(cumulative);
    });

    // Find k that maximizes the cumulative gain
    let maxCumulativeGain: number | undefined = undefined;
    let k = -1;
    cumulativeGains.forEach((gain, index) => {
        if (maxCumulativeGain === undefined || gain > maxCumulativeGain) {
            maxCumulativeGain = gain;
            k = index;
        }
    });

    // Undo swaps beyond k
    for (let i = exchangePairs.length - 1; i > k; i--) {
        const pair = exchangePairs[i];
        nodes[pair.a].partition = 0;
        nodes[pair.b].partition = 1;
    }

    // Map partitions back to original IDs
    const partitionResult: { [key: string]: number } = {};
    nodes.forEach(node => {
        partitionResult[node.id] = node.partition;
    });

    // Final cut size calculation
    let cutSize = 0;
    edges.forEach(edge => {
        if (nodes[edge.from].partition !== nodes[edge.to].partition) {
            cutSize += 1;
        }
    });

    return {
        partition: partitionResult,
        cutSize: cutSize,
        animation: [
            {
                animationCallback: () => {
                    return moveNode(network, nodes[0].id, 100, 100, 1000);
                },
                description: "Move node animation",
                timeBeforeNext: 4000
            },
            {
                animationCallback: () => {
                    return moveNode(network, nodes[1].id, 200, 200, 1000);
                },
                description: "Move another node animation",
                timeBeforeNext: 1500
            }
        ] // Placeholder for animation steps
    };
}