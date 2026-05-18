export const HIGH_SCORE_VERSION = 1;

type ScoreMap = { [key: string]: number };

interface SourceScores {
  artist: ScoreMap;
  playlist: ScoreMap;
}

export interface HighScoreRecord {
  version: number;
  records: {
    lyrics: SourceScores;
    audio: SourceScores;
  };
}

function createDefaultHighScores(): HighScoreRecord {
  return {
    version: HIGH_SCORE_VERSION,
    records: {
      lyrics: { artist: {}, playlist: {} },
      audio: { artist: {}, playlist: {} }
    }
  };
}

function isValidHighScoreRecord(parsed: unknown): parsed is HighScoreRecord {
  if (!parsed || typeof parsed !== "object") return false;
  const data = parsed as HighScoreRecord;
  return (
    data.version === HIGH_SCORE_VERSION &&
    !!data.records?.lyrics?.artist &&
    !!data.records?.lyrics?.playlist &&
    !!data.records?.audio?.artist &&
    !!data.records?.audio?.playlist
  );
}

function getHighScores(): HighScoreRecord {
  const storedScores = localStorage.getItem("highScores");
  if (!storedScores) return createDefaultHighScores();

  try {
    const parsed: unknown = JSON.parse(storedScores);
    if (isValidHighScoreRecord(parsed)) return parsed;
  } catch {
    // fall through to defaults
  }

  return createDefaultHighScores();
}

function saveHighScores(highScores: HighScoreRecord): void {
  highScores.version = HIGH_SCORE_VERSION;
  localStorage.setItem("highScores", JSON.stringify(highScores));
}

function getRecordsForMode(highScores: HighScoreRecord, mode: "lyric" | "audio", type: "artist" | "playlist") {
  const modeRecords = mode === "audio" ? highScores.records.audio : highScores.records.lyrics;
  return modeRecords[type];
}

export function saveScore(
  type: "artist" | "playlist",
  id: string,
  score: number,
  mode: "lyric" | "audio" = "lyric"
): void {
  const highScores = getHighScores();
  const records = getRecordsForMode(highScores, mode, type);

  if (!records[id] || score > records[id]) {
    records[id] = score;
    saveHighScores(highScores);
  }
}

export function getScore(
  type: "artist" | "playlist",
  id: string,
  mode: "lyric" | "audio" = "lyric"
): number | null {
  const highScores = getHighScores();
  const records = getRecordsForMode(highScores, mode, type);
  return records[id] || null;
}

export function getAllScores(): HighScoreRecord {
  return getHighScores();
}
