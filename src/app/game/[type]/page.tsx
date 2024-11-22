import { notFound } from "next/navigation";
import SearchPage from "./page-client";

export default function PlaylistSearch({ params }: { params: { type: string } }) {
  const { type } = params;
  if (type != "artist" && type != "playlist") return notFound();

  return <SearchPage type={type} />;
}

export async function generateMetadata({ params }: { params: { type: string } }) {
  const capitalisedType = params.type.charAt(0).toUpperCase() + params.type.slice(1);
  return { title: `Songversation - ${capitalisedType} Search` };
}
