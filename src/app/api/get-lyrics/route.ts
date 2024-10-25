import { getLyrics } from "@/lib/lyrics";
import { fetchTrackByID } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return;

    // Fetch track
    const track = await fetchTrackByID(id);
    if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

    const lyrics = await getLyrics(track.artist, track.name);
    return NextResponse.json(lyrics);
}
