import querystring from "querystring";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const fetchSpotify = async (url: string) => {
  const { access_token: accessToken } = await getServerAccessToken();

  return fetch(`https://api.spotify.com/v1${url}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
};

export const getServerAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: querystring.stringify({
      grant_type: "client_credentials"
    }),
    next: {
      revalidate: 60 * 45
    }
  });

  const data = await response.json();

  return data;
};

const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks`;

export const getTopTracks = async () => {
  const { access_token } = await getServerAccessToken();

  return fetch(TOP_TRACKS_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });
};

export const getPlaylist = async (playlistID: string) => {
  const response = await fetchSpotify(`/playlists/${playlistID}`);
  if (!response.ok) return;

  const data: SpotifyPlaylistItem = await response.json();

  const playlist: SpotifyItem = { id: data.id, imageURL: data.images[0]?.url, name: data.name };

  return playlist;
};

export const getPlaylistTracks = async (playlistID: string) => {
  const limit = 100;
  const start = Date.now();

  const initialResponse = await fetchSpotify(`/playlists/${playlistID}/tracks?limit=${limit}`);

  if (!initialResponse.ok) return;

  const initialData = await initialResponse.json();
  const total = initialData.total;

  const parsePlaylistTracks = (tracks: SpotifyPlaylistTrackItem[]) =>
    tracks.map((item: SpotifyPlaylistTrackItem) => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists[0].name,
      imageURL: item.track.album.images[0]?.url
    }));

  // Extract tracks from the initial response
  const allTracks = parsePlaylistTracks(initialData.items);

  // Calculate the number of additional requests needed
  const requests = [];
  for (let offset = limit; offset < total; offset += limit) {
    const request = fetchSpotify(`/playlists/${playlistID}/tracks?limit=${limit}&offset=${offset}`)
      .then((res) => res.json())
      .then((data) => parsePlaylistTracks(data.items));
    requests.push(request);
  }

  // Promise all
  const results = await Promise.all(requests);
  results.forEach((tracks) => allTracks.push(...tracks));

  console.log(`Fetched ${allTracks.length} tracks from playlist ${playlistID} in ${Date.now() - start} ms`);

  return allTracks;
};

const ARTIST_ENDPOINT = (id: string) => `https://api.spotify.com/v1/artists/${id}`;

export const getArtist = async (id: string) => {
  const { access_token } = await getServerAccessToken();

  const response = await fetch(ARTIST_ENDPOINT(id), {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });
  if (!response.ok) return;

  const data: SpotifyArtistItem = await response.json();

  const artist: Artist = { id: data.id, imageURL: data.images[0]?.url, name: data.name };

  return artist;
};

const ARTIST_ALBUMS_ENDPOINT = (id: string) =>
  `https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single`;
const ALBUM_TRACKS_ENDPOINT = (id: string) => `https://api.spotify.com/v1/albums/${id}/tracks?limit=50`;

export const getArtistSongs = async (id: string) => {
  const { access_token } = await getServerAccessToken();

  const albums = await fetchArtistAlbums(access_token, id);
  const tracks = await fetchTracksFromAlbumList(access_token, albums);

  return tracks;
};

