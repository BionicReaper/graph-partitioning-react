import { DataSet, Network } from "vis-network/standalone/esm/vis-network";
import { highlightNodes, moveNode, swapNodePositions } from "../utils/animations";
import { calculateX, calculateY } from "../utils/positioning";
import { timeDecayFactor } from "../utils/interpolation";

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

export interface Animation {
    animationCallback: () => () => void;
    description: string;
    timeBeforeNext: number;
}

export function runKernighanLin(
    network: Network,
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">
): {
    partition: { [key: string]: number };
    cutSize: number;
    animation: Animation[];
} {
    let decayFactor: number;
    let time: number;

    const animation: Animation[] = [];

    animation.push({
        animationCallback: () => {
            network.unselectAll();
            network.disableEditMode();
            network.setOptions(
                {
                    physics: {
                        enabled: false
                    },
                    interaction: {
                        dragNodes: false,
                        dragView: true,
                        zoomView: true,
                        multiselect: false,
                        hover: false,
                        selectable: false,
                    }
                }
            );
            return () => { };
        },
        description: `Disable interaction and physics`,
        timeBeforeNext: 0
    });

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

    decayFactor = timeDecayFactor(1000, 100);
    time = 100;
    nodes.forEach(node => {
        if (node.partition === 0) {
            partitionA.push(node.index);
            const currentIndex = partitionA.length - 1;
            animation.push({
                animationCallback: () => {
                    return moveNode(network, node.id, calculateX(currentIndex, 0, nodes.length), calculateY(currentIndex, 0, nodes.length), 500);
                },
                description: `Move node ${node.id} to partition A`,
                timeBeforeNext: time > 1 ? time : 1
            });
        } else {
            partitionB.push(node.index);
            const currentIndex = partitionB.length - 1;
            animation.push({
                animationCallback: () => {
                    return moveNode(network, node.id, calculateX(currentIndex, 1, nodes.length), calculateY(currentIndex, 1, nodes.length), 500);
                },
                description: `Move node ${node.id} to partition B`,
                timeBeforeNext: time > 1 ? time : 1
            });
        }
        time = time * decayFactor;
    });

    animation[animation.length - 1].timeBeforeNext = 500;

    animation.push({
        animationCallback: () => {
            network.setOptions(
                {
                    physics: {
                        enabled: false
                    },
                    interaction: {
                        dragNodes: false,
                        dragView: false,
                        zoomView: false,
                        multiselect: false,
                        hover: false,
                        selectable: false,
                    }
                }
            );
            network.fit();
            return () => { };
        },
        description: `Initial partitioning complete`,
        timeBeforeNext: 1000
    });

    decayFactor = timeDecayFactor(30000, 1500);
    time = 1500;
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

        animation.push({
            animationCallback: () => {
                nodeDataSet.update([
                    { id: nodes[bestSwap!.a].id, color: { background: '#CCCCCC', border: '#999999' } },
                    { id: nodes[bestSwap!.b].id, color: { background: '#CCCCCC', border: '#999999' } }
                ]);
                return swapNodePositions(network, nodes[bestSwap!.a].id, nodes[bestSwap!.b].id, 1000);
            },
            description: `Swap nodes ${nodes[bestSwap!.a].id} and ${nodes[bestSwap!.b].id}`,
            timeBeforeNext: time > 1 ? time : 1
        });

        time = time * decayFactor;
    }

    // Calculate cumulative gains
    const cumulativeGains: number[] = [];
    let cumulative = 0;
    exchangePairs.forEach(pair => {
        cumulative += pair.gain;
        cumulativeGains.push(cumulative);
    });

    // Find k that maximizes the cumulative gain
    let maxCumulativeGain: number = 0;
    let k = -1;
    cumulativeGains.forEach((gain, index) => {
        if (gain > maxCumulativeGain) {
            maxCumulativeGain = gain;
            k = index;
        }
    });

    // Undo swaps beyond k
    decayFactor = timeDecayFactor(3000, 300);
    time = 300;
    for (let i = exchangePairs.length - 1; i > k; i--) {
        console.log(time);
        const pair = exchangePairs[i];
        nodes[pair.a].partition = 0;
        nodes[pair.b].partition = 1;

        animation.push({
            animationCallback: () => {
                return swapNodePositions(network, nodes[pair.a].id, nodes[pair.b].id, time > 2 ? time : 2);
            },
            description: `Swap nodes ${nodes[pair.a].id} and ${nodes[pair.b].id}`,
            timeBeforeNext: time / 2 > 1 ? time / 2 : 1
        });

        time = time * decayFactor;
    }

    // Unlock all nodes and changes colors back to normal after highlighting to light green (border is a little darker)

    const nodeIds: string[] = nodes.map(node => node.id);
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].locked = false;
        nodeIds.push(nodes[i].id);
    }
    animation.push({
        animationCallback: () => {
            return highlightNodes(nodeDataSet, nodeIds, '#2EFF57', '#90FF90', 2, { color: { highlight: 600, hold: 50, fade: 600 }, width: { highlight: 600, hold: 50, fade: 600 } });
        },
        description: `Unlock nodes`,
        timeBeforeNext: 0
    });

    animation[animation.length - 1].timeBeforeNext = 150 * (exchangePairs.length - k) + 1250 + 20000;

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
        animation
    };
}