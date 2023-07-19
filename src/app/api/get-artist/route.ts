import { getArtist } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return;

    const artist = await getArtist(id)
    if (!artist) return NextResponse.json({ error: "error" }, { status: 500 });

    return NextResponse.json(artist);
}