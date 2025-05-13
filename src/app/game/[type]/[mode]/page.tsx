import { notFound } from "next/navigation";
import SearchPage from "./page-client";

export default function PlaylistSearch({ params }: { params: { type: string; mode: string } }) {
  const { type, mode } = params;
  if (type != "artist" && type != "playlist") return notFound();
  if (mode != "singleplayer" && mode != "multiplayer") return notFound();

  return <SearchPage type={type} />;
}

export async function generateMetadata({ params }: { params: { type: string } }) {
  const capitalisedType = params.type.charAt(0).toUpperCase() + params.type.slice(1);
  return { title: `Songversation - ${capitalisedType} Search` };
}
