import { saveScore } from "@/lib/localScoreManager";
import { randBetween } from "@/utils/mathUtils";
import { shuffleArray } from "@/utils/utils";
import { useEffect, useState } from "react";

export function useGame(
  trackMap: TrackMap,
  type: "playlist" | "artist",
  id: string,
  fetchLyrics: (trackIds: string[], callback?: () => void) => void
) {
  const [lyricDisplay, setLyricDisplay] = useState<string[]>(["", "", ""]);
  const [score, setScore] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGameFinished, setGameFinished] = useState(false);

  // NEW
  const [trackOrder, setTrackOrder] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);

  useEffect(() => {
    console.log("Starting game");
    loadGame(true);
  }, []);

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
      setLyricDisplay(chooseLyrics(shuffledTrackIds[0]));
      setIsLoaded(true);
    } else {
      // Tracks with lyrics or tracks that haven't had lyrics fetched
      const availableTrackIds = Object.values(trackMap)
        .filter((track) => track.lyrics || !track.hasFetchedLyrics)
        .map((track) => track.id);

      shuffledTrackIds = [...availableTrackIds];
      shuffleArray(shuffledTrackIds);

      // Fetch the first 10 that don't already have lyrics
      const tracksWithoutLyrics = shuffledTrackIds.filter((id) => !trackMap[id].lyrics).slice(0, 10);
      const needsToFetch = tracksWithoutLyrics.length != 0;

      if (!needsToFetch) {
        setIsLoaded(true);
        setLyricDisplay(chooseLyrics(shuffledTrackIds[0]));
      } else {
        setIsLoaded(false);
        fetchLyrics(tracksWithoutLyrics);
      }

      setTrackOrder(shuffledTrackIds);
    }

    setGameFinished(false);
    setScore(0);
    setCurrentTrackIndex(0);
  };

  // For restarting games, when the lyrics need to be fetched
  useEffect(() => {
    if (!isLoaded && trackOrder.length != 0) {
      // Find track that has lyrics
      let newIndex = 0;
      while (!trackMap[trackOrder[newIndex]].lyrics) {
        newIndex++;
      }

      setCurrentTrackIndex(newIndex);
      setLyricDisplay(chooseLyrics(trackOrder[newIndex]));
      setIsLoaded(true);
    }
  }, [trackMap]);

  const chooseLyrics = (trackID: string) => {
    const track = trackMap[trackID];
    if (!track) {
      console.error("No track");
      return [];
    }
    if (!track.lyrics) {
      console.error("Track doesn't have lyrics", track);
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

    let newIndex = currentTrackIndex + 1;
    while (!trackMap[trackOrder[newIndex]].lyrics) {
      newIndex++;
    }

    setCurrentTrackIndex(newIndex);
    setLyricDisplay(chooseLyrics(trackOrder[newIndex]));

    // Fetch the next 5 lyrics if there are only 2 more ahead with lyrics
    const fetchCount = 8;
    const remainingTracksWithLyrics = trackOrder
      .slice(currentTrackIndex + 1, currentTrackIndex + 1 + fetchCount)
      .filter((id) => trackMap[id].lyrics);

    if (remainingTracksWithLyrics.length < 3) {
      const nextTracksToFetch = trackOrder
        .slice(currentTrackIndex + 1, currentTrackIndex + 1 + fetchCount)
        .filter((id) => !trackMap[id].hasFetchedLyrics);
      fetchLyrics(nextTracksToFetch);
    }
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
    isLoaded,
    trackOrder,
    currentTrackIndex,
    loadGame,
    submit,
    finishGame
  };
}
