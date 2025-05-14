import seedrandom from "seedrandom";

export function randBetween(min: number, max: number, seed?: string) {
  var rng = seedrandom(seed);
  return Math.floor(rng() * (max - min + 1) + min);
}
