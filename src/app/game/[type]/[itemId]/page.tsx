import { getArtist, getPlaylist } from "@/lib/spotify";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Game from "./game";

export default async function GamePage({ params }: { params: { type: string; itemId: string } }) {
  const { type, itemId } = params;

  if (type != "artist" && type != "playlist") return notFound();

  // const item = type === "playlist" ? await getPlaylist(itemId) : await getArtist(itemId);

  // if (!item) redirect("/game/artist");

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
