export async function getLyrics(artist: string, title: string) {
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;

  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch lyrics: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    return formatLyrics(data.lyrics);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`An error occurred while fetching lyrics: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}

export const getMultipleLyrics = async (tracks: TrackInfo[]) => {
  const lyricMap: { [key: string]: string[] } = {};

  const start = Date.now();

  const requests = tracks.map(({ artist, title }) => {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    return fetch(url, { cache: "force-cache" })
      .then((res) => {
        if (res.status === 404) return undefined;
        if (!res.ok) throw new Error(`Failed to fetch lyrics: ${res.status} ${res.statusText}`);
        return res.json();
      })
      .catch((error) => {
        console.error(`Error fetching lyrics for ${artist} - ${title}: ${error.message}`);
        return undefined;
      });
  });

  const responses = await Promise.all(requests);
  console.log(`Fetched ${tracks.length} lyrics in ${Date.now() - start} ms`);

  responses.forEach((response, index) => {
    const { artist, title, id } = tracks[index];
    if (response) lyricMap[id] = formatLyrics(response.lyrics);
  });

  return lyricMap;
};

const formatLyrics = (plainlyrics: string) => {
  let lyrics = plainlyrics.split("\n");
  lyrics = lyrics.filter((line) => line.trim() !== "");

  return lyrics;
};
