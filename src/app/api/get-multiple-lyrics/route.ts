import { getMultipleLyrics } from "@/lib/lyrics";
import { fetchTracksByIDs } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");
    if (!ids) return;

    const idList = ids.split(",");

    const tracks = await fetchTracksByIDs(idList);
    if (!tracks) return NextResponse.json({ error: "Error fetching tracks" }, { status: 500 });

    const trackDataList = tracks.map((track) => ({
        artist: track.artist,
        title: track.name,
        id: track.id
    }));

    const lyrics = await getMultipleLyrics(trackDataList);

    return NextResponse.json(lyrics);
}
