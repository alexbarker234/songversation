"use client";
import Logo from "@/components/Logo";
import RecentGames from "@/components/RecentGames";
import useOnline from "@/hooks/useOnline";
import { useStandalone } from "@/hooks/useStandalone";
import { cn } from "@/utils/cn";
import { GameType, getGameSearchPath, SourceType } from "@/utils/gameTypes";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowLeft, faFileLines, faHeadphones, faMicrophone, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";

const modeOptions: { mode: GameType; title: string; description: string; icon: IconDefinition }[] = [
  { mode: "lyric", title: "Lyrics", description: "Guess songs from lyric snippets", icon: faFileLines },
  { mode: "audio", title: "Audio", description: "Guess songs from a 3-second clip", icon: faHeadphones }
];

const sourceOptions: { type: SourceType; title: string; description: string; icon: IconDefinition }[] = [
  { type: "artist", title: "Artist", description: "Songs from your favourite artists", icon: faMicrophone },
  { type: "playlist", title: "Playlist", description: "Songs from a public playlist", icon: faPlay }
];

export default function Home() {
  const isOnline = useOnline();
  const { isStandalone } = useStandalone();
  const [selectedMode, setSelectedMode] = useState<GameType | null>(null);

  return (
    <div>
      {isStandalone && <Logo />}

      <div className="relative mx-auto mt-4 flex w-11/12 max-w-3xl flex-col items-center gap-4">
        {selectedMode === null ? (
          <>
            <p className="text-center text-lg text-gray-400">Choose a game mode</p>
            <div className="flex w-full flex-wrap justify-center gap-4">
              {modeOptions.map(({ mode, title, description, icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSelectedMode(mode)}
                  disabled={!isOnline}
                  className={cn(
                    "m-2 h-40 w-80 cursor-pointer rounded-xl bg-grey p-4 text-left text-white transition-colors duration-200 hover:bg-grey-dark disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <div className="mb-2 flex items-center gap-2 text-2xl">
                    <FontAwesomeIcon icon={icon} className="w-7" />
                    {title}
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
                className="flex cursor-pointer items-center gap-1 text-sm text-gray-400 underline hover:text-white"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-3" />
                Back
              </button>
              <p className="text-center text-lg text-gray-400">
                {selectedMode === "lyric" ? "Lyrics" : "Audio"} — choose a source
              </p>
            </div>
            <div className="flex w-full flex-wrap justify-center gap-4">
              {sourceOptions.map(({ type, title, description, icon }) => (
                <MenuTile
                  key={type}
                  href={getGameSearchPath(type, selectedMode)}
                  icon={icon}
                  title={title}
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
  icon,
  title,
  description,
  disabled
}: {
  href: string;
  icon: IconDefinition;
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
      <div className="mb-2 flex items-center gap-2 text-2xl">
        <FontAwesomeIcon icon={icon} className="w-6" />
        {title}
      </div>
      <div className="text-base">{description}</div>
    </Link>
  );
}
