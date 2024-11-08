import { db } from "@/db/db";
import { GameItem, TrackMap } from "@/types";
import { useEffect, useState } from "react";

export const useOfflineGameData = (
  gameItem: GameItem | undefined,
  trackMap: TrackMap,
  fetchLyrics: (trackIds: string[]) => void
) => {
  const [offlineEnabled, setEnabled] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [inProgress, setInProgress] = useState(false);

  useEffect(() => {
    if (!gameItem) return;
    setEnabled(gameItem.offlineEnabled ?? false);
    setOfflineReady(gameItem.offlineReady ?? false);
  }, [gameItem]);

  useEffect(() => {
    updateProgress();
  }, [trackMap]);

  useEffect(() => {
    console.log({ offlineEnabled, gameItem, inProgress, trackMap });
    if (!offlineEnabled || !gameItem || inProgress || !Object.values(trackMap).length) return;

    const fetchAllLyrics = async () => {
      console.log("Starting offline prefetch");
      setInProgress(true);
      const tracksWithoutLyrics = Object.values(trackMap)
        .filter((track) => !track.lyrics && !track.hasFetchedLyrics)
        .map((track) => track.id);
      console.log("tracksWithoutLyrics", tracksWithoutLyrics);
      const totalTracks = tracksWithoutLyrics.length;
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

  const markAsOfflineReady = async () => gameItem && (await db.gameItems.update(gameItem.id, { offlineReady: true }));

  const setOfflineEnabled = async (enabled: boolean) => {
    if (!gameItem) return;
    setEnabled(enabled);
    await db.gameItems.update(gameItem.id, { offlineEnabled: enabled });
  };

  return { offlineReady, offlineEnabled, setOfflineEnabled };
};
