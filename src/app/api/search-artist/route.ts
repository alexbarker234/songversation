import { searchArtist } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get("search");
    if (!searchTerm) return NextResponse.json({ error: "error" }, { status: 400 });

    const searchResults = await searchArtist(searchTerm);
    if (!searchResults) return NextResponse.json({ error: "error" }, { status: 500 });
    return NextResponse.json(searchResults);
}
