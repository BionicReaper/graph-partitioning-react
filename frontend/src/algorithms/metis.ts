import { DataSet, Network } from "vis-network/standalone/esm/vis-network";
import { animateReplaceEdgeSet, animateSplitCompoundNodes, highlightEdges, highlightNodes, initializeAnimation, moveNode, replaceNodesWithCompoundNode } from "../utils/animations";
import { calculateCirclePoint, calculateX, calculateY } from "../utils/positioning";
import { pushAnchorAnimation } from "../utils/anchoring";
import { AlgorithmOptions } from "../types/algorithms";
import { resetStats, setInitialCutSize, setFinalCutSize, incrementReads, incrementWrites, incrementAdditions, incrementComparisons, stashStats, mergeStats } from "../utils/stats";
import { runFiducciaMattheysesWithMetisBalance } from "./fiduccia-mattheyses";
import { defaultVisOptions } from "../utils/constants";

const MAX_CIRCLE_ORGANIZATION_TIME = 3000;

interface DatasetNode {
    id: string;
    weight?: number;
    label: string;
    size: number;
    x: number;
    y: number;
    color?: {
        border: string;
        background: string;
        highlight: {
            border: string;
            background: string;
        }
    }
    children: [DatasetNode, DatasetNode];
    createdAtLevel?: number;
}

interface DatasetEdge {
    id: string;
    from: string;
    to: string;
    weight?: number;
    label?: string;
    color?: {
        color?: string;
    }
}

export interface Animation {
    animationCallback: () => (timestamp: DOMHighResTimeStamp) => boolean;
    description: string;
    timeBeforeNext: number;
}

function animateCircleOrganization(
    network: Network,
    originalNodes: DatasetNode[],
    animation: Animation[]
): void {
    const circleOrganizationMoveTime = MAX_CIRCLE_ORGANIZATION_TIME / originalNodes.length;

    for (let i = 0; i < originalNodes.length; i++) {
        const nodeId = originalNodes[i].id;
        const {x, y} = calculateCirclePoint(i, originalNodes.length);
        animation.push({
            animationCallback: () => {
                return moveNode(network, nodeId, x, y, circleOrganizationMoveTime);
            },
            description: `Move node ${nodeId} to position (${x}, ${y})`,
            timeBeforeNext: circleOrganizationMoveTime
        });
    }
}

function addWeightLabelsToEdges(edgeDataSet: DataSet<any, "id">): void {
    const edges = edgeDataSet.get();
    edges.forEach(edge => {
        edge.label = edge.weight?.toString() ?? '1';
    });
    edgeDataSet.update(edges);
}

function removeWeightLabelsFromEdges(edgeDataSet: DataSet<any, "id">): void {
    const edges = edgeDataSet.get();
    const edgesWithoutLabels = edges.map(edge => ({ ...edge, label: null }));

    edgeDataSet.clear();
    edgeDataSet.update(edgesWithoutLabels);
}

const NODE_WEIGHT_LABEL_PATTERN = /\s*\(weight = \d+\)$/;

function buildNodeWeightLabel(label: string, weight?: number): string {
    return `${label.replace(NODE_WEIGHT_LABEL_PATTERN, '')} (weight = ${weight ?? 1})`;
}

function addWeightLabelsToNodes(nodeDataSet: DataSet<any, "id">): void {
    const nodes = nodeDataSet.get();
    nodes.forEach(node => {
        node.label = buildNodeWeightLabel(node.label ?? '', node.weight);
    });
    nodeDataSet.update(nodes);
}

function removeWeightLabelsFromNodes(nodeDataSet: DataSet<any, "id">): void {
    const nodes = nodeDataSet.get();
    const nodesWithoutWeightLabels = nodes.map(node => ({
        ...node,
        label: (node.label ?? '').replace(NODE_WEIGHT_LABEL_PATTERN, '')
    }));

    nodeDataSet.update(nodesWithoutWeightLabels);
}

function selectEdgeForMatching(node: DatasetNode, matchedNodeIds: Set<string>, edges: DatasetEdge[], mode: string = "HEM"): DatasetEdge | null {
    if (mode === "HEM") {
        const bestEdge = edges.reduce((best: DatasetEdge | null, edge: DatasetEdge) => {

            const otherNodeId = (edge.from === node.id) ? edge.to : edge.from;

            incrementReads(3);
            incrementComparisons(1);

            incrementComparisons(1);
            if (matchedNodeIds.has(otherNodeId)) {
                return best;
            }

            incrementComparisons(1);
            incrementReads(2);
            if (!best || (edge.weight ?? 1) > (best.weight ?? 1)) {
                return edge;
            } else {
                return best;
            }

        }, null);
        return bestEdge;
    }
    return null;
}

