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
    nodeIdx: number; // Maybe useless check later
    gain: number;
}

export interface FMBucket {
    headCell: FMCell;
}

function removeCellFromBucket(cell: FMCell) {

    const previousCell = cell.previousCell;
    const nextCell = cell.nextCell;

    incrementReads(2);

    if (previousCell) {
        previousCell.nextCell = nextCell;

        incrementReads(1);
        incrementWrites(1);
    }

    incrementReads(1);
    incrementComparisons(1);

    if (nextCell) {
        nextCell.previousCell = previousCell;

        incrementReads(1);
        incrementWrites(1);
    }

    incrementReads(1);
    incrementComparisons(1);
}

function insertCellToBucket(cell: FMCell, bucket: FMBucket) {
    
    const headCell = bucket.headCell;
    const firstCell = bucket.headCell.nextCell;

    incrementReads(2);

    cell.previousCell = headCell;
    cell.nextCell = firstCell;
    cell.gain = headCell.gain;

    incrementReads(3);
    incrementWrites(3);

    headCell.nextCell = cell;

    incrementReads(1);
    incrementWrites(1);

    if (firstCell) {
        firstCell.previousCell = cell;

        incrementReads(1);
        incrementWrites(1);
    }

    incrementReads(1);
    incrementComparisons(1);
}

function moveCellToBucket(cell: FMCell, bucket: FMBucket) {

    removeCellFromBucket(cell);

    insertCellToBucket(cell, bucket);

}

function getBucketByGain(buckets: FMBucket[], gain: number): FMBucket {
    const maxGain = (buckets.length - 1) / 2;

    incrementReads(1);
    incrementAdditions(1);

    const bucket = buckets[gain + maxGain];

    incrementReads(1);
    incrementAdditions(1);

    return bucket;
}

function insertNodesToBuckets(bucketsLeft: FMBucket[], bucketsRight: FMBucket[], nodes: FMNode[]): { 
    left: number,
    right: number
} {
    const maxGain = (bucketsLeft.length - 1) / 2;

    incrementReads(1);
    incrementAdditions(1);

    const bestGains: { left: number, right: number } = { left: -maxGain, right: -maxGain };

    incrementReads(1);
    incrementWrites(2);

    nodes.forEach(node => {
        const gain = node.edges.reduce(
            (acc, edge) => {
                const otherNodeIdx = edge.from === node.index ? edge.to : edge.from;
                const otherNode = nodes[otherNodeIdx];

                incrementReads(4);
                incrementComparisons(1);

                if (node.partition === otherNode.partition) {

                    incrementReads(2);
                    incrementAdditions(1);
                    incrementComparisons(1);

                    return acc - edge.weight;
                } else {

                    incrementReads(2);
                    incrementAdditions(1);
                    incrementComparisons(1);

                    return acc + edge.weight;
                }
            },
        0);
        insertCellToBucket(node.cell, getBucketByGain(node.partition === 0 ? bucketsLeft : bucketsRight, gain));

        incrementReads(4);
        incrementComparisons(1);

        if (node.partition === 0 && (bestGains.left === null || gain > bestGains.left)) {
            
            bestGains.left = gain;

            incrementWrites(1);
        }

        incrementReads(3);
        incrementComparisons(3);

        if (node.partition === 1 && (bestGains.right === null || gain > bestGains.right)) {

            bestGains.right = gain;

            incrementWrites(1);
        }

        incrementReads(3);
        incrementComparisons(3);

    });

    return bestGains;
}

function getBestGainCell(bucketArray: FMBucket[], bestGain: number): FMCell | null {
    const firstCell: FMCell | null = bucketArray[bestGain + (bucketArray.length - 1) / 2].headCell.nextCell;

    incrementReads(3);
    incrementAdditions(2);

    incrementComparisons(1);
    if (!firstCell) {
        // This bucket is empty, find the next non-empty bucket
        for (let gain = bestGain - 1; gain >= -(bucketArray.length - 1) / 2; gain--) {

            const cell = bucketArray[gain + (bucketArray.length - 1) / 2].headCell.nextCell;
            incrementReads(3);
            incrementAdditions(2);
            
            incrementComparisons(1);
            if (cell) {
                return cell;
            }

        }
    }

    return firstCell;
}

