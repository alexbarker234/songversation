"use client";

import React, { ChangeEvent, useEffect, useRef, useState, forwardRef, useCallback } from "react";
import styles from "./autocomplete.module.scss";
import { betterMod } from "@/lib/mathExtensions";
export interface AutocompleteState {
    isMenuOpen: boolean;
    isInputInFocus: boolean;
    searchText: string;
    keyboardOption: number;
    results: string[];
}

interface AutocompleteProps extends React.HTMLAttributes<HTMLDivElement> {
    options: string[];
    onEnterPress?: (input: string, autocompleteState: AutocompleteState) => void;
    onInputChange?: (input: string, autocompleteState: AutocompleteState) => void;
}

const Autocomplete = ({ options, onEnterPress, onInputChange, ...props }: AutocompleteProps) => {
    useEffect(() => {
        document.addEventListener("click", handleClickOutside, true);
        document.addEventListener("keydown", handleKeyboard, true);
        return () => {
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("keydown", handleKeyboard);
        };
    }, []);

    const autocompleteRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsListRef = useRef<HTMLUListElement>(null);

    const [acState, _setState] = useState<AutocompleteState>({ isMenuOpen: false, searchText: "", results: [], keyboardOption: -1, isInputInFocus: false });
    const acStateRef = useRef(acState);
    const setState = (data: AutocompleteState) => {
        acStateRef.current = data;
        _setState(data);
    };

    const punctuationRegex = /[^\w\s]/g
    // returns only 15 results
    const filterResults = (search: string) => (search.replaceAll(punctuationRegex, '') === "" ? [] : options.filter((e) => e.toLowerCase().replaceAll(punctuationRegex, '').includes(search.toLowerCase().replaceAll(punctuationRegex, '')))).slice(0,15);
    const changeState = (searchText: string, isMenuOpen: boolean) => {
        if (onInputChange) onInputChange(searchText, acStateRef.current);
        setState({
            ...acState,
            searchText,
            results: filterResults(searchText),
            isMenuOpen,
        });
    };
    // react events
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        changeState(event.target.value, true);
    };

    const handleOptionClick = (event: React.MouseEvent<HTMLElement>) => {
        const element = event.target as HTMLUListElement;
        changeState(element.innerHTML, false);
        if (inputRef.current) inputRef.current.focus();
    };

    // document event listeners - must use ref not useState
    const handleClickOutside = (event: MouseEvent) => {
        if (!autocompleteRef.current) return;
        if (autocompleteRef.current.contains(event.target as HTMLDivElement)) {
            setState({
                ...acStateRef.current,
                isMenuOpen: true,
            });
        } else {
            setState({
                ...acStateRef.current,
                isMenuOpen: false,
                keyboardOption: -1,
            });
        }
    };

    const handleKeyboard = (event: KeyboardEvent) => {
        if (isNaN(acStateRef.current.keyboardOption)) setKeyboardOption(0);
        console.log(acStateRef.current.keyboardOption);

        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            if (event.key === "ArrowUp") {
                if (acStateRef.current.keyboardOption == -1) setKeyboardOption(0);
                setKeyboardOption(betterMod(acStateRef.current.keyboardOption - 1, acStateRef.current.results.length));
            } else if (event.key === "ArrowDown") {
                setKeyboardOption(betterMod(acStateRef.current.keyboardOption + 1, acStateRef.current.results.length));
            }
            // scroll to top of selected child
            if (resultsListRef.current) {
                const selectedItem = resultsListRef.current.children[acStateRef.current.keyboardOption] as HTMLUListElement;
                resultsListRef.current.scrollTo({
                    behavior: "smooth",
                    top: selectedItem.offsetTop,
                });
            }
        } else if (event.key === "Enter") {
            event.preventDefault();
            if (acStateRef.current.keyboardOption == -1) {
                if (onEnterPress) onEnterPress(inputRef.current?.value ?? "", acStateRef.current);
            } else changeState(acStateRef.current.results[acStateRef.current.keyboardOption], false);
        }
    };
    const setKeyboardOption = (keyboardOption: number) => setState({ ...acStateRef.current, keyboardOption });

    return (
        <div {...props} className={`${styles["autocomplete"]} ${acState.isMenuOpen ? styles["focus"] : ""}`} ref={autocompleteRef}>
            <input ref={inputRef} type="text" value={acState.searchText} onChange={handleInputChange} placeholder="Search..." />
            {acState.results.length > 0 && (
                <ul className={styles["autocomplete-results"]} ref={resultsListRef}>
                    {acState.results.map((result, index) => (
                        <li key={index} onClick={handleOptionClick} className={acState.keyboardOption === index ? styles["selected"] : undefined}>
                            {result}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Autocomplete;
