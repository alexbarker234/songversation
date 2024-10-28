import { useState } from "react";

/*

Why am I fetching lyrics on the client?
- For large playlists or artists with many songs, Vercel hobby tier overruns its 10s limit :(
- Fetching 400 songs lyrics all at once on the server puts unneccesary strain on the lyrics API, if the user loses after 5 songs thats a major L and a waste

*/
export const useLyrics = (inputMap: TrackMap) => {
  const [trackMap, setTrackMap] = useState(inputMap);

  const fetchLyrics = async (trackIDs: string[], callback?: () => void) => {
    const trackDataList = trackIDs.map((id) => ({
      artist: inputMap[id].artist,
      title: inputMap[id].name,
      id
    }));
    const res = await fetch("/api/lyrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackDataList })
    });
    if (!res.ok) {
      console.error("Error fetching lyrics");
    }

    const returnedLyricMap: LyricMap = await res.json();

    setTrackMap((prev) => ({
      ...prev,
      ...Object.fromEntries(
        trackIDs.map((id) => [
          id,
          {
            ...prev[id],
            lyrics: returnedLyricMap[id] || prev[id].lyrics,
            hasFetchedLyrics: true
          }
        ])
      )
    }));
    callback?.();
  };

  return { trackMap, fetchLyrics };
};