function getBestGainCells(bucketArrayLeft: FMBucket[], bucketArrayRight: FMBucket[], bestGainLeft: number, bestGainRight: number, setBestGainLeft: (gain: number) => void, setBestGainRight: (gain: number) => void): FMCell[] {
    const bestCellLeft = getBestGainCell(bucketArrayLeft, bestGainLeft);
    const bestCellRight = getBestGainCell(bucketArrayRight, bestGainRight);

    if (bestCellLeft?.gain !== bestGainLeft) {
        setBestGainLeft(bestCellLeft ? bestCellLeft.gain : -((bucketArrayLeft.length - 1) / 2));
    }

    incrementReads(2);
    incrementComparisons(1);

    if (bestCellRight?.gain !== bestGainRight) {
        setBestGainRight(bestCellRight ? bestCellRight.gain : -((bucketArrayRight.length - 1) / 2));
    }

    incrementReads(2);
    incrementComparisons(1);

    const bestCells = [];

    if (bestCellLeft) {
        bestCells.push(bestCellLeft);
    }

    incrementReads(1);
    incrementComparisons(1);

    if (bestCellRight) {
        bestCells.push(bestCellRight);
    }

    incrementReads(1);
    incrementComparisons(1);

    return bestCells;
}

let balanceMode: 'FM' | 'METIS' = 'FM';

function setBalanceMode(mode: 'FM' | 'METIS') {
    balanceMode = mode;
}

function filterBestGainCellsByBalance(cells: FMCell[], nodes: FMNode[], weightLeft: number, weightRight: number, maxNodeWeight: number, balanceFactor: number = 2): FMCell[] {
    if (balanceMode === 'FM') {
        return cells.filter(cell => {
            const node = nodes[cell.nodeIdx];
            const partition = node.partition;

            const newWeightLeft = partition === 0 ? weightLeft - node.weight : weightLeft + node.weight;
            const newWeightRight = partition === 1 ? weightRight - node.weight : weightRight + node.weight;

            const remainsBalanced = Math.abs(newWeightLeft - newWeightRight) <= balanceFactor * maxNodeWeight;

            incrementReads(10);
            incrementAdditions(3);
            incrementComparisons(1);

            return remainsBalanced;
        });
    } else if (balanceMode === 'METIS') {
        // In METIS, balancing is achieved by always moving nodes from the heavier partition to the lighter one
        const sideToUse = weightLeft <= weightRight ? 1 : 0;

        incrementReads(2);
        incrementComparisons(1);

        return cells.filter(cell => {
            const node = nodes[cell.nodeIdx];

            return node.partition === sideToUse;
        });
    } else {
        throw new Error(`Unknown balance mode: ${balanceMode}`);
    }
}

function getNextCellToMove(
    bucketArrayLeft: FMBucket[],
    bucketArrayRight: FMBucket[],
    bestGainLeft: number,
    bestGainRight: number,
    weightLeft: number,
    weightRight: number,
    maxNodeWeight: number,
    setBestGainLeft: (gain: number) => void,
    setBestGainRight: (gain: number) => void,
    nodes: FMNode[]
): FMCell | null {
    const bestCells = getBestGainCells(bucketArrayLeft, bucketArrayRight, bestGainLeft, bestGainRight, setBestGainLeft, setBestGainRight);
    const filteredBestCells = filterBestGainCellsByBalance(bestCells, nodes, weightLeft, weightRight, maxNodeWeight);
    if (filteredBestCells.length === 0) {

        incrementReads(1);
        incrementComparisons(1);

        return null;

    } else if (filteredBestCells.length === 1) {

        incrementReads(1);
        incrementComparisons(2);

        return filteredBestCells[0];
    } else if (filteredBestCells[0].gain >= filteredBestCells[1].gain) {

        incrementReads(3);
        incrementComparisons(3);

        return filteredBestCells[0];
    } else {

        incrementReads(3);
        incrementComparisons(3);

        return filteredBestCells[1];
    }
}

