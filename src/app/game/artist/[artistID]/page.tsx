import { redirect } from "next/navigation";
import Game from "../../game";
import styles from "../../game.module.scss";
import { getMultipleLyrics } from "@/lib/lyrics";

export default async function Home({ params }: { params: { artistID: string } }) {
    const { artistID } = await params;

    //const artistInfo:
    const artistResponse = await fetch(`${process.env.URL}/api/get-artist?id=${artistID}`, {
        next: { revalidate: 6000 }
    });
    if (!artistResponse.ok) redirect("/game/artist");
    const artistInfo: Artist = await artistResponse.json();

    console.log(artistInfo);

    const trackList: Track[] = await (
        await fetch(`${process.env.URL}/api/get-artist-songs?id=${artistID}`, { next: { revalidate: 6000 } })
    ).json();

    let trackMap: TrackMap = trackList.reduce((map, track) => {
        map[track.id] = track;
        return map;
    }, {} as TrackMap);

    const trackDataList = trackList.map((track) => ({
        artist: track.artist,
        title: track.name,
        id: track.id
    }));

    const lyricMap: LyricMap = await getMultipleLyrics(trackDataList);

    // add lyrics to trackmap
    Object.entries(lyricMap).forEach(
        ([trackID, lyrics]) => (trackMap[trackID].lyrics = lyrics.length > 0 ? lyrics : undefined)
    );
    // Filter the object to only include keys with non-zero length lyrics array
    trackMap = Object.fromEntries(
        Object.entries(trackMap).filter(([key, value]) => value.lyrics && value.lyrics.length > 0)
    );

    //console.log(trackMap)

    return (
        <>
            {/* <div>{JSON.stringify(data)}</div> */}
            <div className={styles["title"]}>Which {artistInfo.name} song is this?</div>
            <Game trackMap={trackMap}></Game>
        </>
    );
}
