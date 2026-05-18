import { TrackMap } from "@/types";
import { cn } from "@/utils/cn";
import { trackHasLyrics, trackHasPreview } from "@/utils/trackUtils";
import { useState } from "react";
import { FaCaretLeft, FaCaretRight } from "react-icons/fa";

function DebugTrackList({
  trackOrder,
  trackMap,
  currentTrackIndex,
  mode = "lyrics"
}: {
  trackOrder: string[];
  trackMap: TrackMap;
  currentTrackIndex: number;
  mode?: "lyrics" | "audio";
}) {
  const [isMinimized, setIsMinimized] = useState(true);

  // Only render in development mode
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div
      className={`fixed right-0 top-0 flex h-full w-64 transform flex-col bg-gray-800 p-4 text-white transition-transform duration-300 ease-in-out ${
        isMinimized ? "translate-x-full" : "translate-x-0"
      }`}
    >
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        className="absolute right-full top-12 rounded-l-md bg-gray-800 p-2 px-1 font-bold text-white"
      >
        {isMinimized ? <FaCaretLeft /> : <FaCaretRight />}
      </button>

      <h2 className="mb-4 text-lg font-semibold">Track Debug List</h2>
      <div className="mb-8 flex flex-col gap-2 overflow-y-auto">
        {trackOrder.map((trackID, index) => {
          const track = trackMap[trackID];
          if (!track) return null;
          return (
            <div
              key={track.id}
              className={cn("flex flex-col rounded-md border-2 p-2", {
                "border-green-500":
                  mode === "audio"
                    ? track.hasFetchedPreview && trackHasPreview(track)
                    : track.hasFetchedLyrics && trackHasLyrics(track),
                "border-red-500":
                  mode === "audio"
                    ? track.hasFetchedPreview && !trackHasPreview(track)
                    : track.hasFetchedLyrics && !trackHasLyrics(track),
                "border-yellow-500": mode === "audio" ? !track.hasFetchedPreview : !track.hasFetchedLyrics,
                "border-blue-500":
                  mode === "audio"
                    ? trackHasPreview(track) && !track.hasFetchedPreview
                    : trackHasLyrics(track) && !track.hasFetchedLyrics,
                "bg-primary font-bold": index === currentTrackIndex
              })}
            >
              <p className="font-semibold">{track.artist}</p>
              <p>{track.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DebugTrackList;