function moveNodeBetweenPartitions(
    node: FMNode,
    nodes: FMNode[],
    leftBucketArray: FMBucket[],
    rightBucketArray: FMBucket[],
    bestGainLeft: number,
    bestGainRight: number,
    setBestGainLeft: (gain: number) => void,
    setBestGainRight: (gain: number) => void,
    changeWeightLeft: (delta: number) => void,
    changeWeightRight: (delta: number) => void
) {
    const fromPartition = node.partition;
    const toPartition = fromPartition === 0 ? 1 : 0;

    incrementReads(1);

    if (!node.locked) {
        for (const edge of node.edges) {
            const affectedNodeIdx = edge.from === node.index ? edge.to : edge.from;
            const affectedNode = nodes[affectedNodeIdx];

            incrementReads(4);
            incrementComparisons(1);

            if (affectedNode.locked) {
                continue; // Locked node - has already moved
            }

            const bestGain = affectedNode.partition === 0 ? bestGainLeft : bestGainRight;
            const setBestGain = affectedNode.partition === 0 ? setBestGainLeft : setBestGainRight;

            const bucketArray = affectedNode.partition === 0 ? leftBucketArray : rightBucketArray;

            incrementReads(4);
            incrementComparisons(1);

            const currentGain = affectedNode.cell.gain;

            incrementReads(1);

            const gainChange = (affectedNode.partition === fromPartition) ? 2 * edge.weight : -2 * edge.weight;

            incrementReads(2);
            incrementComparisons(1);

            const newBucket = getBucketByGain(
                bucketArray,
                currentGain + gainChange
            );
            incrementAdditions(1);

            moveCellToBucket(affectedNode.cell, newBucket);
            incrementReads(1);

            if (bestGain < currentGain + gainChange) {
                setBestGain(currentGain + gainChange);
                incrementReads(2);
            }

            incrementAdditions(1);
            incrementComparisons(1);
        }
    }

    const leftWeightChange = node.partition === 0 ? -node.weight : node.weight;
    const rightWeightChange = -leftWeightChange;

    incrementReads(2);
    incrementComparisons(1);

    changeWeightLeft(leftWeightChange);
    changeWeightRight(rightWeightChange);

    node.partition = toPartition;

    node.locked = true;

    incrementWrites(2);

    removeCellFromBucket(node.cell);
    incrementReads(1);
}

