import { getLyrics, getMultipleLyrics } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");
    if (!ids) return;

    const idList = ids.split(',')

    return NextResponse.json(await getMultipleLyrics(idList));
}