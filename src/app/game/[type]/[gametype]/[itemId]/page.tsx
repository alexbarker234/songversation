import Game from "@/components/Game";
import { getArtist, getPlaylist } from "@/lib/spotifyService";
import { gameTypeLabel, isValidGameType, isValidSourceType } from "@/utils/gameTypes";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export default function GamePage({ params }: { params: { type: string; gametype: string; itemId: string } }) {
  const { type, gametype, itemId } = params;
  if (!isValidSourceType(type) || !isValidGameType(gametype)) return notFound();

  return <Game type={type} gameType={gametype} id={itemId} />;
}

export async function generateMetadata({
  params
}: {
  params: { type: string; gametype: string; itemId: string };
}): Promise<Metadata> {
  const item = params.type === "playlist" ? await getPlaylist(params.itemId) : await getArtist(params.itemId);
  const mode = gameTypeLabel(params.gametype as "lyric" | "audio");
  return { title: item ? `Songversation - ${mode} ${item.name}` : "Songversation" };
}
