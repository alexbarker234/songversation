import { getArtist, getArtistSongs, getPlaylist, getPlaylistTracks } from "@/lib/spotify";
import { DetailedSpotifyItem } from "@/types";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { type: string; id: string } }) {
  const { type, id } = params;

  if (type != "artist" && type != "playlist") return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const item = type === "playlist" ? await getPlaylist(id) : await getArtist(id);
  if (!item) return NextResponse.json({ error: `No ${type} found with id ${id}` }, { status: 404 });

  const tracks = type === "playlist" ? await getPlaylistTracks(id) : await getArtistSongs(id);
  if (tracks === undefined) return NextResponse.json({ error: `No tracks found for ${type} ${id}` }, { status: 404 });

  const response: DetailedSpotifyItem = {
    id: item.id,
    name: item.name,
    imageURL: item.imageURL,
    tracks: tracks
  };

  return NextResponse.json(response);
}
