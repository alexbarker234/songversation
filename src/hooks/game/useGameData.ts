import { db } from "@/lib/db";
import { DetailedSpotifyItem, GameItem, LyricMap, Track, TrackMap } from "@/types";
import { trackHasLyrics } from "@/utils/track";
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

export function useGameData(type: "playlist" | "artist", id: string) {
  const [trackMap, setTrackMap] = useState<TrackMap>({});
  const [isDataReady, setIsDataReady] = useState(false);

  const liveGameItem = useLiveQuery(async () => await db.gameItems.get(id));

  // // Update offline ready
  // useEffect(() => {
  //   if (!liveGameItem || !trackMap) return;
  //   const updateOfflineReady = async () => {
  //     if (!navigator.onLine) return;
  //     // check if all tracks in the db have been fetched
  //     const allTracksFetched = await db.tracks
  //       .where("id")
  //       .anyOf(liveGameItem.trackIds)
  //       .toArray()
  //       .then((tracks) => tracks.every((track) => trackHasLyrics(track)));
  //     db.gameItems.update(id, { offlineReady: allTracksFetched });
  //   };
  //   updateOfflineReady();
  // }, [liveGameItem]);

  // Fetch GameItem from API
  const fetchGameItemFromAPI = async (): Promise<GameItem> => {
    console.log("Fetching game item from API");
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

    // Load lyrics from DB if possible, but dont mark as fetched
    const tracksWithLyrics = await db.tracks.where("id").anyOf(gameItem.trackIds).toArray();
    item.tracks.forEach((track) => {
      track.lyrics = tracksWithLyrics.find((t) => t.id === track.id)?.lyrics;
    });

    await upsertGameItem(gameItem);
    await saveTracksToDB(item.tracks);
    setTrackMap(createTrackMap(item.tracks));
    setIsDataReady(true);

    return gameItem;
  };

  // Save tracks to IndexedDB
  const saveTracksToDB = async (tracks: Track[]) => {
    for (const track of tracks) {
      upsertTrackItem(track);
    }
  };

  // Create a TrackMap from an array of tracks
  const createTrackMap = (tracks: Track[]): TrackMap => Object.fromEntries(tracks.map((track) => [track.id, track]));

  // Fetch GameItem from IndexedDB if offline
  const fetchGameItemFromDB = async (): Promise<GameItem> => {
    console.log("Fetching game item from DB");
    const cachedGameItem = await db.gameItems.get(id);
    if (!cachedGameItem) throw new Error("No cached game item found");

    const cachedTracks = await db.tracks.where("id").anyOf(cachedGameItem.trackIds).toArray();

    const cachedTracksWithLyrics = cachedTracks.filter((track) => trackHasLyrics(track));
    console.log(`${cachedTracksWithLyrics.length} cached tracks have lyrics`);

    setTrackMap(createTrackMap(cachedTracks));

    cachedGameItem.lastPlayed = new Date().getTime();
    await db.gameItems.put(cachedGameItem);

    setIsDataReady(true);
    return cachedGameItem;
  };

  // Main query function to handle online/offline logic
  const queryFn = async () => (navigator.onLine ? fetchGameItemFromAPI() : fetchGameItemFromDB());

  // Fetch lyrics and update trackMap and IndexedDB
  const fetchLyrics = async (trackIDs: string[]) => {
    if (!navigator.onLine) {
      console.warn("Cannot fetch lyrics when offline");
      return;
    }
    console.log(`Fetching lyrics for ${trackIDs.length} tracks`);

    const trackDataList = trackIDs.map((id) => ({
      artist: trackMap[id]?.artist,
      title: trackMap[id]?.name,
      id
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
  };

  // Update trackMap and IndexedDB with fetched lyrics
  const updateTrackMapWithLyrics = (trackMap: TrackMap, trackIDs: string[], returnedLyricMap: LyricMap): TrackMap => {
    const updatedTrackMap: TrackMap = { ...trackMap };

    trackIDs.forEach((id) => {
      let lyrics = returnedLyricMap[id] || updatedTrackMap[id]?.lyrics;
      if (!lyrics) lyrics = [];

      if (!updatedTrackMap[id]) return;

      updatedTrackMap[id] = { ...updatedTrackMap[id], lyrics, hasFetchedLyrics: true };

      // Update IndexedDB with fetched lyrics
      db.tracks.update(id, { lyrics, hasFetchedLyrics: true });
    });

    return updatedTrackMap;
  };

  // Modify the gameDataQuery to use the live data
  const gameDataQuery = useQuery({
    queryKey: ["gameItem", type, id],
    queryFn,
    refetchOnWindowFocus: false,
    retry: typeof navigator !== "undefined" && navigator.onLine ? 3 : false,
    initialData: liveGameItem,
    refetchOnMount: true // TODO make trackmap load
  });

  return {
    gameItem: liveGameItem || gameDataQuery.data,
    isLoading: !isDataReady,
    trackMap,
    fetchLyrics
  };
}