function collapseNodes(
    network: Network,
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">,
    nodesToCollapse: Array<[DatasetNode, DatasetNode, string]>,
    matchedNodeIds: Set<string>,
    nodeRouteMap: Map<string, string>,
    edgesMap: Map<string, Map<string, DatasetEdge>>,
    matchingLevel: number,
    animation: Animation[]
): void {
    const newMatchingLevel = matchingLevel + 1;
    const nodeIdsToDelete = Array.from(matchedNodeIds);

    incrementReads(1);
    incrementAdditions(1);

    const newNodes: DatasetNode[] = [];

    nodesToCollapse.forEach(([nodeA, nodeB, compoundNodeId]) => {
        const compoundNodeWeight = (nodeA.weight ?? 1) + (nodeB.weight ?? 1);

        incrementReads(2);
        incrementAdditions(1);

        const newNode: DatasetNode = {
            id: compoundNodeId,
            label: buildNodeWeightLabel(compoundNodeId, compoundNodeWeight),
            size: ((nodeA.size || defaultVisOptions.nodes.size) + (nodeB.size || defaultVisOptions.nodes.size)) / 2,
            x: nodeA.x,
            y: nodeA.y,
            weight: compoundNodeWeight,
            children: [{...nodeA}, {...nodeB}],
            createdAtLevel: matchingLevel
        };
        newNodes.push(newNode);

        incrementWrites(1);

        const nodeIdTuple = [nodeA.id, nodeB.id];


        animation.push({
            animationCallback: () => {
                return replaceNodesWithCompoundNode(network, nodeIdTuple, newNode, 500);
            },
            description: `Collapse nodes ${nodeA.id} and ${nodeB.id} into compound node ${compoundNodeId}`,
            timeBeforeNext: 0
        });
    });

    animation[animation.length - 1].timeBeforeNext = 500;

    const newEdges: DatasetEdge[] = [];

    const existingEdges = edgeDataSet.get();

    for (const edge of existingEdges) {
        const newFrom = nodeRouteMap.get(`${matchingLevel}|${edge.from}`) ?? edge.from;
        const newTo = nodeRouteMap.get(`${matchingLevel}|${edge.to}`) ?? edge.to;

        incrementReads(4);

        incrementComparisons(1);
        if (newFrom !== newTo) {
            incrementReads(2);
            incrementComparisons(2);
            if (newFrom === edge.from && newTo === edge.to) {
                newEdges.push(edge);

                incrementWrites(1);

                incrementReads(1);
                incrementComparisons(1);
                if (!edgesMap.has(`${newMatchingLevel}|${newFrom}`)) {
                    edgesMap.set(`${newMatchingLevel}|${newFrom}`, new Map<string, DatasetEdge>());
                    incrementWrites(1);
                }
                edgesMap.get(`${newMatchingLevel}|${newFrom}`)?.set(newTo, edge);

                incrementReads(1);
                incrementWrites(1);
            } else {
                const cachedEdge = edgesMap.get(`${newMatchingLevel}|${newFrom}`)?.get(newTo);

                const existingEdge =
                    cachedEdge ??
                    {
                        id: `edge|${newFrom}|${newTo}`,
                        from: newFrom,
                        to: newTo,
                        weight: 0,
                        children: []
                    };
                existingEdge.weight = (existingEdge.weight ?? 0) + (edge.weight ?? 1);

                incrementReads(1);
                incrementWrites(1);

                if (!cachedEdge) {
                    newEdges.push(existingEdge);
                } else {
                    incrementReads(1);
                    incrementAdditions(1);
                }

                incrementReads(1);
                incrementComparisons(1);
                if (!edgesMap.has(`${newMatchingLevel}|${newFrom}`)) {
                    edgesMap.set(`${newMatchingLevel}|${newFrom}`, new Map<string, DatasetEdge>());
                    incrementWrites(1);
                }
                edgesMap.get(`${newMatchingLevel}|${newFrom}`)?.set(newTo, existingEdge);

                incrementReads(1);
                incrementWrites(1);

                incrementReads(1);
                incrementComparisons(1);
                if (!edgesMap.has(`${newMatchingLevel}|${newTo}`)) {
                    edgesMap.set(`${newMatchingLevel}|${newTo}`, new Map<string, DatasetEdge>());
                    incrementWrites(1);
                }
                edgesMap.get(`${newMatchingLevel}|${newTo}`)?.set(newFrom, existingEdge);

                incrementReads(1);
                incrementWrites(1);
            }
        }
    }

    newEdges.forEach(edge => {
        edge.label = edge.weight?.toString() ?? '1';
    });

    animation[animation.length - 1].timeBeforeNext = 500;

    animation.push({
        animationCallback: () => {
            return animateReplaceEdgeSet(
                edgeDataSet.getIds() as string[],
                newEdges
            );
        },
        description: `Replace edges with new edges after collapsing nodes`,
        timeBeforeNext: 0
    });

    nodeDataSet.remove(nodeIdsToDelete);
    nodeDataSet.update(newNodes);

    edgeDataSet.clear();
    edgeDataSet.update(newEdges);
}

