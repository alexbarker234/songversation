import { db } from "@/db/db";
import { saveScore } from "@/lib/localScoreManager";
import { randBetween } from "@/utils/mathUtils";
import { shuffleArray } from "@/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useGameData(type: "playlist" | "artist", id: string) {
  const [trackMap, setTrackMap] = useState<TrackMap>({});

  const queryFn = async (): Promise<GameItem> => {
    if (navigator.onLine) {
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

      const updatedTrackMap: TrackMap = {};
      for (const track of item.tracks) {
        await db.tracks.put(track);
        updatedTrackMap[track.id] = track;
      }

      setTrackMap(updatedTrackMap);
      return gameItem;
    } else {
      const cachedItem = await db.gameItems.get(id);
      if (!cachedItem) throw new Error("No cached game item found");

      const cachedTracks = await db.tracks.where("id").anyOf(cachedItem.trackIds).toArray();

      const cachedTrackMap = Object.fromEntries(cachedTracks.map((track) => [track.id, track]));
      setTrackMap(cachedTrackMap);

      return cachedItem;
    }
  };

  const fetchLyrics = async (trackIDs: string[], callback?: () => void) => {
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
    if (!res.ok) {
      console.error("Error fetching lyrics");
      return;
    }

    const returnedLyricMap: LyricMap = await res.json();

    // Update trackMap with lyrics and set hasFetchedLyrics to true
    const updatedTrackMap: TrackMap = { ...trackMap };
    for (const id of trackIDs) {
      updatedTrackMap[id] = {
        ...updatedTrackMap[id],
        lyrics: returnedLyricMap[id] || updatedTrackMap[id].lyrics,
        hasFetchedLyrics: true
      };

      // Update each track in IndexedDB with fetched lyrics
      await db.tracks.update(id, {
        lyrics: returnedLyricMap[id] || updatedTrackMap[id].lyrics,
        hasFetchedLyrics: true
      });
    }
    setTrackMap(updatedTrackMap);
    callback?.();
  };

  const gameDataQuery = useQuery({
    queryKey: ["gameItem", type, id],
    queryFn,
    refetchOnWindowFocus: false,
    // todo fix the server render not knowing what navigator is
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
    const availableTrackIds = Object.values(trackMap)
      .filter((track) => track.lyrics || !track.hasFetchedLyrics)
      .map((track) => track.id);

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

    if (remainingTracksWithLyrics.length < 3) {
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
    loadGame,
    submit,
    finishGame
  };
}
