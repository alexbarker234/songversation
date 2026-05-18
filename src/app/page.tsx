"use client";
import Logo from "@/components/Logo";
import RecentGames from "@/components/RecentGames";
import useOnline from "@/hooks/useOnline";
import { useStandalone } from "@/hooks/useStandalone";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { useState } from "react";

type GameMode = "lyrics" | "audio";
type SourceType = "artist" | "playlist";

const modeOptions: { mode: GameMode; title: string; description: string; emoji: string }[] = [
  { mode: "lyrics", title: "Lyrics", description: "Guess songs from lyric snippets", emoji: "📝" },
  { mode: "audio", title: "Audio", description: "Guess songs from a 3-second clip", emoji: "🎧" }
];

const sourceOptions: { type: SourceType; title: string; description: string; emoji: string }[] = [
  { type: "artist", title: "Artist", description: "Songs from your favourite artists", emoji: "🎤" },
  { type: "playlist", title: "Playlist", description: "Songs from a public playlist", emoji: "▶️" }
];

function getGameHref(mode: GameMode, type: SourceType) {
  return mode === "audio" ? `/game/audio/${type}` : `/game/${type}`;
}

export default function Home() {
  const isOnline = useOnline();
  const { isStandalone } = useStandalone();
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  return (
    <div>
      {isStandalone && <Logo />}

      <div className="relative mx-auto mt-4 flex w-11/12 max-w-3xl flex-col items-center gap-4">
        {selectedMode === null ? (
          <>
            <p className="text-center text-lg text-gray-400">Choose a game mode</p>
            <div className="flex w-full flex-wrap justify-center gap-4">
              {modeOptions.map(({ mode, title, description, emoji }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSelectedMode(mode)}
                  disabled={!isOnline}
                  className={cn(
                    "m-2 h-40 w-80 cursor-pointer rounded-xl bg-grey p-4 text-left text-white transition-colors duration-200 hover:bg-grey-dark disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <div className="mb-2 text-2xl">
                    {emoji} {title}
                  </div>
                  <div className="text-base">{description}</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex w-full items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setSelectedMode(null)}
                className="cursor-pointer text-sm text-gray-400 underline hover:text-white"
              >
                ← Back
              </button>
              <p className="text-center text-lg text-gray-400">
                {selectedMode === "lyrics" ? "Lyrics" : "Audio"} — choose a source
              </p>
            </div>
            <div className="flex w-full flex-wrap justify-center gap-4">
              {sourceOptions.map(({ type, title, description, emoji }) => (
                <MenuTile
                  key={type}
                  href={getGameHref(selectedMode, type)}
                  title={`${emoji} ${title}`}
                  description={description}
                  disabled={!isOnline}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <RecentGames />
    </div>
  );
}

function MenuTile({
  href,
  title,
  description,
  disabled
}: {
  href: string;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "m-2 h-40 w-80 cursor-pointer rounded-xl bg-grey p-4 text-white transition-colors duration-200 hover:bg-grey-dark",
        {
          "pointer-events-none cursor-not-allowed opacity-50": disabled
        }
      )}
    >
      <div className="mb-2 text-2xl">{title}</div>
      <div className="text-base">{description}</div>
    </Link>
  );
}
