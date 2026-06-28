import { DataSet, Network } from "vis-network/standalone/esm/vis-network";
import { highlightEdges, highlightNodes, moveNode, swapNodePositions } from "../utils/animations";
import { calculateX, calculateY } from "../utils/positioning";
import { generateSetAnchorAnimation } from "../utils/anchoring";
import { resetStats, setInitialCutSize, setFinalCutSize, setPasses, incrementReads, incrementWrites, incrementAdditions, incrementComparisons } from "../utils/stats";
import { startNextPass } from "../utils/startNextPass";

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
    children: DatasetNode[];
    collapsedEdge: DatasetEdge;
}

interface DatasetEdge {
    id: string;
    from: string;
    to: string;
    weight?: number;
    color?: {
        color?: string;
    }
    children: DatasetEdge[];
}

function selectEdgeForMatching(node: DatasetNode, matchedNodeIds: Set<string>, edgeDataSet: DataSet<any, "id">): { edgeId: string, neighborNodeId: string } | null {
    return { edgeId: '', neighborNodeId: '' };
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

    console.log('Original nodes and edges fetched from DataSet: ', originalNodes, originalEdges);

    return {
        partition: {},
        initialCutSize: 0,
        finalCutSize: 0,
        animation: []
    }
}