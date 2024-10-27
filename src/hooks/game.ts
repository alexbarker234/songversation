import { saveScore } from "@/lib/localScoreManager";
import { randBetween } from "@/lib/mathExtensions";
import { shuffleArray } from "@/utils/utils";
import { useEffect, useState } from "react";

export function useGame(trackMap: TrackMap, type: "playlist" | "artist", id: string) {
  const [currentTrackID, setCurrentTrackID] = useState<string>("");
  const [remainingTrackIDs, setRemainingTrackIDs] = useState<string[]>([]);
  const [lyricDisplay, setLyricDisplay] = useState<string[]>(["", "", ""]);
  const [score, setScore] = useState<number>(0);
  const [isGameFinished, setGameFinished] = useState(false);

  const tracksWithLyrics = Object.values(trackMap).filter((track) => track.lyrics?.length);
  const trackIDsWithLyrics = tracksWithLyrics.map((track) => track.id);

  useEffect(() => {
    if (currentTrackID !== "") return;
    console.log("Starting game");
    loadGame();
  }, [trackMap]);

  const loadGame = () => {
    const trackList = [...trackIDsWithLyrics];
    shuffleArray(trackList);

    const firstID = trackList.pop();
    if (!firstID) {
      console.error("No track ID found.");
      return;
    }

    setGameFinished(false);
    setCurrentTrackID(firstID);
    setRemainingTrackIDs(trackList);
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
    shuffleArray(newRemaining);

    let newID = newRemaining.pop();
    if (!newID) {
      console.error("No track ID found.");
      return;
    }
    setCurrentTrackID(newID);
    setRemainingTrackIDs(newRemaining);
    setLyricDisplay(getLyrics(newID));
  };

  const finishGame = () => {
    setGameFinished(true);
    saveScore(type, id, score);
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
