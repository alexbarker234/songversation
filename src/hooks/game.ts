import { saveScore } from "@/lib/localScoreManager";
import { randBetween } from "@/lib/mathExtensions";
import { shuffleArray } from "@/utils/utils";
import { useEffect, useState } from "react";

export function useGame(trackMap: TrackMap, type: "playlist" | "artist", id: string) {
  const [lyricDisplay, setLyricDisplay] = useState<string[]>(["", "", ""]);
  const [score, setScore] = useState<number>(0);
  const [hasLoadedGame, setHasLoadedGame] = useState(false);
  const [isGameFinished, setGameFinished] = useState(false);

  // NEW
  const [trackOrder, setTrackOrder] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);

  const tracksWithLyrics = Object.values(trackMap).filter((track) => track.lyrics?.length);
  const trackIDsWithLyrics = tracksWithLyrics.map((track) => track.id);

  useEffect(() => {
    if (hasLoadedGame) return;
    console.log("Starting game");
    loadGame(true);
    setHasLoadedGame(true);
  }, [trackMap]);

  const loadGame = (isFirstGame?: boolean) => {
    let shuffledTrackIds: string[] = [];

    if (isFirstGame) {
      // Find the tracks that already have lyrics
      const withLyrics = Object.values(trackMap)
        .filter((t) => t.lyrics !== undefined)
        .map((t) => t.id);
      const withoutLyrics = Object.values(trackMap)
        .filter((t) => t.lyrics === undefined && !t.hasFetchedLyrics)
        .map((t) => t.id);
      if (withLyrics.length < 5) console.warn(`Only ${withLyrics.length} tracks have lyrics`);

      shuffleArray(withLyrics);
      shuffleArray(withoutLyrics);

      console.log(`${withLyrics.length} with, ${withoutLyrics.length} without`);

      shuffledTrackIds = [...withLyrics, ...withoutLyrics];
      setTrackOrder(shuffledTrackIds);
    } else {
      shuffledTrackIds = [...trackIDsWithLyrics];
      shuffleArray(shuffledTrackIds);
      setTrackOrder(shuffledTrackIds);
    }

    setGameFinished(false);
    setLyricDisplay(getLyrics(shuffledTrackIds[currentTrackIndex]));
    setScore(0);
  };

  const getLyrics = (trackID: string) => {
    const track = trackMap[trackID];
    if (!track || !track.lyrics) {
      console.error("No track, or track doesn't have lyrics");
      return [];
    }

    const lyricStart = randBetween(0, track.lyrics.length - 3);
    return track.lyrics.slice(lyricStart, lyricStart + 3);
  };

  const submit = (trackId: string) => {
    if (trackOrder[currentTrackIndex] === trackId) {
      setScore(score + 1);
      chooseNewSong();
    } else {
      finishGame();
    }
  };

  const chooseNewSong = () => {
    if (currentTrackIndex === trackOrder.length - 1) {
      // TODO, refresh order and start over
      console.log("Game finished");
      setGameFinished(true);
      return;
    }

    setCurrentTrackIndex(currentTrackIndex + 1);
  };

  const finishGame = () => {
    setGameFinished(true);
    saveScore(type, id, score);
  };

  return {
    currentTrackID: trackOrder[currentTrackIndex],
    lyricDisplay,
    score,
    isGameFinished,

    trackOrder,
    currentTrackIndex,

    loadGame,
    submit,
    finishGame
  };
}
