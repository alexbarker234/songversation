import SearchPage from "@/components/SearchPage";
import { notFound } from "next/navigation";

export default function PlaylistSearch({ params }: { params: { type: string } }) {
  const { type } = params;
  if (type != "artist" && type != "playlist") return notFound();

  return <SearchPage type={type} />;
}