function emptyBuckets(buckets: FMBucket[]) {
    buckets.forEach(bucket => {
        bucket.headCell.nextCell = null;
    });
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

        incrementReads(4);
        incrementAdditions(2);
        incrementWrites(2);
    });

    const maxEdgeWeightSum = Math.max(...Object.values(totalEdgeWeight));

    incrementReads(totalEdgeWeight ? Object.keys(totalEdgeWeight).length : 0);
    incrementComparisons(totalEdgeWeight ? Object.keys(totalEdgeWeight).length : 0);
    incrementWrites(1);

    console.log('Max edge weight sum calculated: ', maxEdgeWeightSum);

    let weightLeft = 0;
    let bestGainLeft;
    const bucketArrayLeft: FMBucket[] = Array.from({ length: 2 * (maxEdgeWeightSum) + 1 }, (_, index): FMBucket => ({
        headCell: {
            previousCell: null,
            nextCell: null,
            nodeIdx: -1,
            gain: index - maxEdgeWeightSum
        }
    }));

    let weightRight = 0;
    let bestGainRight;
    const bucketArrayRight: FMBucket[] = Array.from({ length: 2 * (maxEdgeWeightSum) + 1 }, (_, index): FMBucket => ({
        headCell: {
            previousCell: null,
            nextCell: null,
            nodeIdx: -1,
            gain: index - maxEdgeWeightSum
        }
    }));

    incrementWrites(4 * maxEdgeWeightSum + 2);

    let currentPass = 0;
    let initialCutSize = 0;
    let previousCutSize;
    let finalCutSize;

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
                nodeIdx: idx,
                gain: 0
            },
            partition:
                existingPartition?.[node.id] ||
                weightLeft > weightRight ? 1 : 0,
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
    
    if (originalNodes.length === 0 || originalEdges.length === 0) {
        resetStats();
        // Any partition will do
        nodes.forEach(node => {
            partitionResult[node.id] = node.partition || node.index % 2;
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

    const maxNodeWeight = Math.max(...nodes.map(node => node.weight));

    // Convert edges to array format using index mapping - O(m)
    const edges: FMEdge[] = originalEdges
        .map(originalEdge => {

            const fromIdx = idToIndex.get(originalEdge.from);
            const toIdx = idToIndex.get(originalEdge.to);

            incrementReads(2);

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
            
            if (nodes[fromIdx].partition !== nodes[toIdx].partition) {
                initialCutSize += edgeObject.weight;

                incrementReads(1);
                incrementAdditions(1);
                incrementWrites(1);
            }

            incrementReads(2);
            incrementComparisons(1);

            nodes[fromIdx!].edges.push(edgeObject);
            nodes[toIdx!].edges.push(edgeObject);

            return edgeObject;
        })
        .filter((edge): edge is FMEdge => edge !== null);

    setInitialCutSize(initialCutSize);
    
    previousCutSize = initialCutSize;
    finalCutSize = initialCutSize;

    while (startNextPass(algorithmPasses, previousCutSize, finalCutSize, currentPass)) {

        currentPass += 1;
        previousCutSize = finalCutSize;
        finalCutSize = 0;

        incrementReads(1)
        incrementWrites(3);

        const initialBestGains = insertNodesToBuckets(bucketArrayLeft, bucketArrayRight, nodes);

        bestGainLeft = initialBestGains.left;
        bestGainRight = initialBestGains.right;

        incrementWrites(2);

        const exchangeNodes: Array<{ nodeIdx: number; gain: number }> = [];

        for (
            let cell = getNextCellToMove(
                bucketArrayLeft,
                bucketArrayRight,
                bestGainLeft,
                bestGainRight,
                weightLeft,
                weightRight,
                maxNodeWeight,
                (gain) => {bestGainLeft = gain; incrementWrites(1)},
                (gain) => {bestGainRight = gain; incrementWrites(1)},
                nodes
            );
            cell !== null;
            cell = getNextCellToMove(
                bucketArrayLeft,
                bucketArrayRight,
                bestGainLeft,
                bestGainRight,
                weightLeft,
                weightRight,
                maxNodeWeight,
                (gain) => {bestGainLeft = gain; incrementWrites(1)},
                (gain) => {bestGainRight = gain; incrementWrites(1)},
                nodes)
        ) {
            const node = nodes[cell.nodeIdx];

            incrementReads(1);

            exchangeNodes.push({ nodeIdx: cell.nodeIdx, gain: cell.gain });

            incrementReads(2)

            moveNodeBetweenPartitions(
                node,
                nodes,
                bucketArrayLeft,
                bucketArrayRight,
                bestGainLeft,
                bestGainRight,
                (gain) => {bestGainLeft = gain; incrementWrites(1)},
                (gain) => {bestGainRight = gain; incrementWrites(1)},
                (delta) => {weightLeft += delta; incrementReads(1); incrementAdditions(1); incrementWrites(1)},
                (delta) => {weightRight += delta; incrementReads(1); incrementAdditions(1); incrementWrites(1)});
        }

        // Calculate cumulative gains
        const cumulativeGains: Array<{totalGain: number, balance: number}> = [];
        let cumulative = 0;
        exchangeNodes.forEach(node => {
            cumulative += node.gain;

            incrementReads(2);
            incrementAdditions(1);
            incrementWrites(1);

            cumulativeGains.push(
                {
                    totalGain: cumulative,
                    balance: Math.abs(weightLeft - weightRight)
                }
            );

            incrementReads(3);
            incrementAdditions(1);
            incrementWrites(1);
        });

        // Find k that maximizes the cumulative gain
        let maxCumulativeGain: number = 0;
        let bestBalance: number = Number.POSITIVE_INFINITY;
        let k = -1;
        cumulativeGains.forEach((gain, index) => {
            if (gain.totalGain > maxCumulativeGain) {
                maxCumulativeGain = gain.totalGain;
                bestBalance = gain.balance;
                k = index;

                incrementReads(3);
                incrementWrites(3);
            } else if (gain.totalGain === maxCumulativeGain && gain.balance < bestBalance) {
                bestBalance = gain.balance;
                k = index;

                incrementReads(4);
                incrementComparisons(2);
                incrementWrites(2);
            }

            incrementReads(2);
            incrementComparisons(1);
        });

        // Undo swaps beyond k

        for (let i = exchangeNodes.length - 1; i > k; i--) {

            const nodeIdx = exchangeNodes[i].nodeIdx;
            const node = nodes[nodeIdx];

            incrementReads(2);

            moveNodeBetweenPartitions(
                node,
                nodes,
                bucketArrayLeft,
                bucketArrayRight,
                bestGainLeft,
                bestGainRight,
                (gain) => {bestGainLeft = gain; incrementWrites(1)},
                (gain) => {bestGainRight = gain; incrementWrites(1)},
                (delta) => {weightLeft += delta; incrementReads(1); incrementAdditions(1); incrementWrites(1)},
                (delta) => {weightRight += delta; incrementReads(1); incrementAdditions(1); incrementWrites(1)}
            );
        }

        finalCutSize = edges.reduce((acc, edge) => {
            if (nodes[edge.from].partition !== nodes[edge.to].partition) {
                incrementReads(4);
                incrementAdditions(1);
                incrementComparisons(1);
                return acc + edge.weight;
            } else {
                incrementReads(4);
                incrementComparisons(1);
                return acc;
            }
        }, 0);

        emptyBuckets(bucketArrayLeft);
        emptyBuckets(bucketArrayRight);
    }

    
    setFinalCutSize(finalCutSize);

    // Map partitions back to original IDs
    nodes.forEach(node => {
        partitionResult[node.id] = node.partition;
    });
    
    return {
        partition: partitionResult,
        initialCutSize: initialCutSize,
        finalCutSize: finalCutSize,
        animation: []
    };
}

export function runFiducciaMattheysesWithMetisBalance(
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
    setBalanceMode('METIS');
    const result = runFiducciaMattheyses(network, nodeDataSet, edgeDataSet, algorithmPasses, activeNodeIds, existingPartition);
    setBalanceMode('FM');
    return result;
}