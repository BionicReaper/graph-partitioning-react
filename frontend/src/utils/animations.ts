import { DataSet } from "vis-network/standalone/esm/vis-network";
import { defaultVisOptions } from "./constants";
import { calcInterpolationMultiplier } from "./interpolation";

export const highlightEdges = (
    edges: DataSet<any, "id">,
    ids: string[] = [],
    highlightColor: string = '#00FF00',
    highlightWidthMultiplier: number = 5,
    duration: Record<string, { highlight: number, hold: number, fade: number }> = { color: { highlight: 500, hold: 0, fade: 500 }, width: { highlight: 500, hold: 0, fade: 500 } }
) => {
    let startTime: DOMHighResTimeStamp | null = null;
    let frameId: number | null = null;
    const totalDuration = Math.max(
        duration.color.highlight + duration.color.hold + duration.color.fade,
        duration.width.highlight + duration.width.hold + duration.width.fade
    );

    // Target color
    const targetRed = parseInt(highlightColor.slice(1, 3), 16);
    const targetGreen = parseInt(highlightColor.slice(3, 5), 16);
    const targetBlue = parseInt(highlightColor.slice(5, 7), 16);

    // Default color
    const defaultColor = defaultVisOptions.edges.color?.color || '#848484';
    const defaultRed = parseInt(defaultColor.slice(1, 3), 16);
    const defaultGreen = parseInt(defaultColor.slice(3, 5), 16);
    const defaultBlue = parseInt(defaultColor.slice(5, 7), 16);

    // Default width
    const defaultWidth = defaultVisOptions.edges.width || 2;

    function step(timestamp: DOMHighResTimeStamp) {
        if (!startTime) startTime = timestamp;

        const progress = timestamp - startTime;
        const colorInterpolationMultiplier = calcInterpolationMultiplier(progress, duration.color);
        const widthInterpolationMultiplier = calcInterpolationMultiplier(progress, duration.width);

        // Interpolate color
        const redIntensity = Math.floor(
            colorInterpolationMultiplier * (targetRed - defaultRed) + defaultRed
        );
        const greenIntensity = Math.floor(
            colorInterpolationMultiplier * (targetGreen - defaultGreen) + defaultGreen
        );
        const blueIntensity = Math.floor(
            colorInterpolationMultiplier * (targetBlue - defaultBlue) + defaultBlue
        );

        const colorValue = `#${redIntensity.toString(16).padStart(2, '0')}${greenIntensity.toString(16).padStart(2, '0')}${blueIntensity.toString(16).padStart(2, '0')}`;

        const width = Math.floor(
            widthInterpolationMultiplier * (highlightWidthMultiplier * defaultWidth - defaultWidth) + defaultWidth
        );

        const updates: { id: String, color: { color: String } | null, width: number | null }[] = [];

        const animationEnd: boolean = progress >= totalDuration;
        if (ids.length > 0) {
            if (!animationEnd) {
                ids.forEach((edgeId) => {
                    updates.push({ id: edgeId, color: { color: colorValue }, width: width });
                });
            } else {
                ids.forEach((edgeId) => {
                    updates.push({ id: edgeId, color: null, width: null });
                });
            }
        } else {
            if (!animationEnd) {
                edges.get().forEach((edge) => {
                    updates.push({ id: edge.id, color: { color: colorValue }, width: width });
                });
            } else {
                edges.get().forEach((edge) => {
                    updates.push({ id: edge.id, color: null, width: null });
                });
            }
        }

        edges.update(updates);

        if (!animationEnd) {
            frameId = requestAnimationFrame(step);
        }
    }

    // Start the animation
    frameId = requestAnimationFrame(step);

    // Return a cancel function
    return () => {
        if (frameId) cancelAnimationFrame(frameId);
    };
}