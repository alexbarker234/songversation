"use client";
import SearchBox from "@/components/searchBox";
import { useSearch } from "@/hooks/search";
import { useEffect, useState } from "react";
import ItemTiles from "./ItemTiles";

export default function SearchPage({ type }: { type: "artist" | "playlist" }) {
  const [query, setQuery] = useState("");
  const [isURL, setIsURL] = useState(false);
  const { data, isLoading, isError } = useSearch({ query: query, type, disabled: isURL });

  useEffect(() => {
    function extractSpotifyId(url: string) {
      const match = url.match(/(artist|playlist)\/([a-zA-Z0-9]+)/);
      return match ? { type: match[1], id: match[2] } : null;
    }

    if (query.startsWith("https://open.spotify.com/")) {
      const extractedData = extractSpotifyId(query);
      setIsURL(true);
      if (extractedData) {
        const { type, id } = extractedData;
        window.location.assign(`/game/${type}/${id}`);
      }
    }
  }, [query]);

  const Results = () => {
    if (!data && query !== "") return <div className="text-center text-white">No results found</div>;
    if (isError) return <div className="text-center text-6xl text-red-500">!</div>;
    if (!data) return <></>;
    return <ItemTiles items={data} isLoading={isLoading} />;
  };
  const text =
    type === "artist"
      ? "Search for an artist or paste a link (https://open.spotify.com/artist/xxxxxxx)..."
      : "Search for a public playlist or paste a link (https://open.spotify.com/playlist/xxxxxxx)...";
  return (
    <>
      <SearchBox runSearch={setQuery} placeholder={text} />
      <Results />
    </>
  );
}
