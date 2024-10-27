import { getMultipleLyrics } from "@/lib/lyrics";
import { getArtist, getArtistSongs } from "@/lib/spotify";
import { redirect } from "next/navigation";
import Game from "../../game";

export default async function Home({ params }: { params: { artistID: string } }) {
  const { artistID } = params;

  //const artistInfo:
  const artist = await getArtist(artistID);
  if (!artist) redirect("/game/artist");

  const trackList = await getArtistSongs(artistID);

  let trackMap: TrackMap = trackList.reduce((map, track) => {
    map[track.id] = track;
    return map;
  }, {} as TrackMap);

  const trackDataList = trackList.map((track) => ({
    artist: track.artist,
    title: track.name,
    id: track.id
  }));

  const lyricMap: LyricMap = await getMultipleLyrics(trackDataList);

  // add lyrics to trackmap
  Object.entries(lyricMap).forEach(
    ([trackID, lyrics]) => (trackMap[trackID].lyrics = lyrics.length > 0 ? lyrics : undefined)
  );
  // Filter the object to only include keys with non-zero length lyrics array
  trackMap = Object.fromEntries(
    Object.entries(trackMap).filter(([key, value]) => value.lyrics && value.lyrics.length > 0)
  );

  //console.log(trackMap)

  return (
    <>
      {/* <div>{JSON.stringify(data)}</div> */}
      <div className="my-4 text-center text-3xl">
        Which <span className="font-semibold">{artist.name}</span> song is this?
      </div>
      <Game trackMap={trackMap} type="artist" id={artistID}></Game>
    </>
  );
}
