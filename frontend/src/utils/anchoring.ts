import { getIsRendering, getPauseStatus, pauseAnimation, restartRunningAnimation, resumeAnimation, setSimulationSpeedFactor } from "./animationRunner";

const SIMULATION_SKIP_SPEED_FACTOR = 1000000;

let anchor: { index: number, textKey: string } | null = null;

let targetAnchorIndex: number | null = null;

let wasPaused: boolean | null = null;

let anchorReachedCallback: () => Promise<void> = async () => { };

export const setAnchorReachedCallback = (callback: () => Promise<void>) => {
  anchorReachedCallback = callback;
}

export const clearAnchorReachedCallback = () => {
  anchorReachedCallback = async () => { };
}

const recoverPauseStatus = async () => {
  const currentPauseStatus = getPauseStatus();
  if (wasPaused === null) {
    return;
  }

  if (wasPaused === false && currentPauseStatus === true) {
    resumeAnimation();
  } else if (wasPaused === true && currentPauseStatus === false) {
    await pauseAnimation();
  }
  wasPaused = null;
}

const anchorReachedCleanup = async () => {
  targetAnchorIndex = null;
  setSimulationSpeedFactor(1, true);
  await recoverPauseStatus();
}

export const getAnchor = () => {
  return anchor ? { ...anchor } : null;
}

export const setAnchor = async (anchorIndex: number | null, textKey?: string) => {
  if (anchorIndex === null) {
    anchor = null;

    if (targetAnchorIndex !== null) {
      await anchorReachedCleanup();
    }

  } else {
    anchor = { index: anchorIndex, textKey: textKey || "" };

    if (targetAnchorIndex !== null && anchorIndex === targetAnchorIndex) {
      await anchorReachedCleanup();
    } else {
      await anchorReachedCallback();
    }
  }
}

export const goToAnchor = async (anchorIndex: number) => {
  const isRendering = getIsRendering();
  if (!isRendering) throw new Error("Cannot go to anchor while not rendering.");

  wasPaused = getPauseStatus();

  if (!wasPaused) await pauseAnimation();

  targetAnchorIndex = anchorIndex;

  if (anchor?.index !== null && anchor?.index !== undefined && anchorIndex < anchor?.index) {
    try {
      await restartRunningAnimation();
    } catch (error) {
      console.error("Error while restarting animation to go to anchor:", error);
      targetAnchorIndex = null;
      await recoverPauseStatus();
      return;
    }
  }

  setSimulationSpeedFactor(SIMULATION_SKIP_SPEED_FACTOR, true);

  resumeAnimation();
}