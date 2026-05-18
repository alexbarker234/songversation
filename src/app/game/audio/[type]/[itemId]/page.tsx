import { getArtist, getPlaylist } from "@/lib/spotifyService";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import AudioGame from "./game";

export default async function AudioGamePage({ params }: { params: { type: string; itemId: string } }) {
  const { type, itemId } = params;

  if (type != "artist" && type != "playlist") return notFound();

  return <AudioGame type={type} id={itemId} />;
}

export async function generateMetadata({ params }: { params: { type: string; itemId: string } }): Promise<Metadata> {
  const item = params.type === "playlist" ? await getPlaylist(params.itemId) : await getArtist(params.itemId);
  return { title: item ? `Songversation - Audio ${item.name}` : "Songversation" };
}
