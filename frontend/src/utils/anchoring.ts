let anchor: { index: number, textKey: string, values: {[key: string]: string}, firstReach: boolean } | null = null;

let targetAnchorIndex: number | null = null;

let anchorReachedCallback: (firstReach: boolean) => void = () => { };

export const goingToAnchor = () => {
  return targetAnchorIndex !== null;
}

export const setAnchorReachedCallback = (callback: (firstReach: boolean) => void) => {
  anchorReachedCallback = callback;
}

export const clearAnchorReachedCallback = () => {
  anchorReachedCallback = () => { };
}

export const setTargetAnchor = (anchorIndex: number | null) => {
  targetAnchorIndex = anchorIndex;
}

const anchorReachedCleanup = () => {
  setTargetAnchor(null);
}

export const getAnchor = () => {
  return anchor ? { ...anchor } : null;
}

export const generateSetAnchorAnimation = (_anchor: { anchorIndex: number | null, textKey?: string, values?: {[key: string]: string} }, firstReach: boolean = false) => {
  const { anchorIndex, textKey, values } = _anchor;
  return {
    animationCallback: () => () => {
      setAnchor({ anchorIndex, textKey, values }, firstReach);
      return true;
    },
    description: `Anchor Index reached: ${anchorIndex}`,
    timeBeforeNext: 1,
  }
}

export const setAnchor = (_anchor: {anchorIndex: number | null, textKey?: string, values?: {[key: string]: string}}, firstReach: boolean) => {
  const { anchorIndex, textKey, values } = _anchor;
  if (anchorIndex === null) {
    anchor = null;

    if (targetAnchorIndex !== null) {
      anchorReachedCleanup();
    }

  } else {
    anchor = { index: anchorIndex, textKey: textKey || "", values: values || {}, firstReach };

    if (targetAnchorIndex === null) {
      anchorReachedCallback(firstReach);
    } else if (anchorIndex === targetAnchorIndex) {
      anchorReachedCleanup();
      anchorReachedCallback(false);
    }
  }
}