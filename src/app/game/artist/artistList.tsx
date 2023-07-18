"use client"
import { useState } from "react";
import ArtistSearch from "./artistSearch";
import ItemTiles from "./itemTiles";

export default function ArtistList({ params }: any) {
    const [artistList, setArtistList] = useState<Artist[]>([])
    const [isLoading, setLoading] = useState(false)
    const onSearchResults = (artists: Artist[]) => {setArtistList(artists); setLoading(false)}
    const onSearch = () => setLoading(true)

    return (
        <>
            <ArtistSearch onSearchResults={onSearchResults} onSearching={onSearch}/>
            <ItemTiles items={artistList} isLoading={isLoading}></ItemTiles>
        </>
    );
}
