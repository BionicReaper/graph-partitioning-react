import { DataSet, Network } from "vis-network/standalone/esm/vis-network";
import { highlightEdges, highlightNodes, moveNode, swapNodePositions } from "../utils/animations";
import { calculateX, calculateY } from "../utils/positioning";
import { generateSetAnchorAnimation } from "../utils/anchoring";
import { resetStats, setInitialCutSize, setFinalCutSize, incrementReads, incrementWrites, incrementAdditions, incrementComparisons } from "../utils/stats";
import { startNextPass } from "../utils/startNextPass";

export interface FMNode {
    index: number;
    id: string; // Original ID for mapping back
    edges: Array<FMEdge>;
    weight: number;
    cell: FMCell;
    partition: number;
    locked: boolean;
    label: string;
}

export interface FMEdge {
    from: number;
    to: number;
    weight: number;
    id: string; // Original edge ID for mapping back
}

export interface Animation {
    animationCallback: () => (timestamp: DOMHighResTimeStamp) => boolean;
    description: string;
    timeBeforeNext: number;
}

export interface FMCell {
    previousCell: FMCell | null;
    nextCell: FMCell | null;
    nodeIdx: number;
    gain: number;
}

export interface FMBucket {
    headCell: FMCell;
    gain: number;
}

function removeCellFromBucket(cell: FMCell, clearCellLinks: boolean = false) {

    const previousCell = cell.previousCell;
    const nextCell = cell.nextCell;

    if (previousCell) previousCell.nextCell = nextCell;
    if (nextCell) nextCell.previousCell = previousCell;

    if(clearCellLinks) {
        cell.previousCell = null;
        cell.nextCell = null;
    }

}

function insertCellToBucket(cell: FMCell, bucket: FMBucket){
    
    const headCell = bucket.headCell;
    const firstCell = bucket.headCell.nextCell;

    cell.previousCell = headCell;
    cell.nextCell = firstCell;

    headCell.nextCell = cell;
    if (firstCell) firstCell.previousCell = cell;
}

function moveCellToBucket(cell: FMCell, bucket: FMBucket) {

    removeCellFromBucket(cell);

    insertCellToBucket(cell, bucket);

}

function getBucketByGain(buckets: FMBucket[], gain: number) {
    const maxGain = (buckets.length - 1) / 2;
    return buckets[gain + maxGain];
}

function insertNodesToBuckets(bucketsLeft: FMBucket[], bucketsRight: FMBucket[], nodes: FMNode[]) {
    const maxGain = (bucketsLeft.length - 1) / 2;

    const bestGains: { left: number, right: number } = { left: -maxGain, right: -maxGain };

    nodes.forEach(node => {
        const gain = node.edges.reduce((acc, edge) => acc + edge.weight, 0);
        insertCellToBucket(node.cell, getBucketByGain(node.partition === 0 ? bucketsLeft : bucketsRight, gain));
        if (node.partition === 0 && (bestGains.left === null || gain > bestGains.left)) {
            bestGains.left = gain;
        }
        if (node.partition === 1 && (bestGains.right === null || gain > bestGains.right)) {
            bestGains.right = gain;
        }
    });

    return bestGains;
}

export function runFiducciaMattheyses(
    network: Network,
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">,
    algorithmPasses: number = 0,
    activeNodeIds?: string[],
    existingPartition?: { [key: string]: number }
): {
    partition: { [key: string]: number };
    initialCutSize: number;
    finalCutSize: number;
    animation: Animation[];
} {
    const animation: Animation[] = [];
    
    const activeNodeIdSet = new Set(activeNodeIds?.filter(Boolean));

    resetStats();

    let anchorIndex = 0;

    const originalNodes = (activeNodeIdSet.size > 0)
        ? nodeDataSet.get([...activeNodeIdSet])
        : nodeDataSet.get();
    const originalEdges = (activeNodeIdSet.size > 0)
        ? edgeDataSet.get().filter(edge => activeNodeIdSet.has(edge.from) && activeNodeIdSet.has(edge.to))
        : edgeDataSet.get();

    if (originalNodes.length === 0 || originalEdges.length === 0) {
        return originalNodes.reduce((acc: any, node: any, idx: number) => {
            return {...acc, [node?.id]: existingPartition?.[node.id] ?? (idx % 2)}
        }, {})
    }

    console.log('Original nodes and edges fetched from DataSet: ', originalNodes, originalEdges);

    const totalEdgeWeight: { [key: string]: number } = {};

    originalEdges.forEach((edge) => {
        totalEdgeWeight[edge.from] = totalEdgeWeight[edge.from] ? totalEdgeWeight[edge.from] + (edge.weight || 1) : (edge.weight || 1);
        totalEdgeWeight[edge.to] = totalEdgeWeight[edge.to] ? totalEdgeWeight[edge.to] + (edge.weight || 1) : (edge.weight || 1);
    });

    const maxEdgeWeightSum = Math.max(...Object.values(totalEdgeWeight));

    let weightLeft = 0;
    let bestGainLeft = 0;
    const bucketArrayLeft: FMBucket[] = Array<FMBucket>(2 * (maxEdgeWeightSum) - 1).fill({
        headCell: {
            previousCell: null,
            nextCell: null,
            nodeIdx: -1
        }
    });

    let weightRight = 0;
    let bestGainRight = 0;
    const bucketArrayRight: FMBucket[] = Array<FMBucket>(2 * (maxEdgeWeightSum) - 1).fill({
        headCell: {
            previousCell: null,
            nextCell: null,
            nodeIdx: -1
        }
    });

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
    const nodes: FMNode[] = originalNodes.map((node, idx) => {
        const nodeObject = {
            index: idx,
            id: node.id,
            weight: node.weight || 1,
            edges: [],
            cell: {
                previousCell: null,
                nextCell: null,
                nodeIdx: idx
            },
            partition: existingPartition?.[node.id] ?? (idx % 2), // Initial partitioning: even index -> partition 0, odd index -> partition 1
            locked: false,
            label: node.label
        }

        if (nodeObject.partition === 0) {
            weightLeft += nodeObject.weight;
        } else {
            weightRight += nodeObject.weight;
        }

        return nodeObject;
    });

    const maxNodeWeight = Math.max(...nodes.map(node => node.weight));

    // Convert edges to array format using index mapping - O(m)
    const edges: FMEdge[] = originalEdges
        .map(originalEdge => {
            incrementReads(1); // Reading from edgeDataSet

            const fromIdx = idToIndex.get(originalEdge.from);
            const toIdx = idToIndex.get(originalEdge.to);

            if (fromIdx === undefined || toIdx === undefined) {
                console.error(`Edge with id ${originalEdge.id} has invalid node references: from ${originalEdge.from} to ${originalEdge.to}`);
                return null;
            }

            const edgeObject = {
                from: fromIdx,
                to: toIdx,
                id: originalEdge.id,
                weight: originalEdge.weight || 1
            }

            nodes[fromIdx!].edges.push(edgeObject);
            nodes[toIdx!].edges.push(edgeObject);

            return edgeObject;
        })
        .filter((edge): edge is FMEdge => edge !== null);

    const initialBestGains = insertNodesToBuckets(bucketArrayLeft, bucketArrayRight, nodes);

    bestGainLeft = initialBestGains.left;
    bestGainRight = initialBestGains.right;

    while (startNextPass(algorithmPasses, previousCutSize, finalCutSize, currentPass)) {
    }
    
    return {
        partition: {},
        initialCutSize: 0,
        finalCutSize: 0,
        animation: []
    };
}