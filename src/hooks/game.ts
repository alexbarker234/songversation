import { randBetween } from "@/lib/mathExtensions";
import { useEffect, useState } from "react";

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function useGame(trackMap: TrackMap) {
  const [currentTrackID, setCurrentTrackID] = useState<string>("");
  const [remainingTrackIDs, setRemainingTrackIDs] = useState<string[]>([]);
  const [lyricDisplay, setLyricDisplay] = useState<string[]>(["", "", ""]);
  const [score, setScore] = useState<number>(0);
  const [isGameFinished, setGameFinished] = useState(false);

  const trackIDs = Object.keys(trackMap);

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = () => {
    const remaining = [...trackIDs];
    shuffleArray(remaining);

    const firstID = remaining.pop();
    if (!firstID) {
      console.error("No track ID found.");
      return;
    }

    setGameFinished(false);
    setCurrentTrackID(firstID);
    setRemainingTrackIDs(remaining);
    setLyricDisplay(getLyrics(firstID));
    setScore(0);
  };

  const getLyrics = (trackID: string) => {
    const track = trackMap[trackID];
    if (track && track.lyrics) {
      const lyricStart = randBetween(0, track.lyrics.length - 3);
      return track.lyrics.slice(lyricStart, lyricStart + 3);
    }
    return [];
  };

  const chooseNewSong = () => {
    const newRemaining = [...remainingTrackIDs];
    let newID = newRemaining.pop();
    if (!newID) {
      shuffleArray(newRemaining);
      newID = newRemaining.pop();
      if (!newID) {
        console.error("No track ID found.");
        return;
      }
    }

    setCurrentTrackID(newID);
    setRemainingTrackIDs(newRemaining);
    setLyricDisplay(getLyrics(newID));
  };

  const finishGame = () => {
    setGameFinished(true);
    // TODO: save game to DB
  };

  return {
    currentTrackID,
    remainingTrackIDs,
    lyricDisplay,
    score,
    isGameFinished,
    loadGame,
    chooseNewSong,
    setScore,
    finishGame
  };
}
