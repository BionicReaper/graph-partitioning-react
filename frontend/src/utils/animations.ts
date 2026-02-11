import { DataSet, Network } from "vis-network/standalone/esm/vis-network";
import { defaultVisOptions } from "./constants";
import { calcInterpolationMultiplier, easeInOutCubic } from "./interpolation";

type NodeUpdate = {
    id: string,
    x?: number,
    y?: number,
    color?: {
        border: string,
        background: string,
        highlight: {
            border: string,
            background: string
        }
    } | null,
    borderWidth?: number | null
};

type EdgeUpdate = {
    id: string,
    color?: {
        color?: string
    } | null,
    width?: number | null
};

let nodeUpdates: Record<string, NodeUpdate> = {};
let edgeUpdates: Record<string, EdgeUpdate> = {};

export const extractNodeUpdates = () => {
    const extracted = Object.values(nodeUpdates);
    nodeUpdates = {};
    return extracted;
}

export const extractEdgeUpdates = () => {
    const extracted = Object.values(edgeUpdates);
    edgeUpdates = {};
    return extracted;
}

const queueNodeUpdate = (update: NodeUpdate) => {
    const existing = nodeUpdates[update.id] ?? { id: update.id };
    if (update.x !== undefined) {
        existing.x = update.x;
    }
    if (update.y !== undefined) {
        existing.y = update.y;
    }
    if (update.color !== undefined) {
        existing.color = update.color;
    }
    if (update.borderWidth !== undefined) {
        existing.borderWidth = update.borderWidth;
    }
    nodeUpdates[update.id] = existing;
};

const queueEdgeUpdate = (update: EdgeUpdate) => {
    const existing = edgeUpdates[update.id] ?? { id: update.id };
    if (update.color !== undefined) {
        existing.color = update.color;
    }
    if (update.width !== undefined) {
        existing.width = update.width;
    }
    edgeUpdates[update.id] = existing;
};

export const highlightNodes = (
    nodes: DataSet<any, "id">,
    ids: string[] = [],
    highlightBorderColor: string = '#00FF00',
    highlightBackgroundColor: string = '#00FF00',
    highlightWidthMultiplier: number = 5,
    duration: Record<string, { highlight: number, hold: number, fade: number }> = { color: { highlight: 500, hold: 0, fade: 500 }, width: { highlight: 500, hold: 0, fade: 500 } },
    keepColorAfterHighlight: boolean = false
) => {
    let startTime: DOMHighResTimeStamp | null = null;
    const totalDuration = Math.max(
        duration.color.highlight + duration.color.hold + duration.color.fade,
        duration.width.highlight + duration.width.hold + duration.width.fade
    );

    // Target border color
    const targetBorderRed = parseInt(highlightBorderColor.slice(1, 3), 16);
    const targetBorderGreen = parseInt(highlightBorderColor.slice(3, 5), 16);
    const targetBorderBlue = parseInt(highlightBorderColor.slice(5, 7), 16);

    // Target background color
    const targetBgRed = parseInt(highlightBackgroundColor.slice(1, 3), 16);
    const targetBgGreen = parseInt(highlightBackgroundColor.slice(3, 5), 16);
    const targetBgBlue = parseInt(highlightBackgroundColor.slice(5, 7), 16);

    // Default border color
    const defaultBorderColor = defaultVisOptions.nodes.color?.border || '#2B7CE9';
    const defaultBorderRed = parseInt(defaultBorderColor.slice(1, 3), 16);
    const defaultBorderGreen = parseInt(defaultBorderColor.slice(3, 5), 16);
    const defaultBorderBlue = parseInt(defaultBorderColor.slice(5, 7), 16);

    // Default background color
    const defaultBgColor = defaultVisOptions.nodes.color?.background || '#97C2FC';
    const defaultBgRed = parseInt(defaultBgColor.slice(1, 3), 16);
    const defaultBgGreen = parseInt(defaultBgColor.slice(3, 5), 16);
    const defaultBgBlue = parseInt(defaultBgColor.slice(5, 7), 16);

    // Default width
    const defaultWidth = defaultVisOptions.nodes.borderWidth || 2;

    function step(timestamp: DOMHighResTimeStamp) {
        if (!startTime) startTime = timestamp;

        if (keepColorAfterHighlight && (timestamp - startTime >= duration.color.highlight)) {
            if (ids.length > 0) {
                ids.forEach((nodeId) => {
                    queueNodeUpdate({ id: nodeId, color: { border: highlightBorderColor, background: highlightBackgroundColor, highlight: { border: highlightBorderColor, background: highlightBackgroundColor } }, borderWidth: null});
                });
            } else {
                nodes.get().forEach((node) => {
                    queueNodeUpdate({ id: node.id, color: { border: highlightBorderColor, background: highlightBackgroundColor, highlight: { border: highlightBorderColor, background: highlightBackgroundColor } }, borderWidth: null});
                });
            }

            return true; // End animation immediately after reaching highlight color
        }

        const progress = timestamp - startTime;
        const colorInterpolationMultiplier = calcInterpolationMultiplier(progress, duration.color);
        const widthInterpolationMultiplier = calcInterpolationMultiplier(progress, duration.width);

        // Interpolate border color
        const borderRedIntensity = Math.floor(
            colorInterpolationMultiplier * (targetBorderRed - defaultBorderRed) + defaultBorderRed
        );
        const borderGreenIntensity = Math.floor(
            colorInterpolationMultiplier * (targetBorderGreen - defaultBorderGreen) + defaultBorderGreen
        );
        const borderBlueIntensity = Math.floor(
            colorInterpolationMultiplier * (targetBorderBlue - defaultBorderBlue) + defaultBorderBlue
        );

        const borderColorValue = `#${borderRedIntensity.toString(16).padStart(2, '0')}${borderGreenIntensity.toString(16).padStart(2, '0')}${borderBlueIntensity.toString(16).padStart(2, '0')}`;

        // Interpolate background color
        const bgRedIntensity = Math.floor(
            colorInterpolationMultiplier * (targetBgRed - defaultBgRed) + defaultBgRed
        );
        const bgGreenIntensity = Math.floor(
            colorInterpolationMultiplier * (targetBgGreen - defaultBgGreen) + defaultBgGreen
        );
        const bgBlueIntensity = Math.floor(
            colorInterpolationMultiplier * (targetBgBlue - defaultBgBlue) + defaultBgBlue
        );

        const bgColorValue = `#${bgRedIntensity.toString(16).padStart(2, '0')}${bgGreenIntensity.toString(16).padStart(2, '0')}${bgBlueIntensity.toString(16).padStart(2, '0')}`;

        const width = Math.floor(
            widthInterpolationMultiplier * (highlightWidthMultiplier * defaultWidth - defaultWidth) + defaultWidth
        );

        const animationEnd: boolean = progress >= totalDuration;
        if (ids.length > 0) {
            if (!animationEnd) {
                ids.forEach((nodeId) => {
                    queueNodeUpdate({ id: nodeId, color: { border: borderColorValue, background: bgColorValue, highlight: { border: borderColorValue, background: bgColorValue } }, borderWidth: width });
                });
            } else {
                ids.forEach((nodeId) => {
                    queueNodeUpdate({ id: nodeId, color: null, borderWidth: null });
                });
            }
        } else {
            if (!animationEnd) {
                nodes.get().forEach((node) => {
                    queueNodeUpdate({ id: node.id, color: { border: borderColorValue, background: bgColorValue, highlight: { border: borderColorValue, background: bgColorValue } }, borderWidth: width });
                });
            } else {
                nodes.get().forEach((node) => {
                    queueNodeUpdate({ id: node.id, color: null, borderWidth: null });
                });
            }
        }

        return animationEnd;
    }

    // Return a cancel function
    return step;
}