function coarsenGraph(
    network: Network,
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">,
    activeNodeIdSet: Set<string>,
    nodeRouteMap: Map<string, string>,
    edgesMap: Map<string, Map<string, DatasetEdge>>,
    animation: Animation[],
    anchorCallback: (textKey: string, firstReach: boolean) => void = () => {}
): number {
    let compoundNodeIdCounter = 0;

    const matchedNodeIds = new Set<string>();

    let matchingLevel = 0;

    let nextNodeFirstReach = true;
    let matchFoundFirstReach = true;

    do {
        const nodesToCollapse: Array<[DatasetNode, DatasetNode, string]> = [];

        matchedNodeIds.clear();

        const activeNodes =
            (activeNodeIdSet.size > 0)
                ? nodeDataSet.get().filter(node => node.id.split('|')[0] === 'compoundNode' || activeNodeIdSet.has(node.id))
                : nodeDataSet.get();

        const activeEdges = (activeNodeIdSet.size > 0)
            ? edgeDataSet.get().filter(edge => activeNodeIdSet.has(edge.from) && activeNodeIdSet.has(edge.to))
            : edgeDataSet.get();

        activeNodes.forEach(node => {
            const key = `0|${node.id}`;
            nodeRouteMap.set(key, node.id);
        });

        if (activeNodes.length < 3) {
            break;
        }

        activeEdges.forEach(edge => {
            const fromKey = `${matchingLevel}|${edge.from}`;
            const toKey = `${matchingLevel}|${edge.to}`;

            incrementReads(2);

            incrementReads(1);
            incrementComparisons(1);
            if (!edgesMap.has(fromKey)) {
                edgesMap.set(fromKey, new Map<string, DatasetEdge>());
                incrementWrites(1);
            }

            edgesMap.get(fromKey)?.set(edge.to, edge);

            incrementReads(2);
            incrementWrites(1);

            incrementReads(1);
            incrementComparisons(1);
            if (!edgesMap.has(toKey)) {
                edgesMap.set(toKey, new Map<string, DatasetEdge>());
                incrementWrites(1);
            }

            edgesMap.get(toKey)?.set(edge.from, edge);

            incrementReads(2);
            incrementWrites(1);
        });
        
        for (const node of activeNodes) {

            anchorCallback(`METISCoarseningNextNode`, nextNodeFirstReach);
            nextNodeFirstReach = false;

            if (matchedNodeIds.has(node.id)) {
                continue;
            }

            const edges = edgesMap.get(`${matchingLevel}|${node.id}`);
            const edgeIds = Array.from(edges?.values() || []).map(edge => edge.id);

            animation.push({
                animationCallback: () => {
                    return highlightNodes(nodeDataSet, [node.id], '#FFA500', '#FFFF40', 5, { color: { highlight: 500, hold: 0, fade: 0 }, width: { highlight: 175, hold: 200, fade: 125 } }, true);
                },
                description: `Highlight node ${node.id} for matching`,
                timeBeforeNext: edgeIds.length > 0 ? 0 : 1000
            });

            if (edgeIds.length > 0) {
                animation.push({
                    animationCallback: () => {
                        return highlightEdges(edgeDataSet, edgeIds, '#FFA500', 5, { color: { highlight: 500, hold: 0, fade: 0 }, width: { highlight: 175, hold: 200, fade: 125 } }, true);
                    },
                    description: `Highlight edges connected to node ${node.id} for matching`,
                    timeBeforeNext: 1000
                },
                {
                    animationCallback: () => {
                        return highlightEdges(edgeDataSet, edgeIds, '#FFA500', 5, { color: { highlight: 0, hold: 0, fade: 0 }, width: { highlight: 0, hold: 0, fade: 0 } }, false);
                    },
                    description: `Unhighlight edges connected to node ${node.id} after matching`,
                    timeBeforeNext: 0
                });
            }

            const selectedEdge = selectEdgeForMatching(node, matchedNodeIds, edges ? Array.from(edges.values()) : []);

            if (selectedEdge !== null) {

                anchorCallback(`METISCoarseningMatchFound`, matchFoundFirstReach);
                matchFoundFirstReach = false;

                animation.push({
                    animationCallback: () => {
                        return highlightNodes(nodeDataSet, [node.id, otherNode.id], '#800080', '#D8BFD8', 5, { color: { highlight: 500, hold: 0, fade: 0 }, width: { highlight: 175, hold: 200, fade: 125 } }, true);
                    },
                    description: `Highlight node ${node.id} as matched`,
                    timeBeforeNext: 0
                }, {
                    animationCallback: () => {
                        return highlightEdges(edgeDataSet, [selectedEdge.id], '#800080', 5, { color: { highlight: 500, hold: 0, fade: 0 }, width: { highlight: 175, hold: 200, fade: 125 } }, true);
                    },
                    description: `Highlight edge ${selectedEdge.id} as matched`,
                    timeBeforeNext: 500
                });


                const otherNodeId = (selectedEdge.from === node.id) ? selectedEdge.to : selectedEdge.from;
                const otherNode = nodeDataSet.get(otherNodeId);

                const compoundNodeId = `compoundNode|${compoundNodeIdCounter++}`;

                nodesToCollapse.push(
                    [node, otherNode, compoundNodeId]
                )

                matchedNodeIds.add(node.id);
                matchedNodeIds.add(otherNodeId);

                nodeRouteMap.set(`${matchingLevel}|${node.id}`, compoundNodeId);
                nodeRouteMap.set(`${matchingLevel}|${otherNodeId}`, compoundNodeId);

                incrementReads(2);
                incrementWrites(2);
            } else {
                animation.push({
                    animationCallback: () => {
                        return highlightNodes(nodeDataSet, [node.id], '#FF0000', '#FF8080', 5, { color: { highlight: 0, hold: 0, fade: 0 }, width: { highlight: 0, hold: 0, fade: 0 } }, false);
                    },
                    description: `Unhighlight node ${node.id} as no match found`,
                    timeBeforeNext: 500
                });
            }
        }

        if (matchedNodeIds.size > 0) {

            anchorCallback(`METISCoarseningCollapseNodes`, matchingLevel === 0);

            collapseNodes(
                network,
                nodeDataSet,
                edgeDataSet,
                nodesToCollapse,
                matchedNodeIds,
                nodeRouteMap,
                edgesMap,
                matchingLevel,
                animation
            );
            matchingLevel++;
        }

    } while (matchedNodeIds.size > 0);

    return matchingLevel;
}

