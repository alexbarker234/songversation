import seedrandom from "seedrandom";

export function shuffleArray(array: any[], seed?: string) {
  var rng = seedrandom(seed);
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
