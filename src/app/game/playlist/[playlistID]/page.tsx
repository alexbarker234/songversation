import { getPlaylist } from "@/lib/spotify";
import { getTrackData } from "@/utils/trackDataUtils";
import { redirect } from "next/navigation";
import Game from "../../game";

export default async function PlaylistGame({ params }: { params: { playlistID: string } }) {
  const { playlistID } = params;

  const item = await getPlaylist(playlistID);
  if (!item) redirect("/game/playlist");

  const trackMap = await getTrackData(playlistID, "playlist");
  if (!trackMap) return <div>An error occurred</div>;

  return (
    <>
      <div className="my-4 text-center text-3xl">
        Which <span className="font-semibold">{item.name}</span> song is this?
      </div>
      <Game trackMap={trackMap} type="playlist" id={playlistID} />
    </>
  );
}
