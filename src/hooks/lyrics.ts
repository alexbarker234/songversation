import { chunkArray } from "@/utils/utils";
import { useEffect, useState } from "react";

/*

Why am I fetching lyrics on the client?
- For large playlists or artists with many songs, Vercel hobby tier overruns its 10s limit :(

*/
export const useLyrics = (inputMap: TrackMap) => {
  const [trackMap, setTrackMap] = useState(inputMap);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const remainingTrackIds = Object.keys(inputMap).filter((id) => !inputMap[id].hasFetchedLyrics);
    const trackIdGroups = chunkArray(remainingTrackIds, 50);
    const fetchLyrics = async () => {
      const responses = await Promise.all(
        trackIdGroups.map(async (group) => {
          const trackDataList = group.map((id) => ({
            artist: inputMap[id].artist,
            title: inputMap[id].name,
            id
          }));
          const res = await fetch("/api/lyrics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trackDataList })
          });

          return res.ok ? res.json() : {};
        })
      );

      // Combine all lyric results into a single object
      const combinedLyricMap = Object.assign({}, ...responses);

      // Update trackMap
      setTrackMap((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([id, track]) => [
            id,
            {
              ...track,
              lyrics: combinedLyricMap[id] || track.lyrics,
              hasFetchedLyrics: true
            }
          ])
        )
      );
    };

    fetchLyrics();
  }, [inputMap]);

  useEffect(() => {
    setIsDone(Object.values(trackMap).every((track) => track.hasFetchedLyrics));
  }, [trackMap]);

  return { trackMap, isDone };
};
