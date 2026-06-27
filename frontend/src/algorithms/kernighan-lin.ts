import { DataSet, Network } from "vis-network/standalone/esm/vis-network";
import { highlightEdges, highlightNodes, moveNode, swapNodePositions } from "../utils/animations";
import { calculateX, calculateY } from "../utils/positioning";
import { generateSetAnchorAnimation } from "../utils/anchoring";
import { resetStats, setInitialCutSize, setFinalCutSize, setPasses, incrementReads, incrementWrites, incrementAdditions, incrementComparisons } from "../utils/stats";
import { startNextPass } from "../utils/startNextPass";

export interface KLNode {
    index: number;
    id: string; // Original ID for mapping back
    dValue: number;
    cValue: Array<number>; // Cost of possible edges to nodes in the other partition
    edges: Array<string | null>; // Original edge IDs for mapping back
    partition: number;
    locked: boolean;
    label: string;
}

export interface KLEdge {
    from: number;
    to: number;
    id: string; // Original edge ID for mapping back
}

export interface Animation {
    animationCallback: () => (timestamp: DOMHighResTimeStamp) => boolean;
    description: string;
    timeBeforeNext: number;
}

export function runKernighanLin(
    network: Network,
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">,
    options: {
        algorithmPasses?: number,
        activeNodeIds?: string[],
        existingPartition?: { [key: string]: number },
        startingAnchorIndex?: number
    } = {}
): {
    partition: { [key: string]: number };
    initialCutSize: number;
    finalCutSize: number;
    animation: Animation[];
} {
    const { algorithmPasses = 0, activeNodeIds = [], existingPartition = {}, startingAnchorIndex = 0 } = options;

    const animation: Animation[] = [];

    const activeNodeIdSet = new Set(activeNodeIds?.filter(Boolean));

    resetStats();

    let anchorIndex = startingAnchorIndex;

    // Convert DataSet to array format with index mapping
    // Time complexity: O(n + m) where n = nodes, m = edges

    const originalNodes = (activeNodeIdSet.size > 0)
        ? nodeDataSet.get([...activeNodeIdSet])
        : nodeDataSet.get();
    const originalEdges = (activeNodeIdSet.size > 0)
        ? edgeDataSet.get().filter(edge => activeNodeIdSet.has(edge.from) && activeNodeIdSet.has(edge.to))
        : edgeDataSet.get();

    console.log('Original nodes and edges fetched from DataSet: ', originalNodes, originalEdges);

    let currentPass = 0;
    let initialCutSize = 0;
    let previousCutSize = originalEdges.length;
    let finalCutSize = originalEdges.length;

    const partitionResult: { [key: string]: number } = {};

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
        cValue: Array<number>(originalNodes.length).fill(0),
        edges: Array<string | null>(originalNodes.length).fill(null),
        partition: existingPartition?.[node.id] ?? (idx % 2), // Initial partitioning: even index -> partition 0, odd index -> partition 1
        locked: false,
        label: node.label
    }));

    if (originalNodes.length === 0 || originalEdges.length === 0) {
        resetStats();
        // Any partition will do
        nodes.forEach(node => {
            partitionResult[node.id] = node.partition;
        });

        setInitialCutSize(0);
        setFinalCutSize(0);
        incrementReads(2); // Reading nodes and edges length
        incrementComparisons(2); // Comparing nodes and edges length to 0

        return {
            partition: partitionResult,
            initialCutSize: 0,
            finalCutSize: 0,
            animation: []
        };
    } else {
        incrementReads(2); // Reading nodes and edges length
        incrementComparisons(2); // Comparing nodes and edges length to 0
    }

    while (startNextPass(algorithmPasses, previousCutSize, finalCutSize, currentPass)) {

        currentPass += 1;
        previousCutSize = finalCutSize;
        finalCutSize = 0;


        // Convert edges to array format using index mapping - O(m)
        const edges: KLEdge[] = originalEdges
            .map(edge => {
                incrementReads(1); // Reading from edgeDataSet

                const fromIdx = idToIndex.get(edge.from);
                const toIdx = idToIndex.get(edge.to);

                if (fromIdx === undefined || toIdx === undefined) {
                    console.error(`Edge with id ${edge.id} has invalid node references: from ${edge.from} to ${edge.to}`);
                    return null;
                }

                nodes[fromIdx!].cValue[toIdx!] = 1; // Assuming unweighted graph, cost = 1
                nodes[toIdx!].cValue[fromIdx!] = 1; // Undirected graph

                nodes[fromIdx!].edges[toIdx!] = edge.id; // Animation only use
                nodes[toIdx!].edges[fromIdx!] = edge.id;

                if (nodes[fromIdx!].partition !== nodes[toIdx!].partition) {
                    nodes[fromIdx!].dValue += 1;
                    nodes[toIdx!].dValue += 1;
                } else {
                    nodes[fromIdx!].dValue -= 1;
                    nodes[toIdx!].dValue -= 1;
                }

                incrementReads(2); // Reading dValues for increment
                incrementWrites(4); // Writing cValues and dValues for both nodes
                incrementComparisons(1); // Comparison for partition check

                return { from: fromIdx, to: toIdx, id: edge.id };
            })
            .filter((edge): edge is KLEdge => edge !== null);

        // Initial cut size calculation
        if (currentPass === 1) {
            edges.forEach(edge => {
                if (nodes[edge.from].partition !== nodes[edge.to].partition) {
                    initialCutSize += 1;
                }
            });
            previousCutSize = initialCutSize;
        }

        setInitialCutSize(initialCutSize);

        const exchangePairs: Array<{ a: number; b: number; gain: number }> = [];

        const partitionA: number[] = [];
        const partitionB: number[] = [];

        const lockedNodesA: number[] = [];
        const lockedNodesB: number[] = [];

        const totalInitialPartitionTime = 4000;

        const moveTime = totalInitialPartitionTime / nodes.length;

        nodes.forEach(node => {
            if (node.partition === 0) {
                partitionA.push(node.index);

                if (currentPass === 1) {
                    const currentIndex = partitionA.length - 1;
                    animation.push({
                        animationCallback: () => {
                            return moveNode(network, node.id, calculateX(currentIndex, 0, nodes.length), calculateY(currentIndex, 0, nodes.length), 500);
                        },
                        description: `Move node ${node.id} to partition A`,
                        timeBeforeNext: moveTime
                    });
                }

            } else {
                partitionB.push(node.index);

                if (currentPass === 1) {
                    const currentIndex = partitionB.length - 1;
                    animation.push({
                        animationCallback: () => {
                            return moveNode(network, node.id, calculateX(currentIndex, 1, nodes.length), calculateY(currentIndex, 1, nodes.length), 500);
                        },
                        description: `Move node ${node.id} to partition B`,
                        timeBeforeNext: moveTime
                    });
                }

            }
        });

        if (currentPass === 1 && (partitionA.length - partitionB.length > 1 || partitionB.length - partitionA.length > 1)) {
            console.warn(`Initial partitioning is unbalanced: Partition A has ${partitionA.length} nodes, Partition B has ${partitionB.length} nodes.`);
        }

        if (currentPass === 1) {
            animation[animation.length - 1].timeBeforeNext = 500;

            animation.push(generateSetAnchorAnimation({ anchorIndex: anchorIndex++, textKey: 'KLInitialPartitioning' }, currentPass === 1));
        }

        const dValueUpdates = nodes.map(node => (
            {
                id: node.id,
                label: `${node.label} ${node.locked ? '' : `(dValue = ${node.dValue})`}`
            }
        ));
        animation.push({
            animationCallback: () => {
                network.fit();
                nodeDataSet.update(dValueUpdates);
                return () => { return true; };
            },
            description: `Initial partitioning complete`,
            timeBeforeNext: 1000
        });

        animation.push(generateSetAnchorAnimation({ anchorIndex: anchorIndex++, textKey: 'KLFirstSortingStep' }, currentPass === 1));

        for (let i = 0; i < Math.floor(nodes.length / 2); i++) {

            if (i > 0) {
                animation.push(generateSetAnchorAnimation({ anchorIndex: anchorIndex++, textKey: 'KLSortingStep' }, false));
            }
            let maxGain = undefined;
            partitionA.sort((a, b) => {
                incrementReads(2); // Reading dValues for comparison
                incrementComparisons(1); // Comparison for sorting
                return nodes[b].dValue - nodes[a].dValue
            });
            partitionB.sort((a, b) => {
                incrementReads(2); // Reading dValues for comparison
                incrementComparisons(1); // Comparison for sorting
                return nodes[b].dValue - nodes[a].dValue
            });

            [...lockedNodesA, ...partitionA].forEach((nodeIdx, idx) => {
                const moveTime = 100;
                const currentNodeIdx = nodeIdx;
                const currentIdx = idx;
                animation.push({
                    animationCallback: () => {
                        return moveNode(network, nodes[currentNodeIdx].id, calculateX(currentIdx, 0, nodes.length), calculateY(currentIdx, 0, nodes.length), 5 * moveTime);
                    },
                    description: `Sort node ${nodes[currentNodeIdx].id} in partition A`,
                    timeBeforeNext: 0
                });
            });

            [...lockedNodesB, ...partitionB].forEach((nodeIdx, idx) => {
                const moveTime = 100;
                const currentNodeIdx = nodeIdx;
                const currentIdx = idx;
                animation.push({
                    animationCallback: () => {
                        return moveNode(network, nodes[currentNodeIdx].id, calculateX(currentIdx, 1, nodes.length), calculateY(currentIdx, 1, nodes.length), 5 * moveTime);
                    },
                    description: `Sort node ${nodes[currentNodeIdx].id} in partition B`,
                    timeBeforeNext: 0
                });
            });

            animation[animation.length - 1].timeBeforeNext = 1000;

            animation.push(generateSetAnchorAnimation({ anchorIndex: anchorIndex++, textKey: 'KLInitialPair' }, i === 0 && currentPass === 1));

            let idxA = 0;
            let idxB = 0;

            let bestSwap: { a: number, b: number } | undefined = undefined;

            const initialNodeA = nodes[partitionA[idxA]];
            const initialNodeB = nodes[partitionB[idxB]];

            animation.push({
                animationCallback: () => {
                    return highlightNodes(nodeDataSet, [initialNodeA.id, initialNodeB.id], '#FFA500', '#FFFF40', 5, { color: { highlight: 1000, hold: 0, fade: 0 }, width: { highlight: 350, hold: 400, fade: 250 } }, true);
                },
                description: `Highlight nodes ${initialNodeA.id} and ${initialNodeB.id}`,
                timeBeforeNext: 1000
            });

            // TODO: RECHECK DECREASING LOGIC
            incrementReads(3);
            incrementComparisons(1); // Error correcting for when the while loop finishes without entering due to maxGain condition
            while (idxA < partitionA.length && idxB < partitionB.length && (maxGain === undefined || nodes[partitionA[idxA]].dValue + nodes[partitionB[idxB]].dValue > maxGain)) {
                incrementReads(3); // Reading dValues and maxGain
                incrementComparisons(1); // Comparison for while loop condition

                const nodeA = nodes[partitionA[idxA]];
                const nodeB = nodes[partitionB[idxB]];

                if (idxA + idxB === 1 && i === 0) {
                    animation.push(generateSetAnchorAnimation({ anchorIndex: anchorIndex++, textKey: 'KLComparison' }, currentPass === 1));
                }

                const gain = nodeA.dValue + nodeB.dValue - 2 * nodeA.cValue[nodeB.index];

                incrementReads(3); // Reading dValues and cValue for gain calculation
                incrementAdditions(2); // Adding dValues and shifted cValue

                let previousBestSwap = undefined;
                if (maxGain === undefined || gain > maxGain) {
                    maxGain = gain;
                    previousBestSwap = bestSwap !== undefined ? bestSwap : null;
                    bestSwap = { a: nodeA.index, b: nodeB.index };
                    incrementWrites(1);
                }

                incrementComparisons(1); // Comparison for maxGain update

                const greenEdges: Array<string> = [];
                const redEdges: Array<string> = [];
                for (let j = 0; j < nodes.length; j++) {
                    if (j === nodeA.index || j === nodeB.index || nodeA.edges[j] === nodeB.edges[j]) continue;
                    if (nodeA.edges[j]) {
                        const edgeId = nodeA.edges[j];
                        const samePartition = nodes[j].partition === nodeA.partition;
                        if (samePartition) {
                            redEdges.push(edgeId!);
                        } else {
                            greenEdges.push(edgeId!);
                        }
                    }
                    if (nodeB.edges[j]) {
                        const edgeId = nodeB.edges[j];
                        const samePartition = nodes[j].partition === nodeB.partition;
                        if (samePartition) {
                            redEdges.push(edgeId!);
                        } else {
                            greenEdges.push(edgeId!);
                        }
                    }
                }

                if (greenEdges.length > 0) {
                    animation.push({
                        animationCallback: () => {
                            return highlightEdges(edgeDataSet, greenEdges, '#00FF00', 5, { color: { highlight: 600, hold: 1000, fade: 400 }, width: { highlight: 500, hold: 1000, fade: 400 } });
                        },
                        description: `Highlight green edges`,
                        timeBeforeNext: 0
                    });
                }
                if (redEdges.length > 0) {
                    animation.push({
                        animationCallback: () => {
                            return highlightEdges(edgeDataSet, redEdges, '#FF0000', 5, { color: { highlight: 600, hold: 1000, fade: 400 }, width: { highlight: 500, hold: 1000, fade: 400 } });
                        },
                        description: `Highlight red edges`,
                        timeBeforeNext: 0
                    });
                }
                // Guaranteed delay
                animation.push({
                    animationCallback: () => {
                        return () => true;
                    },
                    description: `Guaranteed delay`,
                    timeBeforeNext: 2000
                });

                // Make current best swap purple and unhighlight previous best swap if exists
                if (previousBestSwap !== undefined) {
                    const highlightNodeIdA = nodes[partitionA[idxA]].id;
                    const highlightNodeIdB = nodes[partitionB[idxB]].id;
                    if (previousBestSwap !== null) {
                        const unhighlightNodeIdA = nodes[previousBestSwap.a].id;
                        const unhighlightNodeIdB = nodes[previousBestSwap.b].id;
                        animation.push({
                            animationCallback: () => {
                                return highlightNodes(nodeDataSet, [unhighlightNodeIdA, unhighlightNodeIdB], '#FF0000', '#FF8080', 5, { color: { highlight: 0, hold: 0, fade: 0 }, width: { highlight: 0, hold: 0, fade: 0 } });
                            },
                            description: `Unhighlight previous best swap nodes`,
                            timeBeforeNext: 0
                        });
                    }
                    animation.push({
                        animationCallback: () => {
                            return highlightNodes(nodeDataSet, [highlightNodeIdA, highlightNodeIdB], '#800080', '#D8BFD8', 5, { color: { highlight: 1000, hold: 0, fade: 0 }, width: { highlight: 350, hold: 400, fade: 250 } }, true);
                        },
                        description: `Highlight current best swap nodes ${highlightNodeIdA} and ${highlightNodeIdB}`,
                        timeBeforeNext: 1000
                    });
                }

                animation.push(generateSetAnchorAnimation({ anchorIndex: anchorIndex++, textKey: 'KLNextPair' }, (idxA === 0 && idxB === 0 && i === 0) && currentPass === 1));

                // TODO add cancel fn returning
                if (idxA + 1 < partitionA.length && (idxB + 1 >= partitionB.length || nodeA.dValue - nodes[partitionA[idxA + 1]]?.dValue < nodeB.dValue - nodes[partitionB[idxB + 1]]?.dValue)) {
                    idxA++;
                    if (idxA >= partitionA.length || nodes[partitionA[idxA]].dValue + nodes[partitionB[idxB]].dValue <= maxGain) continue;
                    const nextIdx = idxA;
                    const highlightNodeId = nodes[partitionA[nextIdx]].id;
                    const shouldUnhighlight: boolean = bestSwap?.a !== nodeA.index;
                    animation.push({
                        animationCallback: () => {
                            const stepFn1 = (shouldUnhighlight)
                                ? highlightNodes(nodeDataSet, [nodeA.id], '#2B7CE9', '#97C2FC', 1, { color: { highlight: 1000, hold: 0, fade: 0 }, width: { highlight: 1000, hold: 0, fade: 0 } })
                                : highlightNodes(nodeDataSet, [nodeA.id], '#300030', '#886F88', 1, { color: { highlight: 0, hold: 0, fade: 0 }, width: { highlight: 0, hold: 0, fade: 0 } }, true);;
                            const stepFn2 = highlightNodes(nodeDataSet, [highlightNodeId], '#FFA500', '#FFFF40', 5, { color: { highlight: 1000, hold: 0, fade: 0 }, width: { highlight: 350, hold: 400, fade: 250 } }, true);
                            return (timestamp: DOMHighResTimeStamp) => {
                                const step1Done = stepFn1(timestamp);
                                const step2Done = stepFn2(timestamp);
                                return step1Done && step2Done;
                            };
                        },
                        description: `Unhighlight node ${nodeA.id} and highlight node ${highlightNodeId}`,
                        timeBeforeNext: 1000
                    });
                } else {
                    idxB++;
                    if (idxB >= partitionB.length || nodes[partitionA[idxA]].dValue + nodes[partitionB[idxB]].dValue <= maxGain) continue;
                    const nextIdx = idxB;
                    const highlightNodeId = nodes[partitionB[nextIdx]].id;
                    const shouldUnhighlight: boolean = bestSwap?.b !== nodeB.index;
                    animation.push({
                        animationCallback: () => {
                            const stepFn1 = (shouldUnhighlight)
                                ? highlightNodes(nodeDataSet, [nodeB.id], '#2B7CE9', '#97C2FC', 1, { color: { highlight: 1000, hold: 0, fade: 0 }, width: { highlight: 1000, hold: 0, fade: 0 } })
                                : highlightNodes(nodeDataSet, [nodeB.id], '#300030', '#886F88', 1, { color: { highlight: 0, hold: 0, fade: 0 }, width: { highlight: 0, hold: 0, fade: 0 } }, true);;
                            const stepFn2 = highlightNodes(nodeDataSet, [highlightNodeId], '#FFA500', '#FFFF40', 5, { color: { highlight: 1000, hold: 0, fade: 0 }, width: { highlight: 350, hold: 400, fade: 250 } }, true);
                            return (timestamp: DOMHighResTimeStamp) => {
                                const step1Done = stepFn1(timestamp);
                                const step2Done = stepFn2(timestamp);
                                return step1Done && step2Done;
                            };
                        },
                        description: `Unhighlight node ${nodeB.id} and highlight node ${highlightNodeId}`,
                        timeBeforeNext: 1000
                    });
                }
                incrementReads(4); // Reading dValues for comparison
                incrementAdditions(2); // Adding dValues for comparison
                incrementComparisons(1); // Comparisons for if conditions
            }

            const nodesToCleanUp = [...partitionA, ...partitionB].map(idx => nodes[idx].id).filter(id => id !== nodes[bestSwap!.a].id && id !== nodes[bestSwap!.b].id);
            if (nodesToCleanUp.length > 0)
                animation.push({
                    animationCallback: () => {
                        return highlightNodes(nodeDataSet, nodesToCleanUp, '#FF0000', '#FF8080', 5, { color: { highlight: 0, hold: 0, fade: 0 }, width: { highlight: 0, hold: 0, fade: 0 } }, false);
                    },
                    description: `Unhighlight all nodes except swapped ones`,
                    timeBeforeNext: 1000
                })

            animation.push(generateSetAnchorAnimation({ anchorIndex: anchorIndex++, textKey: 'KLPerformBestSwap' }, i === 0 && currentPass === 1));

            exchangePairs.push({ a: bestSwap!.a, b: bestSwap!.b, gain: maxGain! });

            // Lock nodes
            nodes[bestSwap!.a].locked = true;
            nodes[bestSwap!.b].locked = true;

            incrementWrites(2); // Locking nodes

            // Swap partitions
            nodes[bestSwap!.a].partition = 1;
            nodes[bestSwap!.b].partition = 0;

            incrementWrites(2); // Swapping partitions

            // Update dValues
            nodes.forEach(node => {
                if (!node.locked) {
                    node.dValue += (node.partition === 0 ? 2 : -2) * (nodes[bestSwap!.a].cValue[node.index] - nodes[bestSwap!.b].cValue[node.index]);
                    incrementReads(4); // Reading cValues for dValue update
                    incrementWrites(1); // Writing updated dValue
                    incrementAdditions(2); // Adding cValues and then the dValue
                    incrementComparisons(1); // Comparing partition
                }
            });

            // Remove locked nodes from partitions
            partitionA.splice(partitionA.indexOf(bestSwap!.a), 1);
            partitionB.splice(partitionB.indexOf(bestSwap!.b), 1);

            lockedNodesA.push(bestSwap!.b);
            lockedNodesB.push(bestSwap!.a);

            const swapTime = 2000;

            const dValueUpdates = nodes.map(node => (
                {
                    id: node.id,
                    label: `${node.label} ${node.locked ? '' : `(dValue = ${node.dValue})`}`
                }
            ));
            animation.push({
                animationCallback: () => {
                    nodeDataSet.update(dValueUpdates);
                    return () => { return true; };
                },
                description: `dValues updated`,
                timeBeforeNext: 0
            });

            animation.push({
                animationCallback: () => {
                    const stepFn1 = highlightNodes(nodeDataSet, [nodes[bestSwap!.a].id, nodes[bestSwap!.b].id], '#999999', '#CCCCCC', 1, { color: { highlight: 0, hold: 0, fade: 0 }, width: { highlight: 0, hold: 0, fade: 0 } }, true);
                    const stepFn2 = swapNodePositions(network, nodes[bestSwap!.a].id, nodes[bestSwap!.b].id, swapTime * (0.6666666667));
                    return (timestamp: DOMHighResTimeStamp) => {
                        const step1Done = stepFn1(timestamp);
                        const step2Done = stepFn2(timestamp);
                        return step1Done && step2Done;
                    }
                },
                description: `Swap nodes ${nodes[bestSwap!.a].id} and ${nodes[bestSwap!.b].id}`,
                timeBeforeNext: swapTime
            });
        }

        animation.push(generateSetAnchorAnimation({ anchorIndex: anchorIndex++, textKey: 'KLRollbackBestIteration' }, currentPass === 1));

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
                incrementWrites(2); // Updating maxCumulativeGain
            }
            incrementReads(2); // Reading cumulative gain for comparison
            incrementComparisons(1); // Comparing cumulative gain
        });

        // Undo swaps beyond k

        for (let i = exchangePairs.length - 1; i > k; i--) {

            const pair = exchangePairs[i];

            incrementReads(1)

            nodes[pair.a].partition = 0;
            nodes[pair.b].partition = 1;

            incrementWrites(2); // Undoing partitions

            const swapTime = 150;
            animation.push({
                animationCallback: () => {
                    return swapNodePositions(network, nodes[pair.a].id, nodes[pair.b].id, 2 * swapTime);
                },
                description: `Swap nodes ${nodes[pair.a].id} and ${nodes[pair.b].id}`,
                timeBeforeNext: swapTime
            });
        }

        // Remove dValue annotations
        {
            const dValueUpdates = nodes.map(node => (
                {
                    id: node.id,
                    label: node.label
                }
            ));
            animation.push({
                animationCallback: () => {
                    nodeDataSet.update(dValueUpdates);
                    return () => { return true; };
                },
                description: `Remove dValue annotations`,
                timeBeforeNext: 0
            });
        }

        // Unlock all nodes and changes colors back to normal after highlighting to light green (border is a little darker)

        const nodeIds: string[] = [];
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].locked = false;
            nodes[i].dValue = 0;
            nodeIds.push(nodes[i].id);
        }

        incrementWrites(nodes.length * 2); // Unlocking nodes and resetting dValues

        animation.push({
            animationCallback: () => {
                return highlightNodes(nodeDataSet, nodeIds, '#2EFF57', '#90FF90', 2, { color: { highlight: 600, hold: 50, fade: 600 }, width: { highlight: 600, hold: 50, fade: 600 } });
            },
            description: `Unlock nodes`,
            timeBeforeNext: 1250
        });

        // Final cut size calculation
        edges.forEach(edge => {
            if (nodes[edge.from].partition !== nodes[edge.to].partition) {
                finalCutSize += 1;
            }
        });

    }

    setFinalCutSize(finalCutSize);
    setPasses(currentPass);

    // Map partitions back to original IDs
    nodes.forEach(node => {
        partitionResult[node.id] = node.partition;
    });

    return {
        partition: partitionResult,
        initialCutSize: initialCutSize,
        finalCutSize: finalCutSize,
        animation
    };
}