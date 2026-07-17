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
    borderWidth?: number | null,
    size?: number,
    label?: string,
    weight?: number,
    children?: any[],
    createdAtLevel?: number
};

type EdgeUpdate = {
    id: string,
    from?: string,
    to?: string,
    color?: {
        color?: string
    } | null,
    width?: number | null,
    label?: string,
    weight?: number,
    children?: any[]
};

let nodeUpdates: Record<string, NodeUpdate> = {};
let edgeUpdates: Record<string, EdgeUpdate> = {};

let nodeDeletes: Set<string> = new Set();
let edgeDeletes: Set<string> = new Set();

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

export const extractNodeDeletes = () => {
    const extracted = Array.from(nodeDeletes);
    nodeDeletes.clear();
    return extracted;
}

export const extractEdgeDeletes = () => {
    const extracted = Array.from(edgeDeletes);
    edgeDeletes.clear();
    return extracted;
}

const queueNodeDelete = (id: string) => {
    nodeDeletes.add(id);
}

const queueEdgeDelete = (id: string) => {
    edgeDeletes.add(id);
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
    if (update.size !== undefined) {
        existing.size = update.size;
    }
    if (update.label !== undefined) {
        existing.label = update.label;
    }
    if (update.weight !== undefined) {
        existing.weight = update.weight;
    }
    if (update.children !== undefined) {
        existing.children = update.children;
    }
    if (update.createdAtLevel !== undefined) {
        existing.createdAtLevel = update.createdAtLevel;
    }
    nodeUpdates[update.id] = existing;
};

export const discardNodeUpdates = (ids: string[]) => {
    for (const id of ids) {
        delete nodeUpdates[id];
    }
};

export const discardEdgeUpdates = (ids: string[]) => {
    for (const id of ids) {
        delete edgeUpdates[id];
    }
};

const queueEdgeUpdate = (update: EdgeUpdate) => {
    const existing = edgeUpdates[update.id] ?? { id: update.id };
    if (update.from !== undefined) {
        existing.from = update.from;
    }
    if (update.to !== undefined) {
        existing.to = update.to;
    }
    if (update.color !== undefined) {
        existing.color = update.color;
    }
    if (update.width !== undefined) {
        existing.width = update.width;
    }
    if (update.label !== undefined) {
        existing.label = update.label;
    }
    if (update.weight !== undefined) {
        existing.weight = update.weight;
    }
    if (update.children !== undefined) {
        existing.children = update.children;
    }
    edgeUpdates[update.id] = existing;
};


export const runStandalone = (
    nodes: DataSet<any, "id">,
    edges: DataSet<any, "id">,
    stepFn: (timestamp: DOMHighResTimeStamp) => boolean
): () => void => {
    let animationFrameId: number | null = null;

    const step = (timestamp: DOMHighResTimeStamp) => {

        const done = stepFn(timestamp);

        const nodeUpdates = extractNodeUpdates();
        const edgeUpdates = extractEdgeUpdates();

        nodes.update(nodeUpdates);
        edges.update(edgeUpdates);

        if (!done) {
            animationFrameId = requestAnimationFrame(step);
        } else {
            animationFrameId = null;
        }
    };
    animationFrameId = requestAnimationFrame(step);

    // Return a cancel function
    return () => {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    };
}

