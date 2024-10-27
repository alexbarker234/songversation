import { searchSpotify } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const searchTerm = searchParams.get("query");
  if (!searchTerm) return NextResponse.json({ error: "No search term provided" }, { status: 400 });

  const type = searchParams.get("type");
  if (!type || (type != "artist" && type != "playlist"))
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const searchResults = await searchSpotify(searchTerm, type);
  if (!searchResults) return NextResponse.json({ error: "error" }, { status: 500 });

  return NextResponse.json(searchResults);
}
