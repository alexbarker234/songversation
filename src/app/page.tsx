"use client";
import Logo from "@/components/Logo";
import RecentGames from "@/components/RecentGames";
import useOnline from "@/hooks/useOnline";
import { useStandalone } from "@/hooks/useStandalone";
import { cn } from "@/utils/cn";
import Link from "next/link";

export default function Home() {
  const isOnline = useOnline();
  const { isStandalone } = useStandalone();
  return (
    <div>
      {isStandalone && <Logo />}

      <div className="relative mx-auto mt-4 flex w-11/12 max-w-5xl flex-wrap justify-center">
        <MenuTile
          href="/game/artist"
          title="🎤 Artist Quiz"
          description="Guess songs from your favourite artists!"
          disabled={!isOnline}
        />
        <MenuTile
          href="/game/playlist"
          title="▶️ Playlist Quiz"
          description="Guess songs from a public playlist!"
          disabled={!isOnline}
        />
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
        "m-2 h-40 w-80 rounded-xl bg-grey p-4 text-white transition-colors duration-200 hover:bg-grey-dark",
        {
          "pointer-events-none opacity-50": disabled
        }
      )}
    >
      <div className="mb-2 text-2xl">{title}</div>
      <div className="text-base">{description}</div>
    </Link>
  );
}
