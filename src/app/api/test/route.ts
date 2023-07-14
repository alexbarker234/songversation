import { getTopTracks } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const response = await getTopTracks();
    const { items } = await response.json();

    const tracks: Track[] = items.slice(0, 10).map((track: any) => ({
        artist: track.artists.map((_artist: any) => _artist.name).join(", "),
        songUrl: track.external_urls.spotify,
        title: track.name,
        id: track.id,
    }));

    return NextResponse.json(tracks);
}
