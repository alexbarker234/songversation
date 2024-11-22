import { saveScore } from "@/lib/localScoreManager";
import { TrackMap } from "@/types";
import { shuffleArray } from "@/utils/arrayUtils";
import { randBetween } from "@/utils/mathUtils";
import { trackHasLyrics } from "@/utils/trackUtils";
import { useEffect, useState } from "react";

/**
 * Hook to manage game state and logic for the lyric guessing game.
 * Handles track loading, scoring, game progression, and offline functionality.
 *
 * @param trackMap - Map of track IDs to track objects containing lyrics and metadata
 * @param type - Type of game being played ('playlist' or 'artist')
 * @param id - ID of the playlist or artist
 * @param isDataReady - Whether initial game data has been loaded
 * @param isOfflineReady - Whether all required data is cached for offline play
 * @param fetchLyrics - Function to fetch lyrics for given track IDs
 * @returns Object containing:
 *  - isPlayable: Whether the game is in a playable state
 *  - isLoaded: Whether game data has finished loading
 *  - lyricStartLine: Current starting line number for displayed lyrics
 *  - score: Current game score
 *  - isGameFinished: Whether the game has ended
 *  - trackOrder: Array of track IDs in play order
 *  - currentTrackIndex: Index of current track being played
 *  - errorMessage: Error message if game cannot be played
 *  - isLyricsLoading: Whether lyrics are currently being fetched
 */

export function useGame(
  trackMap: TrackMap,
  type: "playlist" | "artist",
  id: string,
  isDataReady: boolean,
  isOfflineReady: boolean,
  fetchLyrics: (trackIds: string[]) => Promise<void>
) {
  // Loading state
  const [isPlayable, setIsPlayable] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Data state
  const [lyricStartLine, setLyricStartLine] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isGameFinished, setGameFinished] = useState(false);
  const [trackOrder, setTrackOrder] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);

  // Error state
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  // Add new state to track lyrics loading
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);

  useEffect(() => {
    setIsPlayable(true);
  }, [trackMap]);

  // Wait until data is ready to load
  useEffect(() => {
    if (!isDataReady || trackOrder.length != 0) return;
    console.log("Starting game");
    loadGame();
  }, [isDataReady]);

  const loadGame = () => {
    let shuffledTrackIds: string[] = [];

    // Tracks with lyrics or tracks that haven't had lyrics fetched
    let availableTrackIds = Object.values(trackMap)
      .filter((track) => track.lyrics || !track.hasFetchedLyrics)
      .map((track) => track.id);
    const isOffline = !navigator.onLine;

    if (isOffline) {
      console.log(`Offline mode. Is game offline ready: ${isOfflineReady}`);

      if (!isOfflineReady) {
        setErrorMessage(`Internet connection required. Please download this ${type} while online to play offline.`);
        setIsPlayable(false);
        setIsLoaded(true);
        return;
      }

      availableTrackIds = availableTrackIds.filter((id) => trackMap[id] && trackHasLyrics(trackMap[id]));
    }

    shuffledTrackIds = [...availableTrackIds];
    shuffleArray(shuffledTrackIds);

    // Fetch the first 10 that don't already have lyrics
    const tracksWithoutLyrics = shuffledTrackIds.filter((id) => !trackMap[id]?.hasFetchedLyrics).slice(0, 10);
    const needsToFetch = tracksWithoutLyrics.length != 0;
    const areLyricsCached = tracksWithoutLyrics.every((id) => trackMap[id] && trackHasLyrics(trackMap[id]));

    const canStart = !needsToFetch || areLyricsCached;

    if (needsToFetch) {
      setIsLyricsLoading(true);
      fetchLyrics(tracksWithoutLyrics);
      console.log("Fetching lyrics");
    }

    setTrackOrder(shuffledTrackIds);
    setGameFinished(false);
    setScore(0);

    if (canStart) {
      // Start with the first track that has lyrics
      console.log("Starting game straight away");
      startWithFirstTrackWithLyrics(shuffledTrackIds);
    }
  };

  useEffect(() => {
    if (isLyricsLoading && trackOrder.length > 0) {
      console.log("Starting with newly fetched lyrics");
      startWithFirstTrackWithLyrics(trackOrder);
      setIsLyricsLoading(false);
    }
  }, [trackMap]);

  const startWithFirstTrackWithLyrics = (trackOrder: string[]) => {
    const index = findIndexWithLyrics(trackOrder);
    setIsLoaded(true);
    if (!trackOrder[index] || index === -1) {
      setErrorMessage("No tracks with lyrics found");
      console.log({ trackOrder, index });
      setIsPlayable(false);
      return;
    }

    setCurrentTrackIndex(index);
    setLyricStartLine(chooseLyricLine(trackOrder[index]));
  };

  const chooseLyricLine = (trackID: string) => {
    const track = trackMap[trackID];
    if (!track || !track.lyrics) return 0;
    return randBetween(0, track.lyrics.length - 3);
  };

  // Add a helper function to get current lyrics
  const getCurrentLyrics = (): string[] => {
    if (!trackOrder[currentTrackIndex]) return ["", "", ""];

    const currentTrack = trackMap[trackOrder[currentTrackIndex]];
    if (!currentTrack?.lyrics) return ["", "", ""];
    return currentTrack.lyrics.slice(lyricStartLine, lyricStartLine + 3);
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

    const newIndex = findIndexWithLyrics(trackOrder, currentTrackIndex + 1);
    if (newIndex === -1 || !trackOrder[newIndex]) return;

    setCurrentTrackIndex(newIndex);
    setLyricStartLine(chooseLyricLine(trackOrder[newIndex]));

    // Fetch the next 5 lyrics if there are only 2 more ahead with lyrics
    const fetchCount = 8;
    const remainingTracksWithLyrics = trackOrder
      .slice(currentTrackIndex + 1, currentTrackIndex + 1 + fetchCount)
      .filter((id) => trackMap[id] && trackHasLyrics(trackMap[id]) && !trackMap[id].hasFetchedLyrics);

    // TODO figure out offline situation here
    if (remainingTracksWithLyrics.length < 3 && navigator.onLine) {
      const nextTracksToFetch = trackOrder
        .slice(currentTrackIndex + 1, currentTrackIndex + 1 + fetchCount)
        .filter((id) => trackMap[id] && !trackMap[id].hasFetchedLyrics);
      fetchLyrics(nextTracksToFetch);
    }
  };

  const findIndexWithLyrics = (tracks: string[], startIndex = 0) => {
    let newIndex = startIndex;
    while (newIndex < tracks.length) {
      const trackId = tracks[newIndex];
      if (!trackId || (trackMap[trackId] && trackHasLyrics(trackMap[trackId]))) {
        return newIndex;
      }
      newIndex++;
    }
    return -1;
  };

  const finishGame = () => {
    setGameFinished(true);
    saveScore(type, id, score);
  };

  return {
    currentTrackID: trackOrder[currentTrackIndex],
    lyricDisplay: getCurrentLyrics(),
    score,
    isGameFinished,
    isLoaded,
    trackOrder,
    currentTrackIndex,
    isPlayable,
    errorMessage,
    loadGame,
    submit,
    finishGame
  };
}
