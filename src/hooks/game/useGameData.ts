import { db } from "@/lib/db";
import { DetailedSpotifyItem, GameItem, LyricMap, PreviewMap, Track, TrackMap } from "@/types";
import { GameType } from "@/utils/gameTypes";
import { trackHasLyrics, trackHasPreview } from "@/utils/trackUtils";
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

export function useGameData(type: "playlist" | "artist", id: string, gameType: GameType) {
  const [trackMap, setTrackMap] = useState<TrackMap>({});
  const [isDataReady, setIsDataReady] = useState(false);
  const isLyric = gameType === "lyric";

  const liveGameItem = useLiveQuery(async () => await db.gameItems.get(id));

  const createTrackMap = (tracks: Track[]): TrackMap => Object.fromEntries(tracks.map((track) => [track.id, track]));

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

    const cachedTracks = await db.tracks.where("id").anyOf(gameItem.trackIds).toArray();
    item.tracks.forEach((track) => {
      const cached = cachedTracks.find((t) => t.id === track.id);
      if (isLyric) {
        track.lyrics = cached?.lyrics;
      } else {
        track.previewUrl = cached?.previewUrl;
      }
    });

    await upsertGameItem(gameItem);
    for (const track of item.tracks) {
      await upsertTrackItem(track);
    }
    setTrackMap(createTrackMap(item.tracks));
    setIsDataReady(true);

    return gameItem;
  };

  const fetchGameItemFromDB = async (): Promise<GameItem> => {
    const cachedGameItem = await db.gameItems.get(id);
    if (!cachedGameItem) throw new Error("No cached game item found");

    const cachedTracks = await db.tracks.where("id").anyOf(cachedGameItem.trackIds).toArray();

    if (isLyric) {
      console.log(`${cachedTracks.filter(trackHasLyrics).length} cached tracks have lyrics`);
    }

    setTrackMap(createTrackMap(cachedTracks));

    cachedGameItem.lastPlayed = new Date().getTime();
    await db.gameItems.put(cachedGameItem);

    setIsDataReady(true);
    return cachedGameItem;
  };

  const queryFn = async () => (navigator.onLine ? fetchGameItemFromAPI() : fetchGameItemFromDB());

  const fetchContent = async (trackIDs: string[]) => {
    if (!navigator.onLine) {
      console.warn(`Cannot fetch ${gameType} content when offline`);
      return;
    }

    if (isLyric) {
      const trackDataList = trackIDs.map((trackId) => ({
        artist: trackMap[trackId]?.artist,
        title: trackMap[trackId]?.name,
        id: trackId
      }));

      const res = await fetch("/api/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackDataList })
      });

      if (res.ok) {
        const returnedLyricMap: LyricMap = await res.json();
        setTrackMap((oldTrackMap) => updateTrackMapWithLyrics(oldTrackMap, trackIDs, returnedLyricMap));
      } else {
        console.error("Error fetching lyrics");
      }
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

  const updateTrackMapWithLyrics = (trackMap: TrackMap, trackIDs: string[], returnedLyricMap: LyricMap): TrackMap => {
    const updatedTrackMap: TrackMap = { ...trackMap };

    trackIDs.forEach((trackId) => {
      let lyrics = returnedLyricMap[trackId] || updatedTrackMap[trackId]?.lyrics;
      if (!lyrics) lyrics = [];
      if (!updatedTrackMap[trackId]) return;

      updatedTrackMap[trackId] = { ...updatedTrackMap[trackId], lyrics, hasFetchedLyrics: true };
      db.tracks.update(trackId, { lyrics, hasFetchedLyrics: true });
    });

    return updatedTrackMap;
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
    queryKey: ["gameItem", gameType, type, id],
    queryFn,
    refetchOnWindowFocus: false,
    retry: typeof navigator !== "undefined" && navigator.onLine ? 3 : false,
    initialData: liveGameItem,
    refetchOnMount: true
  });

  const playableTrackCount = isLyric
    ? undefined
    : Object.values(trackMap).filter(trackHasPreview).length;

  return {
    gameItem: liveGameItem || gameDataQuery.data,
    isLoading: !isDataReady,
    trackMap,
    fetchContent,
    playableTrackCount
  };
}
