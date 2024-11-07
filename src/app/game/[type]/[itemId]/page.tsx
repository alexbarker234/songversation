import { notFound } from "next/navigation";
import Game from "../../game";

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
