"use client";

import Button from "@/components/Button";
import { useEffect, useRef, useState } from "react";

const CLIP_DURATION_MS = 3000;

interface AudioClipPlayerProps {
  previewUrl: string | undefined;
  clipKey: number;
}

export default function AudioClipPlayer({ previewUrl, clipKey }: AudioClipPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [needsPlayButton, setNeedsPlayButton] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopClip = () => {
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const playClip = async () => {
    if (!previewUrl) return;

    stopClip();
    const audio = new Audio(previewUrl);
    audioRef.current = audio;

    audio.addEventListener("ended", () => setIsPlaying(false));

    try {
      await audio.play();
      setNeedsPlayButton(false);
      setIsPlaying(true);
      stopTimeoutRef.current = setTimeout(() => {
        audio.pause();
        setIsPlaying(false);
      }, CLIP_DURATION_MS);
    } catch {
      setNeedsPlayButton(true);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (!previewUrl) return;
    void playClip();
    return () => stopClip();
  }, [previewUrl, clipKey]);

  if (!previewUrl) {
    return <p className="py-12 text-center text-gray-400">Loading preview…</p>;
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div
        className={`flex h-32 w-32 items-center justify-center rounded-full bg-grey-light transition-transform ${
          isPlaying ? "scale-110 animate-pulse" : ""
        }`}
      >
        <span className="text-5xl">{isPlaying ? "🔊" : "🎵"}</span>
      </div>

      <p className="text-sm text-gray-400">Listen to the 3-second clip</p>

      {needsPlayButton && (
        <Button variant="green" onClick={() => void playClip()} className="cursor-pointer disabled:cursor-not-allowed">
          Play clip
        </Button>
      )}

      {!needsPlayButton && !isPlaying && (
        <button
          type="button"
          onClick={() => void playClip()}
          className="cursor-pointer text-sm text-gray-400 underline hover:text-white"
        >
          Replay clip
        </button>
      )}
    </div>
  );
}
