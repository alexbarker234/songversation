import { db } from "@/db/db";
import { saveScore } from "@/lib/localScoreManager";
import { DetailedSpotifyItem, GameItem, LyricMap, Track, TrackMap } from "@/types";
import { randBetween } from "@/utils/mathUtils";
import { trackHasLyrics } from "@/utils/track";
import { shuffleArray } from "@/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";

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
    const cachedItem = await db.gameItems.get(id);
    if (!cachedItem) throw new Error("No cached game item found");

    const cachedTracks = await db.tracks.where("id").anyOf(cachedItem.trackIds).toArray();

    const cachedTracksWithLyrics = cachedTracks.filter((track) => trackHasLyrics(track));
    console.log(`${cachedTracksWithLyrics.length} cached tracks have lyrics`);

    setTrackMap(createTrackMap(cachedTracks));

    cachedItem.lastPlayed = new Date().getTime();
    await db.gameItems.put(cachedItem);

    return cachedItem;
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
    initialData: liveGameItem
  });

  return {
    gameItem: liveGameItem || gameDataQuery.data,
    isLoading: gameDataQuery.isLoading,
    trackMap,
    fetchLyrics
  };
}

export function useGame(
  trackMap: TrackMap,
  type: "playlist" | "artist",
  id: string,
  isDataReady: boolean,
  isOfflineReady: boolean,
  fetchLyrics: (trackIds: string[]) => void
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
    }

    setTrackOrder(shuffledTrackIds);
    setGameFinished(false);
    setScore(0);

    if (canStart) {
      // Start with the first track that has lyrics
      startWithFirstTrackWithLyrics(shuffledTrackIds);
    }
  };

  useEffect(() => {
    if (isLyricsLoading && trackOrder.length > 0) {
      console.log("Starting with newly fetched lyrics");
      startWithFirstTrackWithLyrics(trackOrder);
      setIsLyricsLoading(false);
    }
  }, [trackMap, isLyricsLoading, trackOrder]);

  const startWithFirstTrackWithLyrics = (trackOrder: string[]) => {
    const index = findIndexWithLyrics(trackOrder);
    if (!trackOrder[index] || index === -1) return;

    setCurrentTrackIndex(index);
    setLyricStartLine(chooseLyricLine(trackOrder[index]));
    setIsLoaded(true);
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
