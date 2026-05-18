import { saveScore } from "@/lib/localScoreManager";
import { TrackMap } from "@/types";
import { GameType } from "@/utils/gameTypes";
import { shuffleArray } from "@/utils/arrayUtils";
import { randBetween } from "@/utils/mathUtils";
import { trackHasLyrics, trackHasPreview } from "@/utils/trackUtils";
import { useEffect, useState } from "react";

export function useGame(
  trackMap: TrackMap,
  type: "playlist" | "artist",
  id: string,
  gameType: GameType,
  isDataReady: boolean,
  isOfflineReady: boolean,
  fetchContent: (trackIds: string[]) => Promise<void>
) {
  const isLyric = gameType === "lyric";

  const [isPlayable, setIsPlayable] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lyricStartLine, setLyricStartLine] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameFinished, setGameFinished] = useState(false);
  const [trackOrder, setTrackOrder] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [clipKey, setClipKey] = useState(0);

  useEffect(() => {
    setIsPlayable(true);
  }, [trackMap]);

  useEffect(() => {
    if (!isDataReady || trackOrder.length != 0) return;
    loadGame();
  }, [isDataReady]);

  const loadGame = () => {
    if (!isLyric && !navigator.onLine) {
      setErrorMessage("Internet connection required to play the audio quiz.");
      setIsPlayable(false);
      setIsLoaded(true);
      return;
    }

    let availableTrackIds = Object.values(trackMap)
      .filter((track) =>
        isLyric
          ? track.lyrics || !track.hasFetchedLyrics
          : track.previewUrl || !track.hasFetchedPreview
      )
      .map((track) => track.id);

    if (isLyric && !navigator.onLine) {
      if (!isOfflineReady) {
        setErrorMessage(`Internet connection required. Please download this ${type} while online to play offline.`);
        setIsPlayable(false);
        setIsLoaded(true);
        return;
      }
      availableTrackIds = availableTrackIds.filter((trackId) => trackMap[trackId] && trackHasLyrics(trackMap[trackId]));
    }

    const shuffledTrackIds = [...availableTrackIds];
    shuffleArray(shuffledTrackIds);

    const tracksNeedingFetch = shuffledTrackIds
      .filter((trackId) =>
        isLyric ? !trackMap[trackId]?.hasFetchedLyrics : !trackMap[trackId]?.hasFetchedPreview
      )
      .slice(0, 10);

    const needsToFetch = tracksNeedingFetch.length != 0;
    const areCached = tracksNeedingFetch.every((trackId) =>
      isLyric ? trackMap[trackId] && trackHasLyrics(trackMap[trackId]) : trackMap[trackId] && trackHasPreview(trackMap[trackId])
    );

    if (needsToFetch) {
      setIsContentLoading(true);
      void fetchContent(tracksNeedingFetch);
    }

    setTrackOrder(shuffledTrackIds);
    setGameFinished(false);
    setScore(0);

    if (!needsToFetch || areCached) {
      startWithFirstPlayableTrack(shuffledTrackIds);
    }
  };

  useEffect(() => {
    if (isContentLoading && trackOrder.length > 0) {
      startWithFirstPlayableTrack(trackOrder);
      setIsContentLoading(false);
    }
  }, [trackMap]);

  const startWithFirstPlayableTrack = (order: string[]) => {
    const index = findNextPlayableIndex(order);
    setIsLoaded(true);

    if (!order[index] || index === -1) {
      setErrorMessage(isLyric ? "No tracks with lyrics found" : "No tracks with audio previews found");
      setIsPlayable(false);
      return;
    }

    setCurrentTrackIndex(index);
    if (isLyric) {
      setLyricStartLine(chooseLyricLine(order[index]));
    } else {
      setClipKey((k) => k + 1);
    }
  };

  const chooseLyricLine = (trackID: string) => {
    const track = trackMap[trackID];
    if (!track?.lyrics) return 0;
    return randBetween(0, track.lyrics.length - 3);
  };

  const getCurrentLyrics = (): string[] => {
    const trackId = trackOrder[currentTrackIndex];
    if (!trackId) return ["", "", ""];

    const currentTrack = trackMap[trackId];
    if (!currentTrack?.lyrics) return ["", "", ""];
    return currentTrack.lyrics.slice(lyricStartLine, lyricStartLine + 3);
  };

  const getCurrentPreviewUrl = (): string | undefined => {
    const trackId = trackOrder[currentTrackIndex];
    if (!trackId) return undefined;
    return trackMap[trackId]?.previewUrl;
  };

  const submit = (trackId: string) => {
    if (trackOrder[currentTrackIndex] === trackId) {
      setScore((s) => s + 1);
      chooseNewSong();
    } else {
      finishGame();
    }
  };

  const chooseNewSong = () => {
    if (currentTrackIndex === trackOrder.length - 1) {
      setGameFinished(true);
      return;
    }

    const newIndex = findNextPlayableIndex(trackOrder, currentTrackIndex + 1);
    if (newIndex === -1 || !trackOrder[newIndex]) return;

    setCurrentTrackIndex(newIndex);
    if (isLyric) {
      setLyricStartLine(chooseLyricLine(trackOrder[newIndex]));
    } else {
      setClipKey((k) => k + 1);
    }

    const fetchCount = 8;
    const slice = trackOrder.slice(currentTrackIndex + 1, currentTrackIndex + 1 + fetchCount);

    const needsMoreCached = slice.filter((trackId) => {
      const track = trackMap[trackId];
      if (!track) return false;
      return isLyric
        ? trackHasLyrics(track) && !track.hasFetchedLyrics
        : trackHasPreview(track) && !track.hasFetchedPreview;
    }).length;

    if (needsMoreCached < 3 && navigator.onLine) {
      const nextToFetch = slice.filter((trackId) => {
        const track = trackMap[trackId];
        if (!track) return false;
        return isLyric ? !track.hasFetchedLyrics : !track.hasFetchedPreview;
      });
      void fetchContent(nextToFetch);
    }
  };

  const findNextPlayableIndex = (tracks: string[], startIndex = 0) => {
    let index = startIndex;
    while (index < tracks.length) {
      const trackId = tracks[index];
      const track = trackId ? trackMap[trackId] : undefined;
      const hasContent = track && (isLyric ? trackHasLyrics(track) : trackHasPreview(track));
      if (!trackId || hasContent) {
        return index;
      }
      index++;
    }
    return -1;
  };

  const finishGame = () => {
    setGameFinished(true);
    saveScore(type, id, score, gameType);
  };

  return {
    currentTrackID: trackOrder[currentTrackIndex],
    lyricDisplay: isLyric ? getCurrentLyrics() : undefined,
    previewUrl: isLyric ? undefined : getCurrentPreviewUrl(),
    clipKey,
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