function splitCompoundNodes(
    nodeDataSet: DataSet<any, "id">,
    currentPartition: { [key: string]: number },
    targetLevel: number,
    animation: Animation[]
) {
    const allNodes = nodeDataSet.get();

    const nodeIdsToDelete: string[] = [];

    const nodesToAdd: DatasetNode[] = [];

    const splits: Array<{ compoundNodeId: string, childNodes: DatasetNode[] }> = [];

    for (const node of allNodes) {
        incrementReads(2);
        incrementComparisons(1);
        if (node.children && node.children.length === 2 && node.createdAtLevel === targetLevel) {
            const [childA, childB] = node.children;
            incrementReads(2);

            nodeIdsToDelete.push(node.id);
            nodesToAdd.push(childA, childB);

            splits.push({
                compoundNodeId: node.id,
                childNodes: [childA, childB]
            });

            currentPartition[childA.id] = currentPartition[node.id];
            currentPartition[childB.id] = currentPartition[node.id];
            incrementWrites(2);

            delete currentPartition[node.id];
        }
    }

    animation.push({
        animationCallback: () => {
            return animateSplitCompoundNodes(nodeDataSet, splits);
        },
        description: `Split compound nodes at level ${targetLevel}`,
        timeBeforeNext: 0
    });

    nodeDataSet.remove(nodeIdsToDelete);
    nodeDataSet.update(nodesToAdd);
}

