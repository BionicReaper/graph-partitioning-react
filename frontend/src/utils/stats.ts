let stats = {
    initialCutSize: 0,
    finalCutSize: 0,
    reads: 0,
    writes: 0,
    additions: 0,
    comparisons: 0
}

export const resetStats = () => {
    stats = {
        initialCutSize: 0,
        finalCutSize: 0,
        reads: 0,
        writes: 0,
        additions: 0,
        comparisons: 0
    }
}

export const setInitialCutSize = (cutSize: number) => {
    stats.initialCutSize = cutSize;
}

export const setFinalCutSize = (cutSize: number) => {
    stats.finalCutSize = cutSize;
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