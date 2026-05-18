import GameSearchPage from "@/components/GameSearchPage";
import { gameTypeLabel, isValidGameType, isValidSourceType } from "@/utils/gameTypes";
import { notFound } from "next/navigation";

export default function GameSearch({ params }: { params: { type: string; gametype: string } }) {
  const { type, gametype } = params;
  if (!isValidSourceType(type) || !isValidGameType(gametype)) return notFound();

  return <GameSearchPage type={type} gameType={gametype} />;
}

export async function generateMetadata({ params }: { params: { type: string; gametype: string } }) {
  const capitalisedType = params.type.charAt(0).toUpperCase() + params.type.slice(1);
  return { title: `Songversation - ${gameTypeLabel(params.gametype as "lyric" | "audio")} ${capitalisedType} Search` };
}
