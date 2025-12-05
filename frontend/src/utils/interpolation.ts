export const calcInterpolationMultiplier = (
    progress: DOMHighResTimeStamp,
    duration: {highlight: number, hold: number, fade: number}
) => {
    if (progress < duration.highlight) {
        return progress / duration.highlight;
    } else if (progress < duration.highlight + duration.hold) {
        return 1;
    } else if (progress < duration.highlight + duration.hold + duration.fade) {
        return 1 - (progress - duration.highlight - duration.hold) / duration.fade;
    } else {
        return 0;
    }
}

export const easeInOutCubic = (t: number) => {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 + (--t) * (2 * t) * (2 * t);
}

export const timeDecayFactor = (maxTime: number, singleTime: number) => {
    return 1 - singleTime / maxTime;
}