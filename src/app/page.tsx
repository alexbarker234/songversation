"use client";
import { GameSelectMenu } from "@/components/GameSelectMenu";
import Logo from "@/components/Logo";
import RecentGames from "@/components/RecentGames";
import useOnline from "@/hooks/useOnline";
import { useStandalone } from "@/hooks/useStandalone";

export default function Home() {
  const isOnline = useOnline();
  const { isStandalone } = useStandalone();
  return (
    <div>
      {isStandalone && <Logo />}

      <GameSelectMenu isOnline={isOnline} />
      <RecentGames />
    </div>
  );
}
