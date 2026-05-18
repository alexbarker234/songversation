export type SourceType = "artist" | "playlist";
export type GameType = "lyric" | "audio";

export function isValidSourceType(value: string): value is SourceType {
  return value === "artist" || value === "playlist";
}

export function isValidGameType(value: string): value is GameType {
  return value === "lyric" || value === "audio";
}

export function getGameSearchPath(type: SourceType, gameType: GameType) {
  return `/game/${type}/${gameType}`;
}

export function getGamePlayPath(type: SourceType, gameType: GameType, id: string) {
  return `/game/${type}/${gameType}/${id}`;
}

export function gameTypeLabel(gameType: GameType) {
  return gameType === "lyric" ? "Lyrics" : "Audio";
}
