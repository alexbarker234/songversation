import { getArtist, getPlaylist } from "@/lib/spotify";
import { getStartTrackData } from "@/utils/trackDataUtils";
import { notFound, redirect } from "next/navigation";
import Game from "../../game";

export default async function GamePage({ params }: { params: { type: string; itemId: string } }) {
  const { type, itemId } = params;

  if (type != "artist" && type != "playlist") return notFound();

  const item = type === "playlist" ? await getPlaylist(itemId) : await getArtist(itemId);

  if (!item) redirect("/game/artist");

  const trackMap = await getStartTrackData(itemId, type);
  if (!trackMap) return <div>An error occurred</div>;

  return (
    <>
      <div className="my-4 text-center text-3xl">
        Which <span className="font-semibold">{item.name}</span> song is this?
      </div>
      <Game trackMap={trackMap} type="artist" id={itemId} />
    </>
  );
}
