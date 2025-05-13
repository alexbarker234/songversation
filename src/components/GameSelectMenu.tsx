import { cn } from "@/utils/cn";
import Link from "next/link";
import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";

interface GameMenuProps {
  isOnline: boolean;
}

export function GameSelectMenu({ isOnline }: GameMenuProps) {
  const [gameMode, setGameMode] = useState<"select" | "singleplayer" | "multiplayer">("select");

  return (
    <div className="mt-4">
      {gameMode === "select" && (
        <>
          <h1 className="text-center text-2xl font-bold">Select Game Mode</h1>
          <div className="relative mx-auto mt-4 flex w-11/12 max-w-5xl flex-wrap justify-center">
            <MenuTile
              onClick={() => setGameMode("singleplayer")}
              title="🎮 Single Player"
              description="Play the game by yourself!"
            />
            <MenuTile
              onClick={() => setGameMode("multiplayer")}
              title="👥 Multiplayer"
              description="Play with friends!"
              disabled={!isOnline}
            />
          </div>
        </>
      )}

      {(gameMode === "singleplayer" || gameMode === "multiplayer") && (
        <>
          <h1 className="text-center text-2xl font-bold">
            {gameMode === "singleplayer" ? "Singleplayer" : "Multiplayer"}
          </h1>
          <div className="relative mx-auto mt-4 flex w-11/12 max-w-5xl flex-wrap justify-center">
            <MenuTile
              href={`/game/artist/${gameMode}`}
              title="🎤 Artist Quiz"
              description="Guess songs from your favourite artists!"
              disabled={!isOnline}
            />
            <MenuTile
              href={`/game/playlist/${gameMode}`}
              title="▶️ Playlist Quiz"
              description="Guess songs from a public playlist!"
              disabled={!isOnline}
            />
          </div>
        </>
      )}

      <div className="mb-4 flex h-10 w-full justify-center">
        {(gameMode === "singleplayer" || gameMode === "multiplayer") && (
          <button
            onClick={() => setGameMode("select")}
            className="flex items-center rounded-lg bg-grey px-4 py-2 text-white transition-colors hover:bg-grey-dark"
          >
            <FaArrowLeft className="mr-2" />
            <div>Back</div>
          </button>
        )}
      </div>
    </div>
  );
}

function MenuTile({
  href,
  title,
  description,
  disabled,
  onClick
}: {
  href?: string;
  title: string;
  description: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="mb-2 text-2xl">{title}</div>
      <div className="text-base">{description}</div>
    </>
  );

  const className = cn(
    "m-2 flex h-40 w-80 flex-col items-start rounded-xl bg-grey p-4 text-left text-white transition-colors duration-200 hover:bg-grey-dark",
    {
      "pointer-events-none opacity-50": disabled
    }
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={className} disabled={disabled}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href || "#"} className={className}>
      {content}
    </Link>
  );
}
