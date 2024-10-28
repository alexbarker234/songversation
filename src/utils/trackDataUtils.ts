import { getMultipleLyrics } from "@/lib/lyrics";
import { getArtistSongs, getPlaylistTracks } from "@/lib/spotify";
import { shuffleArray } from "./utils";

export async function getStartTrackData(id: string, type: "artist" | "playlist") {
  const trackList = type === "playlist" ? await getPlaylistTracks(id) : await getArtistSongs(id);
  if (!trackList) return null;

  // Create a map of tracks
  let trackMap: TrackMap = trackList.reduce((map, track) => {
    map[track.id] = track;
    return map;
  }, {} as TrackMap);

  // Prepare data for lyric fetching
  let trackDataList = trackList.map((track) => ({
    artist: track.artist,
    title: track.name,
    id: track.id
  }));

  let fetchedWithLyrics = 0;
  const maxBatchSize = 10;
  shuffleArray(trackDataList);

  // Process until at least 5 tracks have lyrics
  while (fetchedWithLyrics < 5 && trackDataList.length > 0) {
    // Slice the next batch of 10 tracks to fetch lyrics
    const currentBatch = trackDataList.slice(0, maxBatchSize);
    trackDataList = trackDataList.slice(maxBatchSize);

    // Fetch lyrics for the current batch
    const lyricMap: LyricMap = await getMultipleLyrics(currentBatch);

    // Update track map and count tracks with lyrics
    Object.entries(lyricMap).forEach(([trackID, lyrics]) => {
      trackMap[trackID].lyrics = lyrics.length > 0 ? lyrics : undefined;
      trackMap[trackID].hasFetchedLyrics = true;
      if (lyrics.length > 0) fetchedWithLyrics++;
    });
  }

  return trackMap;
}
