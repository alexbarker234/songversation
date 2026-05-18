import { getPreviewsForTracks } from "@/lib/previewService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { trackIds } = await request.json();

    if (!Array.isArray(trackIds) || !trackIds.every((id) => typeof id === "string")) {
      return NextResponse.json({ error: "Invalid track IDs" }, { status: 400 });
    }

    const previewMap = await getPreviewsForTracks(trackIds);
    return NextResponse.json(previewMap);
  } catch (error) {
    console.error("Failed to fetch previews:", error);
    return NextResponse.json({ error: "Failed to fetch previews" }, { status: 500 });
  }
}
