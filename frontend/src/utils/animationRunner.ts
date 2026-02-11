import { extractNodeUpdates, extractEdgeUpdates } from "./animations";
import { DataSet } from 'vis-network/standalone/esm/vis-network';

let isRendering = false;
let frameId: number | null = null;
let waitUntil: DOMHighResTimeStamp | null = null;
let nextStepIndex = 0;
let steps: Array<(timestamp: DOMHighResTimeStamp) => boolean> = [];

export const runAnimationSequence = async (
    animationSteps: Array<{
        animationCallback: () => (timestamp: DOMHighResTimeStamp) => boolean;
        description: string;
        timeBeforeNext: number;
    }>,
    nodes: DataSet<any, "id">,
    edges: DataSet<any, "id">
): Promise<void> => {
    isRendering = true;
    waitUntil = null;
    nextStepIndex = 0;
    steps = [];
    const render = (timestamp: DOMHighResTimeStamp) => {
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