interface Track {
    artist: string
    title: string,
    id: string
}
interface TrackMap {
    [key: string]: {
        artist: string;
        name: string;
        lyrics: string[]
    }
}