function recoverEdges(
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">,
    edgesMap: Map<string, Map<string, DatasetEdge>>,
    matchingLevel: number,
    animation: Animation[]
) {
    const allNodes = nodeDataSet.get();

    const newEdges: DatasetEdge[] = [];

    const recoveredNodeIds = new Set<string>();

    for (const node of allNodes) {
        const nodeKey = `${matchingLevel}|${node.id}`;
        const edgesForNode = edgesMap.get(nodeKey);

        incrementReads(2);
        incrementComparisons(1);

        if (edgesForNode) {
            for (const [neighborId, edge] of edgesForNode.entries()) {
                incrementReads(1);
                incrementComparisons(1);
                if (!recoveredNodeIds.has(neighborId)) {
                    newEdges.push(edge);
                    incrementWrites(1);
                }
            }
            recoveredNodeIds.add(node.id);

            incrementReads(1);
            incrementWrites(1);
        }
    }

    animation.push({
        animationCallback: () => {
            return animateReplaceEdgeSet(
                edgeDataSet.getIds() as string[],
                newEdges
            );
        },
        description: `Recover edges at level ${matchingLevel}`,
        timeBeforeNext: 0
    });

    edgeDataSet.clear();
    edgeDataSet.update(newEdges);
}

function uncoarsenGraph(
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">,
    edgesMap: Map<string, Map<string, DatasetEdge>>,
    currentPartition: { [key: string]: number },
    matchingLevel: number,
    animation: Animation[]
): void {
    splitCompoundNodes(nodeDataSet, currentPartition, matchingLevel, animation);

    recoverEdges(nodeDataSet, edgeDataSet, edgesMap, matchingLevel, animation);
}

