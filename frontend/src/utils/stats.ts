let stats = {
    cutSize: 0,
    reads: 0,
    writes: 0,
    additions: 0,
    comparisons: 0
}

export const resetStats = () => {
    stats = {
        cutSize: 0,
        reads: 0,
        writes: 0,
        additions: 0,
        comparisons: 0
    }
}

export const setCutSize = (cutSize: number) => {
    stats.cutSize = cutSize;
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