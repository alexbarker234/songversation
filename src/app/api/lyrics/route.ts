import { getMultipleLyrics } from "@/lib/lyrics";
import { NextResponse } from "next/server";

function isValidTrackDataList(trackDataList: any): trackDataList is TrackInfo[] {
  return (
    Array.isArray(trackDataList) &&
    trackDataList.every(
      (track) =>
        typeof track === "object" &&
        typeof track.artist === "string" &&
        typeof track.title === "string" &&
        typeof track.id === "string"
    )
  );
}

export async function POST(request: Request) {
  try {
    const { trackDataList } = await request.json();

    if (!Array.isArray(trackDataList) || !isValidTrackDataList(trackDataList)) {
      return NextResponse.json({ error: "Invalid track data list format" }, { status: 400 });
    }

    const lyricMap = await getMultipleLyrics(trackDataList);

    return NextResponse.json(lyricMap);
  } catch (error) {
    console.error("Failed to fetch lyrics:", error);
    return NextResponse.json({ error: "Failed to fetch lyrics" }, { status: 500 });
  }
}
