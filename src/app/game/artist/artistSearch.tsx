"use client";

import { ChangeEvent, useEffect, useState } from "react";
import styles from "./artistSearch.module.scss";

export default function ArtistSearch({ onSearchResults, onSearching }: { onSearchResults: (artists: Artist[]) => void, onSearching?: () => void }) {
    const [searchText, setSearchText] = useState("");
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchText(event.target.value);

        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        setTypingTimeout(
            setTimeout(() => {
                search()
            }, 500) 
        );
    };

    const search = async () => {
        if (searchText.replaceAll(' ', '').length < 3) return;
        if (onSearching) onSearching()
        const response = await fetch(`/api/search-artist?search=${searchText}`);
        if (!response.ok) return;
        const data = await response.json();
        console.log(data);
        onSearchResults(data);
    };

    useEffect(() => {
        return () => {
           if (typingTimeout) clearTimeout(typingTimeout);
        };
    }, [typingTimeout]);

    return (
        <div className={styles["artist-search"]}>
            <input type="text" value={searchText} onChange={handleInputChange} placeholder="Search..." />
        </div>
    );
}
