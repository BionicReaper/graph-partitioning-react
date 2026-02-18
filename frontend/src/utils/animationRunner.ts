import { extractNodeUpdates, extractEdgeUpdates } from "./animations";
import { DataSet } from 'vis-network/standalone/esm/vis-network';

let animationSteps: Array<{
    animationCallback: () => (timestamp: DOMHighResTimeStamp) => boolean;
    description: string;
    timeBeforeNext: number;
}> | null = [];
let nodes: DataSet<any, "id"> | null = null;
let edges: DataSet<any, "id"> | null = null;

let isRendering = false;
let frameId: number | null = null;
let waitUntil: DOMHighResTimeStamp | null = null;
let nextStepIndex = 0;
let steps: Array<(timestamp: DOMHighResTimeStamp) => boolean> = [];

let lastTimestamp: DOMHighResTimeStamp | null = null; // Previous supplied timestamp from requestAnimationFrame
let realTimestamp: DOMHighResTimeStamp | null = null; // Simulation timestamp
let simulationSpeedFactor = 1; // 1 means real-time, <1 means slower, >1 means faster

const render = (nextTimestamp: DOMHighResTimeStamp) => {
    if (!animationSteps || !nodes || !edges) {
        console.error("Animation steps, nodes, or edges not set.");
        return;
    }
    const timestamp = (lastTimestamp === null)
        ? nextTimestamp
        : realTimestamp! + (nextTimestamp - lastTimestamp) * simulationSpeedFactor;
    realTimestamp = timestamp;
    lastTimestamp = nextTimestamp;

    if (!waitUntil) {
        waitUntil = timestamp;
    }

    while (timestamp >= waitUntil && nextStepIndex < animationSteps.length) {
        const step = animationSteps[nextStepIndex];
        console.log(`Scheduling animation step ${nextStepIndex + 1}/${animationSteps.length}: ${step.description}`);
        steps.push(step.animationCallback());
        waitUntil = timestamp + step.timeBeforeNext;
        nextStepIndex++;
    }

    if (steps.length > 0) {
        const stepsToExecute = steps;
        for (let i = 0; i < stepsToExecute.length; i++) {
            const stepDone = stepsToExecute[i](timestamp);
            if (stepDone) {
                steps.splice(steps.indexOf(stepsToExecute[i]), 1);
            }
        }

        const nodeUpdates = extractNodeUpdates();
        const edgeUpdates = extractEdgeUpdates();

        nodes.update(nodeUpdates);
        edges.update(edgeUpdates);


        if (steps.length > 0 || nextStepIndex < animationSteps.length) {
            frameId = requestAnimationFrame(render);
        } else if (nextStepIndex >= animationSteps.length && steps.length === 0 && timestamp >= waitUntil) {
            isRendering = false;
            waitUntil = null;
            frameId = null;
        } else {
            frameId = requestAnimationFrame(render);
        }
    } else if (nextStepIndex >= animationSteps.length && steps.length === 0 && timestamp >= waitUntil) {
        isRendering = false;
        waitUntil = null;
        frameId = null;
    } else {
        frameId = requestAnimationFrame(render);
    }
};

export const setSimulationSpeedFactor = (factor: number) => {
    simulationSpeedFactor = factor;
}

export const getSimulationSpeedFactor = () => {
    return simulationSpeedFactor;
}


export const runAnimationSequence = async (
    _animationSteps: Array<{
        animationCallback: () => (timestamp: DOMHighResTimeStamp) => boolean;
        description: string;
        timeBeforeNext: number;
    }>,
    _nodes: DataSet<any, "id">,
    _edges: DataSet<any, "id">
): Promise<void> => {
    animationSteps = _animationSteps;
    nodes = _nodes;
    edges = _edges;

    isRendering = true;
    waitUntil = null;
    nextStepIndex = 0;
    steps = [];

    frameId = requestAnimationFrame(render);

    // Return a promise that resolves when all animations complete
    return new Promise(resolve => {
        if (!isRendering) {
            resolve();
        } else {
            const checkRendering = () => {
                if (!isRendering) {
                    resolve();
                } else {
                    requestAnimationFrame(checkRendering);
                }
            };
            requestAnimationFrame(checkRendering);
        }
    });
}