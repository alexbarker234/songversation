import { use } from "react";
import Game from "./game";
import { getLyrics } from "@/lib/spotify";

export default async function Home({ params }: any) {
    const artistID = params.artistID;

    const trackList: Track[] = await (await fetch(`${process.env.URL}/api/test`, { next: { revalidate: 6000 } })).json();
    // get the first track & the next 2 tracks

    let trackMap: TrackMap = {};
    console.log("starting fetch");
    for (const track of trackList) {
        console.log(track.id);
        // might be better to call my route so we can cache the 404 responses
        const lyrics = await getLyrics(track.id);
        trackMap[track.id] = { name: track.title, lyrics, artist: track.artist };
    }

    // Filter the object to only include keys with non-zero length lyrics array
    trackMap = Object.fromEntries(Object.entries(trackMap).filter(([key, value]) => value.lyrics.length > 0));

    //console.log(trackMap)

    return (
        <>
            {/* <div>{JSON.stringify(data)}</div> */}
            <Game trackMap={trackMap}></Game>
        </>
    );
}