export const highlightEdges = (
    edges: DataSet<any, "id">,
    ids: string[] = [],
    highlightColor: string = '#00FF00',
    highlightWidthMultiplier: number = 5,
    duration: Record<string, { highlight: number, hold: number, fade: number }> = { color: { highlight: 500, hold: 0, fade: 500 }, width: { highlight: 500, hold: 0, fade: 500 } }
) => {
    let startTime: DOMHighResTimeStamp | null = null;
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

        const animationEnd: boolean = progress >= totalDuration;
        if (ids.length > 0) {
            if (!animationEnd) {
                ids.forEach((edgeId) => {
                    queueEdgeUpdate({ id: edgeId, color: { color: colorValue }, width: width });
                });
            } else {
                ids.forEach((edgeId) => {
                    queueEdgeUpdate({ id: edgeId, color: null, width: null });
                });
            }
        } else {
            if (!animationEnd) {
                edges.get().forEach((edge) => {
                    queueEdgeUpdate({ id: edge.id, color: { color: colorValue }, width: width });
                });
            } else {
                edges.get().forEach((edge) => {
                    queueEdgeUpdate({ id: edge.id, color: null, width: null });
                });
            }
        }

        return animationEnd;
    }

    return step;
}

export const moveNode = (
    network: Network | undefined,
    id: string,
    targetX: number,
    targetY: number,
    duration: number = 1000
) => {
    if (!network) return () => { return true; };
    let startTime: DOMHighResTimeStamp | null = null;

    const { x: startingX, y: startingY } = network.getPosition(id);

    function step(timestamp: DOMHighResTimeStamp) {
        if (!network) return true;
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const t = Math.min(progress / duration, 1);
        const easedT = easeInOutCubic(t);

        const xValue = startingX + easedT * (targetX - startingX);
        const yValue = startingY + easedT * (targetY - startingY);

        queueNodeUpdate({ id, x: xValue, y: yValue });

        return progress >= duration;
    }

    return step;
}

export const swapNodePositions = (
    network: Network | undefined,
    idA: string,
    idB: string,
    duration: number = 1000
) => {
    if (!network) return () => { return true; };

    const internalDuration = duration;

    const { x: startAx, y: startAy } = network.getPosition(idA);
    const { x: startBx, y: startBy } = network.getPosition(idB);

    const stepFn1 = moveNode(network, idA, startBx, startBy, internalDuration);
    const stepFn2 = moveNode(network, idB, startAx, startAy, internalDuration);

    // Return combined step function
    return (timestamp: DOMHighResTimeStamp) => {
        const step1Done = stepFn1(timestamp);
        const step2Done = stepFn2(timestamp);

        return step1Done && step2Done; // Animation is done when both stepFn1 and stepFn2 are done
    };
}