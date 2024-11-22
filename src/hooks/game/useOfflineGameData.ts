import { db } from "@/lib/db";
import { GameItem, TrackMap } from "@/types";
import { useEffect, useState } from "react";

/**
 * Hook to manage offline data for a game item.
 * Handles fetching and storing lyrics for offline play, tracking progress, and managing offline state.
 *
 * @param gameItem - The game item (playlist/artist) to manage offline data for
 * @param trackMap - Map of track IDs to track objects containing lyrics and metadata
 * @param fetchLyrics - Function to fetch lyrics for given track IDs
 * @returns Object containing:
 *  - isLoading: Whether initial data is being loaded
 *  - offlineEnabled: Whether offline mode is enabled for this game item
 *  - offlineReady: Whether all required data is cached for offline play
 *  - progress: Download progress (0-100) for offline data
 *  - inProgress: Whether offline data is currently being fetched
 */
export const useOfflineGameData = (
  gameItem: GameItem | undefined,
  trackMap: TrackMap,
  fetchLyrics: (trackIds: string[]) => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [offlineEnabled, setEnabled] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [inProgress, setInProgress] = useState(false);

  useEffect(() => {
    if (!gameItem) return;
    setIsLoading(false);
    setEnabled(gameItem.offlineEnabled ?? false);
    setOfflineReady(gameItem.offlineReady ?? false);
  }, [gameItem]);

  useEffect(() => {
    updateProgress();
  }, [trackMap]);

  useEffect(() => {
    if (!offlineEnabled || !gameItem || inProgress || !Object.values(trackMap).length) return;

    const fetchAllLyrics = async () => {
      setInProgress(true);
      const tracksWithoutLyrics = Object.values(trackMap)
        .filter((track) => !track.lyrics && !track.hasFetchedLyrics)
        .map((track) => track.id);
      const totalTracks = tracksWithoutLyrics.length;
      console.log(`Starting offline prefetch: ${totalTracks} tracks to fetch`);
      if (totalTracks === 0) {
        await markAsOfflineReady();
        return;
      }

      // Fetch in chunks of 20
      for (let i = 0; i < totalTracks; i += 20) {
        const chunk = tracksWithoutLyrics.slice(i, i + 20);
        await fetchLyrics(chunk);
        await updateProgress();
      }

      await markAsOfflineReady();
    };

    fetchAllLyrics();
  }, [offlineEnabled, trackMap, fetchLyrics]);

  const updateProgress = async () => {
    if (!gameItem) return;

    const tracks = Object.values(trackMap);
    const totalTracks = tracks.length;

    if (totalTracks === 0) return;

    const fetchedTracks = await db.tracks
      .where("id")
      .anyOf(tracks.map((track) => track.id))
      .and((track) => track.hasFetchedLyrics === true)
      .count();

    setProgress(Math.min((fetchedTracks / totalTracks) * 100, 100));
  };

  const markAsOfflineReady = async () => {
    console.log("Marking game item as offline ready");
    gameItem && (await db.gameItems.update(gameItem.id, { offlineReady: true }));
  };

  const setOfflineEnabled = async (enabled: boolean) => {
    if (!gameItem) return;
    setEnabled(enabled);
    await db.gameItems.update(gameItem.id, { offlineEnabled: enabled });
  };

  return { isLoading, offlineReady, offlineEnabled, setOfflineEnabled };
};
