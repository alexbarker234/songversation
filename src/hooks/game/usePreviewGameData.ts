import { db } from "@/lib/db";
import { DetailedSpotifyItem, GameItem, PreviewMap, Track, TrackMap } from "@/types";
import { trackHasPreview } from "@/utils/trackUtils";
import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";

const upsertGameItem = async (gameItem: GameItem) => {
  const existingItem = await db.gameItems.get(gameItem.id);
  if (existingItem) {
    await db.gameItems.update(gameItem.id, {
      name: gameItem.name,
      imageURL: gameItem.imageURL,
      type: gameItem.type,
      trackIds: gameItem.trackIds,
      lastPlayed: gameItem.lastPlayed
    });
  } else {
    await db.gameItems.put(gameItem);
  }
};

const upsertTrackItem = async (track: Track) => {
  const existingTrack = await db.tracks.get(track.id);
  if (existingTrack) {
    await db.tracks.update(track.id, track);
  } else {
    await db.tracks.put(track);
  }
};

export function usePreviewGameData(type: "playlist" | "artist", id: string) {
  const [trackMap, setTrackMap] = useState<TrackMap>({});
  const [isDataReady, setIsDataReady] = useState(false);

  const liveGameItem = useLiveQuery(async () => await db.gameItems.get(id));

  const fetchGameItemFromAPI = async (): Promise<GameItem> => {
    const itemResponse = await fetch(`/api/item/${type}/${id}`);
    if (!itemResponse.ok) throw new Error("Failed to fetch game item from the server");

    const item: DetailedSpotifyItem = await itemResponse.json();
    const gameItem: GameItem = {
      id,
      name: item.name,
      imageURL: item.imageURL,
      type,
      trackIds: item.tracks.map((track) => track.id),
      lastPlayed: new Date().getTime()
    };

    const tracksWithPreviews = await db.tracks.where("id").anyOf(gameItem.trackIds).toArray();
    item.tracks.forEach((track) => {
      const cached = tracksWithPreviews.find((t) => t.id === track.id);
      track.previewUrl = cached?.previewUrl;
    });

    await upsertGameItem(gameItem);
    for (const track of item.tracks) {
      await upsertTrackItem(track);
    }
    setTrackMap(createTrackMap(item.tracks));
    setIsDataReady(true);

    return gameItem;
  };

  const createTrackMap = (tracks: Track[]): TrackMap => Object.fromEntries(tracks.map((track) => [track.id, track]));

  const fetchGameItemFromDB = async (): Promise<GameItem> => {
    const cachedGameItem = await db.gameItems.get(id);
    if (!cachedGameItem) throw new Error("No cached game item found");

    const cachedTracks = await db.tracks.where("id").anyOf(cachedGameItem.trackIds).toArray();
    setTrackMap(createTrackMap(cachedTracks));

    cachedGameItem.lastPlayed = new Date().getTime();
    await db.gameItems.put(cachedGameItem);

    setIsDataReady(true);
    return cachedGameItem;
  };

  const queryFn = async () => (navigator.onLine ? fetchGameItemFromAPI() : fetchGameItemFromDB());

  const fetchPreviews = async (trackIDs: string[]) => {
    if (!navigator.onLine) {
      console.warn("Cannot fetch previews when offline");
      return;
    }

    const res = await fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackIds: trackIDs })
    });

    if (res.ok) {
      const returnedPreviewMap: PreviewMap = await res.json();
      setTrackMap((oldTrackMap) => updateTrackMapWithPreviews(oldTrackMap, trackIDs, returnedPreviewMap));
    } else {
      console.error("Error fetching previews");
    }
  };

  const updateTrackMapWithPreviews = (
    trackMap: TrackMap,
    trackIDs: string[],
    returnedPreviewMap: PreviewMap
  ): TrackMap => {
    const updatedTrackMap: TrackMap = { ...trackMap };

    trackIDs.forEach((trackId) => {
      if (!updatedTrackMap[trackId]) return;

      const previewUrl = returnedPreviewMap[trackId] ?? updatedTrackMap[trackId]?.previewUrl;
      updatedTrackMap[trackId] = {
        ...updatedTrackMap[trackId],
        previewUrl,
        hasFetchedPreview: true
      };

      db.tracks.update(trackId, { previewUrl, hasFetchedPreview: true });
    });

    return updatedTrackMap;
  };

  const gameDataQuery = useQuery({
    queryKey: ["gameItem", "audio", type, id],
    queryFn,
    refetchOnWindowFocus: false,
    retry: typeof navigator !== "undefined" && navigator.onLine ? 3 : false,
    initialData: liveGameItem,
    refetchOnMount: true
  });

  const playableTrackCount = Object.values(trackMap).filter(trackHasPreview).length;

  return {
    gameItem: liveGameItem || gameDataQuery.data,
    isLoading: !isDataReady,
    trackMap,
    fetchPreviews,
    playableTrackCount
  };
}
