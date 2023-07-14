"use client";

import React, { ChangeEvent, useEffect, useRef, useState, forwardRef } from "react";
import styles from "./autocomplete.module.scss";

export interface Option {
    id: string;
    name: string;
}

interface AutocompleteProps extends React.HTMLAttributes<HTMLDivElement> {
    options: Option[];
  }

const Autocomplete = React.forwardRef<HTMLInputElement, AutocompleteProps>(({options, ...props}, inputRef) => {
    useEffect(() => {   
        document.addEventListener("click", handleClickOutside, true);
    }, []);

    const autocompleteRef = useRef<HTMLDivElement>(null);
    const inputRefLocal = useRef<HTMLInputElement>(null);

    const [searchText, setSearchText] = useState("");
    const [results, setResults] = useState<Option[]>([]);
    const [focus, setFocus] = useState(false);
    const [keyboardOption, setkeyboardOption] = useState(-1);

    const filterResults = (search: string) => search === '' ? [] : options.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchText(value);
        setResults(filterResults(value));
        setFocus(true);
    };

    const handleOptionClick = (event: React.MouseEvent<HTMLElement>) => {
        const element = event.target as HTMLUListElement;
        setSearchText(element.innerHTML);
        setResults(filterResults(element.innerHTML));
        setFocus(false);

        if (inputRefLocal.current) inputRefLocal.current.focus()
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (!autocompleteRef.current) return;
        setFocus(autocompleteRef.current.contains(event.target as HTMLDivElement));
    };

    return (
        <div {...props} className={`${styles["autocomplete"]} ${focus ? styles["focus"] : ""}`} ref={autocompleteRef}>
            <input ref={inputRef} type="text" value={searchText} onChange={handleInputChange} placeholder="Search..." />
            {results.length > 0 && (
                <ul className={styles["autocomplete-results"]}>
                    {results.map((result, index) => (
                        <li key={index} onClick={handleOptionClick}>
                            {result.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
});
Autocomplete.displayName ='Autocomplete'

export default Autocomplete;
