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