const fetchArtistAlbums = async (access_token: string, artistID: string) => {
  const start = Date.now();

  const albumEndpoint = ARTIST_ALBUMS_ENDPOINT(artistID);
  let nextTracksEndpoint: string | null = albumEndpoint;
  let albums: Album[] = [];
  do {
    const response: SpotifyArtistAlbumsResponse = await (
      await fetch(nextTracksEndpoint, {
        headers: {
          Authorization: `Bearer ${access_token}`
        },
        next: { revalidate: 6000 }
      })
    ).json();
    albums.push(...response.items.map((item) => ({ id: item.id, imageURL: item.images[0]?.url, name: item.name })));
    nextTracksEndpoint = response.next;
  } while (nextTracksEndpoint);

  const end = Date.now();
  console.log(`Fetched albums for artist ${artistID} in: ${end - start} ms`);

  // the most stupid regex to filter out covers, remmixes, etc
  albums = albums.filter((album) => {
    const regex = /[\[\(].* ?(?:Rework|Remix|Version|Acoustic|Acapella|Unplugged|Live|Instrumental)[\]\)]/i;
    return !regex.test(album.name) && album.name.toLowerCase() !== "spotify singles";
  });

  return albums;
};
const fetchTracksFromAlbumList = async (access_token: string, albums: Album[]) => {
  const start = Date.now();

  // create an array of promises for each request
  const requests = albums.map((album) => {
    return fetch(ALBUM_TRACKS_ENDPOINT(album.id), {
      headers: {
        Authorization: `Bearer ${access_token}`
      },
      next: { revalidate: 6000 }
    }).then((res) => res.json());
  });

  // make all the requests asynchronously
  const responses = await Promise.all(requests);

  let tracks: Track[] = [];
  // process the responses
  responses.forEach((response, index) => {
    const album = albums[index];
    tracks.push(
      ...response.items.map((item: SpotifyTrackItem) => ({
        id: item.id,
        name: item.name,
        artist: item.artists[0].name,
        imageURL: album.imageURL
      }))
    );
  });
  const end = Date.now();
  console.log(`Fetched tracks for ${albums.length} albums in: ${end - start} ms`);

  // remove duplicates
  const uniqueNames = new Set<string>();
  tracks = tracks.filter((track) => {
    if (uniqueNames.has(track.name)) {
      return false;
    } else {
      uniqueNames.add(track.name);
      return true;
    }
  });
  return tracks;
};

const SEARCH_ENDPOINT = `https://api.spotify.com/v1/search`;

export const searchSpotify = async (
  searchTerm: string,
  type: "artist" | "playlist"
): Promise<SpotifyItem[] | undefined> => {
  const { access_token } = await getServerAccessToken();

  const response: SearchResponse = await fetch(`${SEARCH_ENDPOINT}?q=${searchTerm}&type=${type}&limit=20`, {
    headers: { Authorization: `Bearer ${access_token}` },
    next: { revalidate: 6000 }
  }).then((res) => res.json());

  const items = type === "artist" ? response.artists?.items : response.playlists?.items;

  if (!items) return;

  return items.map((item) => ({
    name: item.name,
    id: item.id,
    imageURL: item.images[0]?.url || ""
  }));
};

export const fetchTrackByID = async (trackID: string) => {
  const { access_token } = await getServerAccessToken();

  const trackEndpoint = `https://api.spotify.com/v1/tracks/${trackID}`;
  let trackData: Track | null = null;

  try {
    const response: SpotifyTrackItem = await (
      await fetch(trackEndpoint, {
        cache: "force-cache",
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      })
    ).json();

    trackData = {
      id: response.id,
      name: response.name,
      artist: response.artists[0].name,
      imageURL: response.album.images[0]?.url
    };
  } catch (error) {
    console.error(`Failed to fetch track with ID ${trackID}:`, error);
  }

  return trackData;
};

export const fetchTracksByIDs = async (trackIDs: string[]) => {
  const { access_token } = await getServerAccessToken();
  const trackEndpoint = `https://api.spotify.com/v1/tracks`;

  try {
    const response = await fetch(`${trackEndpoint}?ids=${trackIDs.join(",")}`, {
      cache: "force-cache",
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const data: { tracks: SpotifyTrackItem[] } = await response.json();

    const tracksData = data.tracks.map((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      imageURL: track.album.images[0]?.url
    }));

    return tracksData;
  } catch (error) {
    console.error(`Failed to fetch tracks with IDs ${trackIDs.join(", ")}:`, error);
    return null;
  }
};

interface SearchResponse {
  artists: {
    items: SpotifyArtistItem[];
  };
  playlists: {
    items: SpotifyPlaylistItem[];
  };
}

interface SpotifyAlbumTracksResponse {
  items: SpotifyTrackItem[];
  next: string | null;
}
interface SpotifyArtistAlbumsResponse {
  items: SpotifyAlbumItem[];
  next: string | null;
}
interface SpotifyPlaylistTrackItem {
  track: SpotifyTrackItem;
}
interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: SpotifyTrackArtist[];
  album: SpotifyAlbumItem;
}
interface SpotifyAlbumItem {
  id: string;
  name: string;
  images: SpotifyImage[];
}
interface SpotifyArtistItem {
  id: string;
  name: string;
  images: SpotifyImage[];
}
interface SpotifyPlaylistItem {
  id: string;
  name: string;
  images: SpotifyImage[];
}

interface SpotifyImage {
  url: string;
}
interface SpotifyTrackArtist {
  name: string;
}
