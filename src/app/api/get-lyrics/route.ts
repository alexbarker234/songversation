import { getLyrics } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return;

    return await getLyrics(id);
}