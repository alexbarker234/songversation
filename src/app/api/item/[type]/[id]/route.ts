import { getArtist, getPlaylist } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { type: string; id: string } }) {
  const { type, id } = params;

  if (type != "artist" && type != "playlist") return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const trackList = type === "playlist" ? await getPlaylist(id) : await getArtist(id);

  return NextResponse.json(trackList);
}
