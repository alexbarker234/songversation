import { getPlaylist } from "@/lib/spotify";
import { getStartTrackData } from "@/utils/trackDataUtils";
import { redirect } from "next/navigation";
import Game from "../../game";

export default async function PlaylistGame({ params }: { params: { playlistID: string } }) {
  const { playlistID } = params;

  const item = await getPlaylist(playlistID);
  if (!item) redirect("/game/playlist");

  const data = await getStartTrackData(playlistID, "playlist");
  if (!data) return <div>An error occurred</div>;

  const { trackMap, remainingTrackIds } = data;

  return (
    <>
      <div className="my-4 text-center text-3xl">
        Which <span className="font-semibold">{item.name}</span> song is this?
      </div>
      <Game trackMap={trackMap} type="playlist" id={playlistID} />
    </>
  );
}
