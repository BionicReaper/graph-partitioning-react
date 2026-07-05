import { DataSet, Network } from "vis-network/standalone/esm/vis-network";
import { highlightEdges, highlightNodes, moveNode, swapNodePositions } from "../utils/animations";
import { calculateX, calculateY } from "../utils/positioning";
import { generateSetAnchorAnimation } from "../utils/anchoring";
import { resetStats, setInitialCutSize, setFinalCutSize, setPasses, incrementReads, incrementWrites, incrementAdditions, incrementComparisons } from "../utils/stats";
import { startNextPass } from "../utils/startNextPass";
import { runFiducciaMattheysesWithMetisBalance } from "./fiduccia-mattheyses";

interface DatasetNode {
    id: string;
    weight?: number;
    label: string;
    size: number;
    x: number;
    y: number;
    color?: {
        border?: string;
        background?: string;
        highlight?: {
            border?: string;
            background?: string;
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
                return moveNode(network, nodeId, x, y, 500);
            },
            description: `Move node ${nodeId} to position (${x}, ${y})`,
            timeBeforeNext: circleOrganizationMoveTime
        });
    }
}

function restoreLabelingOrder(nodeDataSet: DataSet<any, "id">): void {
    const currentNodes = nodeDataSet.get();
    currentNodes.sort((a, b) => {
        return Number(a.label) - Number(b.label);
    });

    nodeDataSet.clear();
    nodeDataSet.update(currentNodes);
}

function selectEdgeForMatching(node: DatasetNode, matchedNodeIds: Set<string>, edges: DatasetEdge[], mode: string = "HEM"): DatasetEdge | null {
    if (mode === "HEM") {
        const bestEdge = edges.reduce((best: DatasetEdge | null, edge: DatasetEdge) => {

            const otherNodeId = (edge.from === node.id) ? edge.to : edge.from;
            if (matchedNodeIds.has(otherNodeId)) {
                return best;
            }

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
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">,
    nodesToCollapse: Array<[DatasetNode, DatasetNode, string]>,
    matchedNodeIds: Set<string>,
    nodeRouteMap: Map<string, string>,
    edgesMap: Map<string, Map<string, DatasetEdge>>,
    matchingLevel: number
): void {
    const newMatchingLevel = matchingLevel + 1;
    const nodeIdsToDelete = Array.from(matchedNodeIds);

    const newNodes: DatasetNode[] = [];

    nodesToCollapse.forEach(([nodeA, nodeB, compoundNodeId]) => {
        const newNode: DatasetNode = {
            id: compoundNodeId,
            label: compoundNodeId,
            size: (nodeA.size + nodeB.size) / 2,
            x: (nodeA.x + nodeB.x) / 2,
            y: (nodeA.y + nodeB.y) / 2,
            weight: (nodeA.weight ?? 1) + (nodeB.weight ?? 1),
            children: [nodeA, nodeB],
            createdAtLevel: matchingLevel
        };
        newNodes.push(newNode);
    });

    const newEdges: DatasetEdge[] = [];

    const existingEdges = edgeDataSet.get();

    for (const edge of existingEdges) {
        const newFrom = nodeRouteMap.get(`${matchingLevel}|${edge.from}`) ?? edge.from;
        const newTo = nodeRouteMap.get(`${matchingLevel}|${edge.to}`) ?? edge.to;

        if (newFrom !== newTo) {
            if (newFrom === edge.from && newTo === edge.to) {
                newEdges.push(edge);

                if (!edgesMap.has(`${newMatchingLevel}|${newFrom}`)) {
                    edgesMap.set(`${newMatchingLevel}|${newFrom}`, new Map<string, DatasetEdge>());
                }
                edgesMap.get(`${newMatchingLevel}|${newFrom}`)?.set(newTo, edge);
            } else {
                const existingEdge =
                    edgesMap.get(`${newMatchingLevel}|${newFrom}`)?.get(newTo) ??
                    {
                        id: `edge|${newFrom}|${newTo}`,
                        from: newFrom,
                        to: newTo,
                        weight: 0,
                        children: []
                    };
                existingEdge.weight = (existingEdge.weight ?? 0) + (edge.weight ?? 1);
                newEdges.push(existingEdge);

                if (!edgesMap.has(`${newMatchingLevel}|${newFrom}`)) {
                    edgesMap.set(`${newMatchingLevel}|${newFrom}`, new Map<string, DatasetEdge>());
                }
                edgesMap.get(`${newMatchingLevel}|${newFrom}`)?.set(newTo, existingEdge);

                if (!edgesMap.has(`${newMatchingLevel}|${newTo}`)) {
                    edgesMap.set(`${newMatchingLevel}|${newTo}`, new Map<string, DatasetEdge>());
                }
                edgesMap.get(`${newMatchingLevel}|${newTo}`)?.set(newFrom, existingEdge);
            }
        }
    }

    nodeDataSet.remove(nodeIdsToDelete);
    nodeDataSet.update(newNodes);

    edgeDataSet.clear();
    edgeDataSet.update(newEdges);
}

function coarsenGraph(
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">,
    activeNodeIdSet: Set<string>,
    nodeRouteMap: Map<string, string>,
    edgesMap: Map<string, Map<string, DatasetEdge>>
): number {
    let compoundNodeIdCounter = 0;

    const matchedNodeIds = new Set<string>();

    let matchingLevel = 0;

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

            if (!edgesMap.has(fromKey)) {
                edgesMap.set(fromKey, new Map<string, DatasetEdge>());
            }

            edgesMap.get(fromKey)?.set(edge.to, edge);

            if (!edgesMap.has(toKey)) {
                edgesMap.set(toKey, new Map<string, DatasetEdge>());
            }

            edgesMap.get(toKey)?.set(edge.from, edge);
        });
        
        for (const node of activeNodes) {
            if (matchedNodeIds.has(node.id)) {
                continue;
            }
            const edges = edgesMap.get(`${matchingLevel}|${node.id}`);

            const selectedEdge = selectEdgeForMatching(node, matchedNodeIds, edges ? Array.from(edges.values()) : []);

            if (selectedEdge !== null) {
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
            }
        }

        if (matchedNodeIds.size > 0) {
            collapseNodes(
                nodeDataSet,
                edgeDataSet,
                nodesToCollapse,
                matchedNodeIds,
                nodeRouteMap,
                edgesMap,
                matchingLevel
            );
            matchingLevel++;
        }

    } while (matchedNodeIds.size > 0);

    return matchingLevel;
}

