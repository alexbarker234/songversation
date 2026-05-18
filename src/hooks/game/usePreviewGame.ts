import { saveScore } from "@/lib/localScoreManager";
import { TrackMap } from "@/types";
import { shuffleArray } from "@/utils/arrayUtils";
import { trackHasPreview } from "@/utils/trackUtils";
import { useEffect, useState } from "react";

export function usePreviewGame(
  trackMap: TrackMap,
  type: "playlist" | "artist",
  id: string,
  isDataReady: boolean,
  fetchPreviews: (trackIds: string[]) => Promise<void>
) {
  const [isPlayable, setIsPlayable] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [isGameFinished, setGameFinished] = useState(false);
  const [trackOrder, setTrackOrder] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isPreviewsLoading, setIsPreviewsLoading] = useState(false);
  const [clipKey, setClipKey] = useState(0);

  useEffect(() => {
    setIsPlayable(true);
  }, [trackMap]);

  useEffect(() => {
    if (!isDataReady || trackOrder.length != 0) return;
    loadGame();
  }, [isDataReady]);

  const loadGame = () => {
    if (!navigator.onLine) {
      setErrorMessage("Internet connection required to play the audio quiz.");
      setIsPlayable(false);
      setIsLoaded(true);
      return;
    }

    let availableTrackIds = Object.values(trackMap)
      .filter((track) => track.previewUrl || !track.hasFetchedPreview)
      .map((track) => track.id);

    const shuffledTrackIds = [...availableTrackIds];
    shuffleArray(shuffledTrackIds);

    const tracksWithoutPreviews = shuffledTrackIds.filter((trackId) => !trackMap[trackId]?.hasFetchedPreview).slice(0, 10);
    const needsToFetch = tracksWithoutPreviews.length != 0;
    const arePreviewsCached = tracksWithoutPreviews.every((trackId) => trackMap[trackId] && trackHasPreview(trackMap[trackId]));

    const canStart = !needsToFetch || arePreviewsCached;

    if (needsToFetch) {
      setIsPreviewsLoading(true);
      void fetchPreviews(tracksWithoutPreviews);
    }

    setTrackOrder(shuffledTrackIds);
    setGameFinished(false);
    setScore(0);

    if (canStart) {
      startWithFirstTrackWithPreview(shuffledTrackIds);
    }
  };

  useEffect(() => {
    if (isPreviewsLoading && trackOrder.length > 0) {
      startWithFirstTrackWithPreview(trackOrder);
      setIsPreviewsLoading(false);
    }
  }, [trackMap]);

  const startWithFirstTrackWithPreview = (order: string[]) => {
    const index = findIndexWithPreview(order);
    setIsLoaded(true);
    if (!order[index] || index === -1) {
      setErrorMessage("No tracks with audio previews found");
      setIsPlayable(false);
      return;
    }

    setCurrentTrackIndex(index);
    setClipKey((k) => k + 1);
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

    const newIndex = findIndexWithPreview(trackOrder, currentTrackIndex + 1);
    if (newIndex === -1 || !trackOrder[newIndex]) return;

    setCurrentTrackIndex(newIndex);
    setClipKey((k) => k + 1);

    const fetchCount = 8;
    const remainingTracksWithPreviews = trackOrder
      .slice(currentTrackIndex + 1, currentTrackIndex + 1 + fetchCount)
      .filter((trackId) => trackMap[trackId] && trackHasPreview(trackMap[trackId]) && !trackMap[trackId].hasFetchedPreview);

    if (remainingTracksWithPreviews.length < 3 && navigator.onLine) {
      const nextTracksToFetch = trackOrder
        .slice(currentTrackIndex + 1, currentTrackIndex + 1 + fetchCount)
        .filter((trackId) => trackMap[trackId] && !trackMap[trackId].hasFetchedPreview);
      void fetchPreviews(nextTracksToFetch);
    }
  };

  const findIndexWithPreview = (tracks: string[], startIndex = 0) => {
    let newIndex = startIndex;
    while (newIndex < tracks.length) {
      const trackId = tracks[newIndex];
      if (!trackId || (trackMap[trackId] && trackHasPreview(trackMap[trackId]))) {
        return newIndex;
      }
      newIndex++;
    }
    return -1;
  };

  const finishGame = () => {
    setGameFinished(true);
    saveScore(type, id, score, "audio");
  };

  return {
    currentTrackID: trackOrder[currentTrackIndex],
    previewUrl: getCurrentPreviewUrl(),
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
