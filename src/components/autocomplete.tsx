"use client";

import React, { ChangeEvent, KeyboardEvent, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import styles from "./autocomplete.module.scss";
import { betterMod } from "@/lib/mathExtensions";
export interface AutocompleteState {
    isMenuOpen: boolean;
    isInputInFocus: boolean;
    searchText: string;
    keyboardOption: number;
    results: string[];
}

export type AutocompleteRef = {
    clearInput: () => void;
    getSearchText: () => string;
    getIsUsingEnterKey: () => boolean;
} | null;

interface AutocompleteProps extends React.HTMLAttributes<HTMLDivElement> {
    options: string[];
    onInputChange?: (input: string, autocompleteState: AutocompleteState) => void;
}

const Autocomplete = forwardRef<AutocompleteRef, AutocompleteProps>(({ options, onInputChange, ...props }, ref) => {
    useEffect(() => {
        document.addEventListener("click", handleClickOutside, true);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    const acRefInternal = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsListRef = useRef<HTMLUListElement>(null);
    const isUsingEnterKey = useRef(false);
    const isUsingEnterKeyTimeout = useRef<NodeJS.Timeout | null>(null);

    const [acState, _setState] = useState<AutocompleteState>({ isMenuOpen: false, searchText: "", results: [], keyboardOption: -1, isInputInFocus: false });
    const acStateRef = useRef(acState);
    const setState = (data: AutocompleteState) => {
        acStateRef.current = data;
        _setState(data);
    };

    const punctuationRegex = /[^\w\s]/g;
    // returns only 15 results
    const filterResults = (search: string) =>
        (search.replaceAll(punctuationRegex, "") === ""
            ? []
            : options.filter((e) => e.toLowerCase().replaceAll(punctuationRegex, "").includes(search.toLowerCase().replaceAll(punctuationRegex, "")))
        ).slice(0, 15);

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
        if (!acRefInternal.current) return;
        if (acRefInternal.current.contains(event.target as HTMLDivElement)) {
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

    const handleKeyboard = (event: KeyboardEvent<HTMLInputElement>) => {
        if (isNaN(acStateRef.current.keyboardOption)) setKeyboardOption(0);

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
            if (acStateRef.current.keyboardOption != -1) {
                changeState(acStateRef.current.results[acStateRef.current.keyboardOption], false);
                // manage enter key holding
                isUsingEnterKey.current = true;
                if (isUsingEnterKeyTimeout.current) clearTimeout(isUsingEnterKeyTimeout.current);
                isUsingEnterKeyTimeout.current = setTimeout(() => (isUsingEnterKey.current = false), 100);
                // reset keyboard controls
                acStateRef.current.keyboardOption = -1;
            }
        }
        if (acStateRef.current.keyboardOption != -1) {
            isUsingEnterKey.current = true;
        }
    };
    const setKeyboardOption = (keyboardOption: number) => setState({ ...acStateRef.current, keyboardOption });

    // functions that can be called via creating a ref to this component
    useImperativeHandle(ref, () => ({
        clearInput: () => {
            changeState("", false);
        },
        getSearchText: () => acStateRef.current?.searchText,
        getIsUsingEnterKey: () => isUsingEnterKey.current,
    }));

    return (
        <div ref={acRefInternal} {...props} className={`${styles["autocomplete"]} ${acState.isMenuOpen ? styles["focus"] : ""}`}>
            <input ref={inputRef} type="text" value={acState.searchText} onChange={handleInputChange} onKeyDown={handleKeyboard} placeholder="Search..." />
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
});
Autocomplete.displayName = "Autocompletez";

export default Autocomplete;
