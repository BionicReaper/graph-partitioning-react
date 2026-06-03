export const startNextPass = (
  algorithmPasses: number = 0,
  previousCutSize: number,
  currentCutSize: number,
  currentPass: number
) => {
  console.log(`Pass ${currentPass}: Algorithm Passes = ${algorithmPasses}, Previous Cut Size = ${previousCutSize}, Current Cut Size = ${currentCutSize}`);
  if (currentPass === 0) {
    return true; // Always start the first pass
  } else if (algorithmPasses === 0 && previousCutSize > currentCutSize) {
    console.log('Continuing to next pass because cut size increased.');
    return true;
  } else if (algorithmPasses > 0 && currentPass < algorithmPasses) {
    return true;
  } else {
    return false;
  }
}