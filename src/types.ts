// TRACK
interface Track {
  id: string;
  artist: string;
  name: string;
  imageURL: string;
  lyrics?: string[];
}
interface TrackMap {
  [key: string]: Track;
}
// ALBUM
interface Album {
  id: string;
  name: string;
  imageURL: string;
}
// ARTIST
interface Artist {
  id: string;
  name: string;
  imageURL: string;
}

// MISC

interface SpotifyItem {
  id: string;
  name: string;
  imageURL: string;
}
// LYRIC
interface LyricMap {
  [key: string]: string[];
}
// USER
interface UserData {
  name: string;
}
