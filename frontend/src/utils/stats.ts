export interface Stats {
    initialCutSize: number;
    finalCutSize: number;
    passes: number;
    reads: number;
    writes: number;
    additions: number;
    comparisons: number;
}

let stats: Stats = {
    initialCutSize: 0,
    finalCutSize: 0,
    passes: 0,
    reads: 0,
    writes: 0,
    additions: 0,
    comparisons: 0
}

let stashedStats: Stats | null = null;

export const resetStats = () => {
    stats = {
        initialCutSize: 0,
        finalCutSize: 0,
        passes: 0,
        reads: 0,
        writes: 0,
        additions: 0,
        comparisons: 0
    }
}

export const stashStats = () => {
    if (stashedStats) {
        throw new Error("Stats have already been stashed. Please merge or reset before stashing again.");
    }
    stashedStats = { ...stats };
}

export const mergeStats = () => {
    if (stashedStats) {
        stats.initialCutSize += stashedStats.initialCutSize;
        stats.finalCutSize += stashedStats.finalCutSize;
        stats.passes += stashedStats.passes;
        stats.reads += stashedStats.reads;
        stats.writes += stashedStats.writes;
        stats.additions += stashedStats.additions;
        stats.comparisons += stashedStats.comparisons;
    }
    stashedStats = null;
}

export const discardStash = () => {
    stashedStats = null;
}

export const setInitialCutSize = (cutSize: number) => {
    stats.initialCutSize = cutSize;
}

export const setFinalCutSize = (cutSize: number) => {
    stats.finalCutSize = cutSize;
}

export const setPasses = (passes: number) => {
    stats.passes = passes;
}

export const incrementReads = (count: number = 1) => {
    stats.reads += count;
}

export const incrementWrites = (count: number = 1) => {
    stats.writes += count;
}

export const incrementAdditions = (count: number = 1) => {
    stats.additions += count;
}

export const incrementComparisons = (count: number = 1) => {
    stats.comparisons += count;
}

export const getStats = () => {
    return { ...stats };
}