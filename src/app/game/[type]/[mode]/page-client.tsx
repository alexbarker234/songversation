"use client";
import ItemTiles from "@/components/ItemTiles";
import Loading from "@/components/Loading";
import SearchBox from "@/components/SearchBox";
import { useSearch } from "@/hooks/query/useSearch";
import { useWindowSize } from "@/hooks/useWindowSize";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchPage({ type }: { type: "artist" | "playlist" }) {
  const [query, setQuery] = useState("");
  const [isURL, setIsURL] = useState(false);
  const pathname = usePathname();
  const { data, isLoading, isError } = useSearch({ query: query, type, disabled: isURL });

  const { width } = useWindowSize();

  useEffect(() => {
    function extractSpotifyId(url: string) {
      const match = url.match(/(artist|playlist)\/([a-zA-Z0-9]+)/);
      return match ? { type: match[1], id: match[2] } : null;
    }

    if (query.startsWith("https://open.spotify.com/")) {
      const extractedId = extractSpotifyId(query);
      setIsURL(true);
      if (extractedId) {
        const { type, id } = extractedId;
        window.location.assign(`/game/${type}/${id}`);
      }
    }
  }, [query]);

  if (!pathname) return <></>;

  const Results = () => {
    if (isError) return <div className="text-center text-6xl text-red-500">!</div>;
    if (!data && query !== "" && !isLoading) return <div className="text-center text-white">No results found</div>;
    if (isLoading) return <Loading className="my-auto" />;
    if (!data) return <></>;
    return <ItemTiles items={data} baseURL={pathname} />;
  };
  let text =
    type === "artist" ? "Search for an artist or paste a link" : "Search for a public playlist or paste a link";

  if (width > 768) text += ` (https://open.spotify.com/${type}/xxxxxxx)...`;

  return (
    <>
      <h1 className="mt-6 text-center text-3xl font-bold">{type.charAt(0).toUpperCase() + type.slice(1)} Search</h1>
      <SearchBox runSearch={setQuery} placeholder={text} />
      <Results />
    </>
  );
}
