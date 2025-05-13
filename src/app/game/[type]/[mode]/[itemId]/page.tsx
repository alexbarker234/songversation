import { getArtist, getPlaylist } from "@/lib/spotifyService";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Game from "./game";

export default async function GamePage({ params }: { params: { type: string; itemId: string; mode: string } }) {
  const { type, itemId, mode } = params;

  if (type != "artist" && type != "playlist") return notFound();
  if (mode != "singleplayer" && mode != "multiplayer") return notFound();

  if (mode == "multiplayer") {
    return <>beans</>;
  }

  return (
    <>
      <Game type={type} id={itemId} />
    </>
  );
}

export async function generateMetadata({ params }: { params: { type: string; itemId: string } }): Promise<Metadata> {
  const item = params.type === "playlist" ? await getPlaylist(params.itemId) : await getArtist(params.itemId);
  return { title: item ? `Songversation - ${item.name}` : "Songversation" };
}
