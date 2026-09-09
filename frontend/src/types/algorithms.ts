export interface AlgorithmOptions {
  algorithmPasses?: number;
  activeNodeIds?: string[];
  existingPartition?: { [key: string]: number };
  startingAnchorIndex?: number;
  omitAnchors?: boolean;
  omitRestore?: boolean;
}
