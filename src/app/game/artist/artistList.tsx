"use client";
import { useState } from "react";
import ItemTiles from "./itemTiles";
import SearchBox from "@/components/searchBox";
import styles from "./page.module.scss";

export default function ArtistList() {
    const [artistList, setArtistList] = useState<Artist[]>([]);
    const [searchState, setState] = useState<"ok" | "searching" | "error">("ok");

    const search = async (searchText: string) => {
        if (searchState == "searching") return;
        setState("searching");

        const response = await fetch(`/api/search-artist?search=${searchText}`);
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
            <SearchBox runSearch={search} />
            {searchState === "error" ? (
                <div className={styles["error"]}>!</div>
            ) : (
                <ItemTiles items={artistList} isLoading={searchState === "searching"}></ItemTiles>
            )}
        </>
    );
}
