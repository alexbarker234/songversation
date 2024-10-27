import { getArtist } from "@/lib/spotify";
import { getTrackData } from "@/utils/trackDataUtils";
import { redirect } from "next/navigation";
import Game from "../../game";

export default async function ArtistGame({ params }: { params: { artistID: string } }) {
  const { artistID } = params;

  const item = await getArtist(artistID);
  if (!item) redirect("/game/artist");

  const trackMap = await getTrackData(artistID, "artist");
  if (!trackMap) return <div>An error occurred</div>;

  return (
    <>
      <div className="my-4 text-center text-3xl">
        Which <span className="font-semibold">{item.name}</span> song is this?
      </div>
      <Game trackMap={trackMap} type="artist" id={artistID} />
    </>
  );
}
