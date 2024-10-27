"use client";
import SearchBox from "@/components/searchBox";
import { useState } from "react";
import ItemTiles from "./itemTiles";

export default function GameArtistHome({ params }: any) {
  const [artistList, setArtistList] = useState<Artist[]>([]);
  const [searchState, setState] = useState<"ok" | "searching" | "error">("ok");

  const search = async (searchText: string) => {
    if (searchState == "searching") return;
    setState("searching");

    const response = await fetch(`/api/artist/search?search=${searchText}`);
    if (!response.ok) {
      setState("error");
      return;
    }

    const data = await response.json();

    setArtistList(data);
    setState("ok");
  };

  return (
    <>
      <SearchBox runSearch={search} placeholder="Search for an artist..." />
      {searchState === "error" ? (
        <div className="text-center text-6xl text-red-500">!</div>
      ) : (
        <ItemTiles items={artistList} isLoading={searchState === "searching"}></ItemTiles>
      )}
    </>
  );
}
