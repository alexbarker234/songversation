import querystring from 'querystring';
 
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;
 
const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
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
            revalidate: 1000
        }
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

const LYRIC_ENDPOINT = `https://spotify-lyric-api.herokuapp.com/?trackid=`;

export const getLyrics = async (trackID: string) => {
    const response: LyricResponse = await (await fetch(LYRIC_ENDPOINT + trackID, { next: { revalidate: 6000 } })).json();
    if (response.error) return []
    let lyrics = response.lines.map((line) => line.words);
    lyrics= lyrics.filter((e) => e != '♪')

    return lyrics
}
interface LyricResponse {
    error: boolean
    lines: {
        words: string;
    }[];
}