export const changeSize = (
    nodes: DataSet<any, "id">,
    ids: string[] = [],
    duration: number = 300,
    startingSize: number = 1,
    targetSize: number = defaultVisOptions.nodes.size || 26,
    gradual: number = 0
) => {
    const nodeIds: string[] = ids.length > 0
        ? ids
        : nodes.get().map((node) => node.id);

    const count = nodeIds.length;

    const concurrency = (gradual <= 0) ? count : Math.min(gradual, count);
    const staggered = concurrency < count;

    const stagger = staggered ? duration / (count - 1 + concurrency) : 0;
    const nodeDuration = staggered ? concurrency * stagger : duration;

    let startTime: DOMHighResTimeStamp | null = null;

    function step(timestamp: DOMHighResTimeStamp) {
        if (!startTime) startTime = timestamp;

        const elapsed = timestamp - startTime;

        nodeIds.forEach((nodeId, index) => {
            const nodeProgress = elapsed - index * stagger;

            let size: number;
            if (nodeProgress <= 0) {
                size = startingSize;
            } else if (nodeDuration <= 0 || nodeProgress >= nodeDuration) {
                size = targetSize;
            } else {
                const easedT = easeInOutCubic(nodeProgress / nodeDuration);
                size = startingSize + easedT * (targetSize - startingSize);
            }

            queueNodeUpdate({ id: nodeId, size });
        });

        return elapsed >= duration;
    }

    return step;
}

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

        const progress = timestamp - startTime;

        const animationEnd: boolean = progress >= totalDuration;

        const widthInterpolationMultiplier = calcInterpolationMultiplier(progress, duration.width);

        const width = Math.floor(
            widthInterpolationMultiplier * (highlightWidthMultiplier * defaultWidth - defaultWidth) + defaultWidth
        );

        if (keepColorAfterHighlight && (timestamp - startTime >= duration.color.highlight)) {

            if (ids.length > 0) {
                ids.forEach((nodeId) => {
                    queueNodeUpdate({ id: nodeId, color: { border: highlightBorderColor, background: highlightBackgroundColor, highlight: { border: highlightBorderColor, background: highlightBackgroundColor } }, borderWidth: animationEnd ? null : width});
                });
            } else {
                nodes.get().forEach((node) => {
                    queueNodeUpdate({ id: node.id, color: { border: highlightBorderColor, background: highlightBackgroundColor, highlight: { border: highlightBorderColor, background: highlightBackgroundColor } }, borderWidth: animationEnd ? null : width});
                });
            }

            return animationEnd; // End animation immediately after reaching highlight color
        } else {

            const colorInterpolationMultiplier = calcInterpolationMultiplier(progress, duration.color);

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
    }

    // Return a cancel function
    return step;
}

export const highlightEdges = (
    edges: DataSet<any, "id">,
    ids: string[] = [],
    highlightColor: string = '#00FF00',
    highlightWidthMultiplier: number = 5,
    duration: Record<string, { highlight: number, hold: number, fade: number }> = { color: { highlight: 500, hold: 0, fade: 500 }, width: { highlight: 500, hold: 0, fade: 500 } },
    keepColorAfterHighlight: boolean = false
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

        const animationEnd: boolean = progress >= totalDuration;

        const widthInterpolationMultiplier = calcInterpolationMultiplier(progress, duration.width);

        const width = Math.floor(
            widthInterpolationMultiplier * (highlightWidthMultiplier * defaultWidth - defaultWidth) + defaultWidth
        );

        if (keepColorAfterHighlight && (timestamp - startTime >= duration.color.highlight)) {

            if (ids.length > 0) {
                ids.forEach((edgeId) => {
                    queueEdgeUpdate({ id: edgeId, color: { color: highlightColor }, width: animationEnd ? null : width });
                });
            } else {
                edges.get().forEach((edge) => {
                    queueEdgeUpdate({ id: edge.id, color: { color: highlightColor }, width: animationEnd ? null : width });
                });
            }

            return animationEnd; // End animation immediately after reaching highlight color
        } else {

            const colorInterpolationMultiplier = calcInterpolationMultiplier(progress, duration.color);

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
        const t = (duration <= 0) 
            ? 1 
            : Math.min(progress / duration, 1);
        const easedT = easeInOutCubic(t);

        const xValue = startingX + easedT * (targetX - startingX);
        const yValue = startingY + easedT * (targetY - startingY);

        queueNodeUpdate({ id, x: xValue, y: yValue });

        return progress >= duration;
    }

    return step;
}

export const moveNodeRelative = (
    network: Network | undefined,
    movedNodeId: string,
    originNodeId: string,
    deltaX: number,
    deltaY: number,
    duration: number = 1000
) => {
    if (!network) return () => { return true; };

    const {x: scheduledX, y: scheduledY} = nodeUpdates[originNodeId] ?? { x: undefined, y: undefined };

    const { x: originX, y: originY } = 
        (scheduledX !== undefined && scheduledY !== undefined)
            ? { x: scheduledX, y: scheduledY }
            : network.getPosition(originNodeId);
    const targetX = originX + deltaX;
    const targetY = originY + deltaY;

    return moveNode(network, movedNodeId, targetX, targetY, duration);
}

