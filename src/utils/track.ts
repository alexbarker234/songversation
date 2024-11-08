import { Track } from "@/types";

export function trackHasLyrics(track: Track) {
  return track.lyrics && track.lyrics.length > 0;
}
