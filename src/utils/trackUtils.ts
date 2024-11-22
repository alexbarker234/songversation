import { Track } from "@/types";

export function trackHasLyrics(track: Track) {
  return track && track.lyrics && track.lyrics.length > 0;
}
