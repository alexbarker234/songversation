// TRACK
export interface Track {
  id: string;
  artist: string;
  name: string;
  imageURL: string;
  lyrics?: string[];
  hasFetchedLyrics?: boolean;
}
export interface TrackMap {
  [key: string]: Track;
}
// ALBUM
export interface Album {
  id: string;
  name: string;
  imageURL: string;
}
// ARTIST
export interface Artist {
  id: string;
  name: string;
  imageURL: string;
}

// MISC

export interface DetailedSpotifyItem {
  id: string;
  name: string;
  imageURL: string;
  tracks: Track[];
}

export interface SpotifyItem {
  id: string;
  name: string;
  imageURL: string;
}

export interface GameItem {
  id: string;
  name: string;
  imageURL: string;
  type: "playlist" | "artist";
  trackIds: string[];
  lastPlayed?: number;
  offlineReady?: boolean;
}

// LYRIC
export interface LyricMap {
  [key: string]: string[];
}
// USER
export interface UserData {
  name: string;
}

export interface TrackInfo {
  id: string;
  artist: string;
  title: string;
}
