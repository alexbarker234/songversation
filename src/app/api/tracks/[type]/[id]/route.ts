import { getArtistSongs, getPlaylistTracks } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { type: string; id: string } }) {
  try {
    const { type, id } = params;

    if (type != "artist" && type != "playlist") return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    const trackList = type === "playlist" ? await getPlaylistTracks(id) : await getArtistSongs(id);

    return NextResponse.json(trackList);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
