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
            children: [nodeA, nodeB]
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
            matchingLevel++;
            collapseNodes(
                nodeDataSet,
                edgeDataSet,
                nodesToCollapse,
                matchedNodeIds,
                nodeRouteMap,
                edgesMap,
                matchingLevel
            );
        }

    } while (matchedNodeIds.size > 0);

    return matchingLevel;
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
        return originalNodes.reduce((acc: any, node: any, idx: number) => {
            return { ...acc, [node?.id]: existingPartition?.[node.id] ?? (idx % 2) }
        }, {})
    }
    
    // nodeRouteMap key format: matchingLevel|nodeId
    const nodeRouteMap = new Map<string, string>();

    // edgesMap key format: matchingLevel|nodeId
    // inner key: nodeId of the neighbor node
    const edgesMap = new Map<string, Map<string, DatasetEdge>>();

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

    return {
        partition: {},
        initialCutSize: 0,
        finalCutSize: 0,
        animation: []
    }
}