export const swapNodePositions = (
    network: Network | undefined,
    idA: string,
    idB: string,
    duration: number = 1000
) => {
    if (!network) return () => { return true; };

    const internalDuration = duration;

    const { x: scheduledAx, y: scheduledAy } = nodeUpdates[idA] ?? { x: undefined, y: undefined };
    const { x: scheduledBx, y: scheduledBy } = nodeUpdates[idB] ?? { x: undefined, y: undefined };

    const { x: startAx, y: startAy } = 
        (scheduledAx !== undefined && scheduledAy !== undefined)
            ? { x: scheduledAx, y: scheduledAy }
            : network.getPosition(idA);
    const { x: startBx, y: startBy } = 
        (scheduledBx !== undefined && scheduledBy !== undefined)
                ? { x: scheduledBx, y: scheduledBy }
                : network.getPosition(idB);

    const stepFn1 = moveNode(network, idA, startBx, startBy, internalDuration);
    const stepFn2 = moveNode(network, idB, startAx, startAy, internalDuration);

    // Return combined step function
    return (timestamp: DOMHighResTimeStamp) => {
        const step1Done = stepFn1(timestamp);
        const step2Done = stepFn2(timestamp);

        return step1Done && step2Done; // Animation is done when both stepFn1 and stepFn2 are done
    };
}

export const replaceNodesWithCompoundNode = (
    network: Network,
    nodes: DataSet<any, "id">,
    nodeIds: string[],
    compoundNode: any,
    duration: number = 1000
) => {
    if (!network || !nodeIds || nodeIds.length < 2) return () => { return true; };

    const { x: targetX, y: targetY } = network.getPosition(nodeIds[0]);

    const stepFnArray: ((timestamp: DOMHighResTimeStamp) => boolean)[] = [];
    for (const [index, nodeId] of nodeIds.entries()) {
        if (index === 0) continue; // Skip the first node, as it will be replaced by the compound node

        // The rest move to the position of the first node
        stepFnArray.push(moveNode(network, nodeId, targetX, targetY, duration));
    }

    return (timestamp: DOMHighResTimeStamp) => {

        let allDone = true;
        for (const stepFn of stepFnArray) {
            const done = stepFn(timestamp);
            if (!done) {
                allDone = false;
            }
        }

        if (allDone) {
            // Drop the position updates the final moveNode frame queued, otherwise the
            // renderer's nodes.update() would re-insert the removed ids as bare nodes
            discardNodeUpdates(nodeIds);

            // After all nodes have moved, replace them with the compound node
            nodes.remove(nodeIds);

            compoundNode.x = targetX;
            compoundNode.y = targetY;

            nodes.add(compoundNode);
        }
        return allDone;
    }
}

export const splitCompoundNodes = (
    network: Network,
    splits: Array<{ compoundNodeId: string, childNodes: NodeUpdate[] }>
) => {
    if (!network || !splits || splits.length === 0) return () => { return true; };

    return () => {

        for (const split of splits) {
            const { compoundNodeId, childNodes } = split;
            const { x: targetX, y: targetY } = network.getPosition(compoundNodeId);

            // Remove the compound node
            queueNodeDelete(compoundNodeId);

            // Add the child nodes at the position of the compound node
            for (const childNode of childNodes) {
                childNode.x = targetX;
                childNode.y = targetY;
                queueNodeUpdate(childNode);
            }
        }
    }
}

export const replaceEdgeSet = (
    deleteEdgeIds: string[],
    addEdges: EdgeUpdate[]
) => {
    return () => {

        for (const edgeId of deleteEdgeIds) {
            queueEdgeDelete(edgeId);
        }

        // Add the child edges
        for (const edge of addEdges) {
            queueEdgeUpdate(edge);
        }
    }
}