export function runMetis(
    network: Network,
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">,
    options: AlgorithmOptions = {}
): {
    partition: { [key: string]: number };
    initialCutSize: number;
    finalCutSize: number;
    animation: Animation[];
} {
    const { algorithmPasses = 0, activeNodeIds = [], existingPartition = {}, startingAnchorIndex = 0, omitAnchors = false, omitRestore = false } = options;

    const animation: Animation[] = omitRestore ? [] : initializeAnimation(nodeDataSet, edgeDataSet);

    const activeNodeIdSet = new Set(activeNodeIds?.filter(Boolean));

    resetStats();

    let anchorIndex = startingAnchorIndex;

    const originalNodes = (activeNodeIdSet.size > 0)
        ? nodeDataSet.get([...activeNodeIdSet])
        : nodeDataSet.get();
    const originalEdges = (activeNodeIdSet.size > 0)
        ? edgeDataSet.get().filter(edge => activeNodeIdSet.has(edge.from) && activeNodeIdSet.has(edge.to))
        : edgeDataSet.get();

    if (originalNodes.length === 0 || originalEdges.length === 0) {
        setInitialCutSize(0);
        setFinalCutSize(0);
        incrementReads(2); // Reading nodes and edges length
        incrementComparisons(2); // Comparing nodes and edges length to 0

        const partition = originalNodes.reduce((acc: any, node: any, idx: number) => {
            return {...acc, [node?.id]: existingPartition?.[node.id] ?? (idx % 2)}
        }, {})
        return { partition, initialCutSize: 0, finalCutSize: 0, animation: [] }
    } else {
        incrementReads(2); // Reading nodes and edges length
        incrementComparisons(2); // Comparing nodes and edges length to 0
    }

    addWeightLabelsToEdges(edgeDataSet);
    addWeightLabelsToNodes(nodeDataSet);

    const currentPartition = {...existingPartition};
    
    // nodeRouteMap key format: matchingLevel|nodeId
    const nodeRouteMap = new Map<string, string>();

    // edgesMap key format: matchingLevel|nodeId
    // inner key: nodeId of the neighbor node
    const edgesMap = new Map<string, Map<string, DatasetEdge>>();

    let initialCutSize = 0;
    // let previousCutSize = 0;
    let finalCutSize = 0;

    // console.log('Original nodes and edges fetched from DataSet: ', originalNodes, originalEdges);

    // Organize nodes in a circle

    pushAnchorAnimation(
        animation,
        {
            anchorIndex: anchorIndex++,
            textKey: 'METISCoarsening'
        },
        true,
        omitAnchors
    );

    animateCircleOrganization(network, originalNodes, animation);

    animation[animation.length - 1].timeBeforeNext = 500;

    const anchorCallback = omitAnchors ? () => {} : (
        textKey: string,
        firstReach: boolean
    ) => {
        pushAnchorAnimation(
            animation,
            {
                anchorIndex: anchorIndex++,
                textKey
            },
            firstReach,
            omitAnchors
        );
    }

    let matchingLevel = coarsenGraph(
        network,
        nodeDataSet,
        edgeDataSet,
        activeNodeIdSet,
        nodeRouteMap,
        edgesMap,
        animation,
        anchorCallback
    );

    for (let currentLevel = matchingLevel; currentLevel >= 0; currentLevel--) {

        stashStats();

        if (currentLevel === matchingLevel) {
            pushAnchorAnimation(
                animation,
                {
                    anchorIndex: anchorIndex++,
                    textKey: 'METISCoarseningComplete'
                },
                true,
                omitAnchors
            );
        } else if (currentLevel === 0) {
            pushAnchorAnimation(
                animation,
                {
                    anchorIndex: anchorIndex++,
                    textKey: 'METISFinalLevelPartitioning'
                },
                true,
                omitAnchors
            );
        } else {
            pushAnchorAnimation(
                animation,
                {
                    anchorIndex: anchorIndex++,
                    textKey: 'METISNextLevelPartitioning'
                },
                true,
                omitAnchors
            );
        }

        const fmResult = runFiducciaMattheysesWithMetisBalance(
            network,
            nodeDataSet,
            edgeDataSet,
            {
                algorithmPasses,
                activeNodeIds,
                existingPartition: currentPartition,
                omitRestore: true,
                omitAnchors: true
            }
        );

        mergeStats();


        for (const step of fmResult.animation) {
            animation.push(step);
        }

        for (const [nodeId, partitionId] of Object.entries(fmResult.partition)) {
            currentPartition[nodeId] = partitionId;

            incrementReads(1);
            incrementWrites(1);
        }
        if (currentLevel === matchingLevel) {
            initialCutSize = fmResult.initialCutSize;
            setInitialCutSize(initialCutSize);
        }
        finalCutSize = fmResult.finalCutSize;

        if (currentLevel > 0) {

            pushAnchorAnimation(
                animation,
                {
                    anchorIndex: anchorIndex++,
                    textKey: 'METISUncoarsening'
                },
                currentLevel === matchingLevel,
                omitAnchors
            );

            uncoarsenGraph(
                nodeDataSet,
                edgeDataSet,
                edgesMap,
                currentPartition,
                currentLevel - 1,
                animation
            );
        }

        const partitionCounts = [0, 0];

        const nodes = nodeDataSet.get();

        nodes.forEach(node => {
            partitionCounts[currentPartition[node.id]] += 1;
        });

        let currentIndexA = 0;
        let currentIndexB = 0;

        nodes.forEach(node => {
            const moveTime = 150;
            if (currentPartition[node.id] === 0) {
                const currentIndex = currentIndexA++;
                animation.push({
                    animationCallback: () => {
                        return moveNode(network, node.id, calculateX(currentIndex, 0, partitionCounts[0] * 2), calculateY(currentIndex, 0, partitionCounts[0] * 2), 2 * moveTime);
                    },
                    description: `Move node ${node.id} to partition A`,
                    timeBeforeNext: 0
                });
            } else {
                const currentIndex = currentIndexB++;
                animation.push({
                    animationCallback: () => {
                        return moveNode(network, node.id, calculateX(currentIndex, 1, partitionCounts[1] * 2), calculateY(currentIndex, 1, partitionCounts[1] * 2), 2 * moveTime);
                    },
                    description: `Move node ${node.id} to partition B`,
                    timeBeforeNext: 0
                });
            }
        });

        animation[animation.length - 1].timeBeforeNext = 500;
    }

    animation.push({
        animationCallback: () => () => {
            removeWeightLabelsFromEdges(edgeDataSet);
            removeWeightLabelsFromNodes(nodeDataSet);
            return true;
        },
        description: `Remove weight labels from nodes and edges after partitioning`,
        timeBeforeNext: 0
    });

    setFinalCutSize(finalCutSize);

    return {
        partition: currentPartition,
        initialCutSize: initialCutSize,
        finalCutSize: finalCutSize,
        animation: animation
    }
}