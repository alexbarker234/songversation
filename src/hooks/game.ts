import { db } from "@/db/db";
import { saveScore } from "@/lib/localScoreManager";
import { randBetween } from "@/utils/mathUtils";
import { shuffleArray } from "@/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useGameData(type: "playlist" | "artist", id: string) {
  const [trackMap, setTrackMap] = useState<TrackMap>({});

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
      trackIds: item.tracks.map((track) => track.id)
    };

    await db.gameItems.put(gameItem);
    await saveTracksToDB(item.tracks);
    setTrackMap(createTrackMap(item.tracks));

    return gameItem;
  };

  // Save tracks to IndexedDB and update trackMap
  const saveTracksToDB = async (tracks: Track[]) => {
    const trackMap = createTrackMap(tracks);
    for (const track of tracks) {
      await db.tracks.put(track);
    }
    return trackMap;
  };

  // Create a TrackMap from an array of tracks
  const createTrackMap = (tracks: Track[]): TrackMap => Object.fromEntries(tracks.map((track) => [track.id, track]));

  // Fetch GameItem from IndexedDB if offline
  const fetchGameItemFromDB = async (): Promise<GameItem> => {
    const cachedItem = await db.gameItems.get(id);
    if (!cachedItem) throw new Error("No cached game item found");

    const cachedTracks = await db.tracks.where("id").anyOf(cachedItem.trackIds).toArray();

    const cachedTracksWithLyrics = cachedTracks.filter((track) => track.lyrics !== undefined);
    console.log(`${cachedTracksWithLyrics.length} cached tracks have lyrics`);

    setTrackMap(createTrackMap(cachedTracks));

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

    const trackDataList = trackIDs.map((id) => ({
      artist: trackMap[id].artist,
      title: trackMap[id].name,
      id
    }));

    const res = await fetch("/api/lyrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackDataList })
    });

    if (res.ok) {
      const returnedLyricMap: LyricMap = await res.json();
      const updatedTrackMap = updateTrackMapWithLyrics(trackIDs, returnedLyricMap);
      setTrackMap(updatedTrackMap);
    } else {
      console.error("Error fetching lyrics");
    }
  };

  // Update trackMap and IndexedDB with fetched lyrics
  const updateTrackMapWithLyrics = (trackIDs: string[], returnedLyricMap: LyricMap): TrackMap => {
    const updatedTrackMap: TrackMap = { ...trackMap };

    trackIDs.forEach((id) => {
      const lyrics = returnedLyricMap[id] || updatedTrackMap[id].lyrics;
      updatedTrackMap[id] = { ...updatedTrackMap[id], lyrics, hasFetchedLyrics: true };

      // Update IndexedDB with fetched lyrics
      db.tracks.update(id, { lyrics, hasFetchedLyrics: true });
    });

    return updatedTrackMap;
  };

  // Use React Query to handle data fetching and caching
  const gameDataQuery = useQuery({
    queryKey: ["gameItem", type, id],
    queryFn,
    refetchOnWindowFocus: false,
    retry: typeof navigator !== "undefined" && navigator.onLine ? 3 : false
  });

  return {
    gameItem: gameDataQuery.data,
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
  fetchLyrics: (trackIds: string[], callback?: () => void) => void
) {
  const [lyricDisplay, setLyricDisplay] = useState<string[]>(["", "", ""]);
  const [score, setScore] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGameFinished, setGameFinished] = useState(false);
  const [trackOrder, setTrackOrder] = useState<string[]>([]);
  const [isPlayable, setIsPlayable] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);

  // Wait until data is ready to load
  useEffect(() => {
    if (!isDataReady || trackOrder.length != 0) return;
    console.log("Starting game");
    loadGame(false);
  }, [isDataReady]);

  const loadGame = (isFirstGame?: boolean) => {
    let shuffledTrackIds: string[] = [];

    // Tracks with lyrics or tracks that haven't had lyrics fetched
    let availableTrackIds = Object.values(trackMap)
      .filter((track) => track.lyrics || !track.hasFetchedLyrics)
      .map((track) => track.id);

    // Only use tracks that have lyrics if offline
    if (!navigator.onLine) availableTrackIds = availableTrackIds.filter((id) => trackMap[id].lyrics);

    if (availableTrackIds.length < 10) {
      console.log("Not enough tracks with lyrics to play");
      setIsPlayable(false);
      return;
    }

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

    if (remainingTracksWithLyrics.length < 3 && navigator.onLine) {
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
    isPlayable,
    loadGame,
    submit,
    finishGame
  };
}