function splitCompoundNodes(
    nodeDataSet: DataSet<any, "id">,
    currentPartition: { [key: string]: number },
    targetLevel: number
) {
    const allNodes = nodeDataSet.get();

    const nodeIdsToDelete: string[] = [];

    const nodesToAdd: DatasetNode[] = [];

    for (const node of allNodes) {
        if (node.children && node.children.length === 2 && node.createdAtLevel === targetLevel) {
            const [childA, childB] = node.children;

            nodeIdsToDelete.push(node.id);
            nodesToAdd.push(childA, childB);

            currentPartition[childA.id] = currentPartition[node.id];
            currentPartition[childB.id] = currentPartition[node.id];

            delete currentPartition[node.id];
        }
    }

    nodeDataSet.remove(nodeIdsToDelete);
    nodeDataSet.update(nodesToAdd);
}

function recoverEdges(
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">,
    edgesMap: Map<string, Map<string, DatasetEdge>>,
    matchingLevel: number
) {
    const allNodes = nodeDataSet.get();

    const newEdges: DatasetEdge[] = [];

    const recoveredNodeIds = new Set<string>();

    for (const node of allNodes) {
        const nodeKey = `${matchingLevel}|${node.id}`;
        const edgesForNode = edgesMap.get(nodeKey);

        if (edgesForNode) {
            for (const [neighborId, edge] of edgesForNode.entries()) {
                if (!recoveredNodeIds.has(neighborId)) {
                    newEdges.push(edge);
                }
            }
            recoveredNodeIds.add(node.id);
        }
    }
    
    edgeDataSet.clear();
    edgeDataSet.update(newEdges);
}

function uncoarsenGraph(
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">,
    edgesMap: Map<string, Map<string, DatasetEdge>>,
    currentPartition: { [key: string]: number },
    matchingLevel: number
): void {
    splitCompoundNodes(nodeDataSet, currentPartition, matchingLevel);

    recoverEdges(nodeDataSet, edgeDataSet, edgesMap, matchingLevel);
}

export function runMetis(
    network: Network,
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">,
    options: {
        algorithmPasses?: number,
        activeNodeIds?: string[],
        existingPartition?: { [key: string]: number },
        startingAnchorIndex?: number
    }
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

    const currentPartition = {...existingPartition};
    
    // nodeRouteMap key format: matchingLevel|nodeId
    const nodeRouteMap = new Map<string, string>();

    // edgesMap key format: matchingLevel|nodeId
    // inner key: nodeId of the neighbor node
    const edgesMap = new Map<string, Map<string, DatasetEdge>>();

    let initialCutSize = 0;
    let previousCutSize = 0;
    let finalCutSize = 0;

    console.log('Original nodes and edges fetched from DataSet: ', originalNodes, originalEdges);

    let matchingLevel = coarsenGraph(
        nodeDataSet,
        edgeDataSet,
        activeNodeIdSet,
        nodeRouteMap,
        edgesMap
    );

    for (let currentLevel = matchingLevel; currentLevel >= 0; currentLevel--) {
        const fmResult = runFiducciaMattheysesWithMetisBalance(
            network,
            nodeDataSet,
            edgeDataSet,
            {
                algorithmPasses,
                activeNodeIds,
                existingPartition: currentPartition
            }
        );

        for (const [nodeId, partitionId] of Object.entries(fmResult.partition)) {
            currentPartition[nodeId] = partitionId;
        }
        if (currentLevel === matchingLevel) {
            initialCutSize = fmResult.initialCutSize;
            setInitialCutSize(initialCutSize);
        }
        finalCutSize = fmResult.finalCutSize;

        if (currentLevel > 0) {
            uncoarsenGraph(
                nodeDataSet,
                edgeDataSet,
                edgesMap,
                currentPartition,
                currentLevel - 1
            );
        }
    }

    setFinalCutSize(finalCutSize);

    restoreLabelingOrder(nodeDataSet);

    return {
        partition: currentPartition,
        initialCutSize: initialCutSize,
        finalCutSize: finalCutSize,
        animation: []
    }
}