import querystring from "querystring";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

export const getServerAccessToken = async () => {
    const response = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: querystring.stringify({
            grant_type: "refresh_token",
            refresh_token,
        }),
        //cache: 'no-store'
        next: {
            revalidate: 1000,
        },
    });

    return response.json();
};

const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks`;

export const getTopTracks = async () => {
    const { access_token } = await getServerAccessToken();

    return fetch(TOP_TRACKS_ENDPOINT, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
};

const ARTIST_ENDPOINT = (id: string) => `https://api.spotify.com/v1/artists/${id}`;

export const getArtist = async (id: string) => {
    const { access_token } = await getServerAccessToken();

    const response = await fetch(ARTIST_ENDPOINT(id), {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
    if (!response.ok) return;

    const data: SpotifyArtistItem = await response.json();
    console.log(data)

    const artist: Artist = { id: data.id, imageURL: data.images[0]?.url, name: data.name };

    return artist;
};

const ARTIST_ALBUMS_ENDPOINT = (id: string) => `https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single`;
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
                    Authorization: `Bearer ${access_token}`,
                },
                next: { revalidate: 6000 },
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
                Authorization: `Bearer ${access_token}`,
            },
            next: { revalidate: 6000 },
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
                imageURL: album.imageURL,
            }))
        );
    });
    const end = Date.now();
    console.log(`Fetched tracks for ${albums.length} albums in: ${end - start} ms`);

    // remove duplicates
    const uniqueNames = new Set<string>();
    console.log(tracks.length);

    tracks = tracks.filter((track) => {
        if (uniqueNames.has(track.name)) {
            return false;
        } else {
            uniqueNames.add(track.name);
            return true;
        }
    });
    console.log(tracks.length);
    return tracks;
};

const LYRIC_ENDPOINT = `https://spotify-lyric-api.herokuapp.com/?trackid=`;

export const getLyrics = async (trackID: string) => {
    const response: LyricResponse = await (await fetch(LYRIC_ENDPOINT + trackID, { next: { revalidate: 6000 } })).json();
    if (response.error) return [];
    let lyrics = response.lines.map((line) => line.words);
    lyrics = lyrics.filter((e) => e != "♪");

    return lyrics;
};

export const getMultipleLyrics = async (trackIDs: string[]) => {
    const lyricMap: { [key: string]: string[] } = {};
    const requests = trackIDs.map((trackID) => {
        return fetch(LYRIC_ENDPOINT + trackID, { next: { revalidate: 6000 } }).then((res) => res.json());
    });

    const responses = await Promise.all(requests);

    responses.forEach((response: LyricResponse, index) => {
        const trackID = trackIDs[index];
        if (response.error) {
            lyricMap[trackID] = [];
        } else {
            let lyrics = response.lines.map((line) => line.words);
            lyrics = lyrics.filter((e) => e !== "♪" && e !== "");
            lyricMap[trackID] = lyrics;
        }
    });

    return lyricMap;
};

const SEARCH_ENDPOINT = `https://api.spotify.com/v1/search`;

export const searchArtist = async (searchTerm: string) => {
    const { access_token } = await getServerAccessToken();

    const response: SearchResponse = await (
        await fetch(SEARCH_ENDPOINT + `?q=${searchTerm}&type=artist&limit=20`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            next: { revalidate: 6000 },
        })
    ).json();
    if (!response.artists) {
        console.log(response);
        return;
    }
    return response.artists.items.map((item) => <Artist>{ name: item.name, id: item.id, imageURL: item.images[0]?.url });
};

interface SearchResponse {
    artists: {
        items: SpotifyArtistItem[];
    };
}

interface LyricResponse {
    error: boolean;
    lines: {
        words: string;
    }[];
}
interface SpotifyAlbumTracksResponse {
    items: SpotifyTrackItem[];
    next: string | null;
}
interface SpotifyArtistAlbumsResponse {
    items: SpotifyAlbumItem[];
    next: string | null;
}
interface SpotifyTrackItem {
    id: string;
    name: string;
    artists: SpotifyTrackArtist[];
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
interface SpotifyImage {
    url: string;
}
interface SpotifyTrackArtist {
    name: string;
}
