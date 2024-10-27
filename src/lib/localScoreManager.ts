interface HighScoreRecord {
  records: {
    artist: { [key: string]: number };
    playlist: { [key: string]: number };
  };
}

function getHighScores(): HighScoreRecord {
  const storedScores = localStorage.getItem("highScores");
  return storedScores ? JSON.parse(storedScores) : { records: { artist: {}, playlist: {} } };
}

function saveHighScores(highScores: HighScoreRecord): void {
  localStorage.setItem("highScores", JSON.stringify(highScores));
}

export function saveScore(type: "artist" | "playlist", id: string, score: number): void {
  const highScores = getHighScores();

  // If the score is higher than the existing score, or if there is no score, update it
  if (!highScores.records[type][id] || score > highScores.records[type][id]) {
    highScores.records[type][id] = score;
    saveHighScores(highScores);
  }
}

export function getScore(type: "artist" | "playlist", id: string): number | null {
  const highScores = getHighScores();
  return highScores.records[type][id] || null;
}

export function getAllScores(): HighScoreRecord {
  return getHighScores();
}
