import { getMultipleLyrics } from "@/lib/lyrics";
import { getArtistSongs, getPlaylistTracks } from "@/lib/spotify";

export async function getTrackData(id: string, type: "artist" | "playlist") {
  const trackList = type === "playlist" ? await getPlaylistTracks(id) : await getArtistSongs(id);
  if (!trackList) return null;

  // Create a map of tracks
  let trackMap: TrackMap = trackList.reduce((map, track) => {
    map[track.id] = track;
    return map;
  }, {} as TrackMap);

  // Prepare data for lyric fetching
  const trackDataList = trackList.map((track) => ({
    artist: track.artist,
    title: track.name,
    id: track.id
  }));

  // Fetch lyrics and add to the track map
  const lyricMap: LyricMap = await getMultipleLyrics(trackDataList);
  Object.entries(lyricMap).forEach(
    ([trackID, lyrics]) => (trackMap[trackID].lyrics = lyrics.length > 0 ? lyrics : undefined)
  );

  // Filter to include only tracks with available lyrics
  trackMap = Object.fromEntries(
    Object.entries(trackMap).filter(([_, value]) => value.lyrics && value.lyrics.length > 0)
  );

  return trackMap;
}
