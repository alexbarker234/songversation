interface HighScoreRecord {
  records: {
    artist: { [key: string]: number };
    playlist: { [key: string]: number };
    audio: {
      artist: { [key: string]: number };
      playlist: { [key: string]: number };
    };
  };
}

function getHighScores(): HighScoreRecord {
  const storedScores = localStorage.getItem("highScores");
  const defaults = { records: { artist: {}, playlist: {}, audio: { artist: {}, playlist: {} } } };
  if (!storedScores) return defaults;
  const parsed = JSON.parse(storedScores) as HighScoreRecord;
  if (!parsed.records.audio) parsed.records.audio = { artist: {}, playlist: {} };
  return parsed;
}

function saveHighScores(highScores: HighScoreRecord): void {
  localStorage.setItem("highScores", JSON.stringify(highScores));
}

export function saveScore(
  type: "artist" | "playlist",
  id: string,
  score: number,
  mode: "lyrics" | "audio" = "lyrics"
): void {
  const highScores = getHighScores();
  const records = mode === "audio" ? highScores.records.audio[type] : highScores.records[type];

  if (!records[id] || score > records[id]) {
    records[id] = score;
    saveHighScores(highScores);
  }
}

export function getScore(
  type: "artist" | "playlist",
  id: string,
  mode: "lyrics" | "audio" = "lyrics"
): number | null {
  const highScores = getHighScores();
  const records = mode === "audio" ? highScores.records.audio[type] : highScores.records[type];
  return records[id] || null;
}

export function getAllScores(): HighScoreRecord {
  return getHighScores();
}
