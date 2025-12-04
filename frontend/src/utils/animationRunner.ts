export const runAnimationSequence = async (
    animationSteps: Array<{
        animationCallback: () => () => void;
        description: string;
        timeBeforeNext: number;
    }>
): Promise<void> => {
    const cancelFunctions: Array<() => void> = [];

    for (let i = 0; i < animationSteps.length; i++) {
        const step = animationSteps[i];
        
        // Run the animation callback
        const cancelFn = step.animationCallback();
        cancelFunctions.push(cancelFn);
        
        // If this step has a wait time, pause here
        if (step.timeBeforeNext > 0) {
            await new Promise(resolve => setTimeout(resolve, step.timeBeforeNext));
        }
    }

    // Return a promise that resolves when all animations complete
    return Promise.resolve();
}
