import { getGeniusLyrics } from "@/lib/geniusLyrics";
import { TrackInfo } from "@/types";

async function fetchFromOvh(artist: string, title: string): Promise<string | undefined> {
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
  const response = await fetch(url, { cache: "force-cache" });
  if (response.status === 404) return undefined;
  if (!response.ok) {
    throw new Error(`Failed to fetch lyrics: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data.lyrics;
}

export async function getLyrics(artist: string, title: string) {
  try {
    const ovhLyrics = await fetchFromOvh(artist, title);
    if (ovhLyrics) return formatLyrics(ovhLyrics);
  } catch (error: unknown) {
    console.error(`Error fetching lyrics from OVH for ${artist} - ${title}:`, error);
  }

  try {
    const geniusLyrics = await getGeniusLyrics(title, artist);
    return formatLyrics(geniusLyrics);
  } catch (error) {
    console.error(`Genius fallback failed for ${artist} - ${title}:`, error);
    return undefined;
  }
}

export const getMultipleLyrics = async (tracks: TrackInfo[]) => {
  const lyricMap: { [key: string]: string[] } = {};
  const start = Date.now();

  const results = await Promise.all(tracks.map(({ artist, title }) => getLyrics(artist, title)));

  console.log(`Fetched ${tracks.length} lyrics in ${Date.now() - start} ms`);

  results.forEach((lyrics, index) => {
    if (!tracks[index] || !lyrics) return;
    lyricMap[tracks[index].id] = lyrics;
  });

  return lyricMap;
};

const formatLyrics = (plainlyrics: string) => {
  plainlyrics = plainlyrics.replace(/\r/g, "");
  let lyrics = plainlyrics.split("\n");
  // todo figure out why the API returns this sometimes
  lyrics = lyrics.filter((line) => !line.includes("Paroles de la chanson"));
  lyrics = lyrics.filter((line) => line.trim() !== "");

  return lyrics;
};
