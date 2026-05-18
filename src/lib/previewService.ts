import { getSpotifyPreviewURLs } from "@/lib/spotifyPreviewService";
import { PreviewMap } from "@/types";

export async function getPreviewsForTracks(trackIds: string[]): Promise<PreviewMap> {
  const previewMap: PreviewMap = {};

  await Promise.all(
    trackIds.map(async (id) => {
      try {
        const urls = await getSpotifyPreviewURLs(`https://open.spotify.com/track/${id}`);
        if (urls[0]) previewMap[id] = urls[0];
      } catch {
        // track has no preview
      }
    })
  );

  return previewMap;
}
