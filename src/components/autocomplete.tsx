"use client";

import { betterMod } from "@/lib/mathExtensions";
import { cn } from "@/utils/cn";
import React, { ChangeEvent, forwardRef, KeyboardEvent, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface AutocompleteInput {
  id: string;
  label: string;
}

export interface AutocompleteState {
  isMenuOpen: boolean;
  isInputInFocus: boolean;
  searchText: string;
  keyboardOption: number;
  results: AutocompleteInput[];
}

export const useAutocompleteState = (
  options: AutocompleteInput[],
  onInputChange?: (input: string, autocompleteState: AutocompleteState) => void
) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInputInFocus, setIsInputInFocus] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [keyboardOption, setKeyboardOption] = useState(-1);
  const [results, setResults] = useState<AutocompleteInput[]>([]);
  const acStateRef = useRef({ isMenuOpen, isInputInFocus, searchText, keyboardOption, results });

  const punctuationRegex = /[^\w\s]/g;

  const filterResults = (search: string) =>
    (search.replaceAll(punctuationRegex, "") === ""
      ? []
      : options.filter((e) =>
          e.label
            .toLowerCase()
            .replaceAll(punctuationRegex, "")
            .includes(search.toLowerCase().replaceAll(punctuationRegex, ""))
        )
    ).slice(0, 15);

  const changeState = (newSearchText: string, openMenu: boolean) => {
    setSearchText(newSearchText);
    setIsMenuOpen(openMenu);
    setResults(filterResults(newSearchText));
    if (onInputChange) onInputChange(newSearchText, acStateRef.current);
  };

  useEffect(() => {
    acStateRef.current = { isMenuOpen, isInputInFocus, searchText, keyboardOption, results };
  }, [isMenuOpen, isInputInFocus, searchText, keyboardOption, results]);

  return {
    acStateRef,
    isMenuOpen,
    setIsMenuOpen,
    isInputInFocus,
    setIsInputInFocus,
    searchText,
    setSearchText: changeState,
    keyboardOption,
    setKeyboardOption,
    results
  };
};

export type AutocompleteRef = {
  clearInput: () => void;
  getSearchText: () => string;
  getIsUsingEnterKey: () => boolean;
} | null;

interface AutocompleteProps extends React.HTMLAttributes<HTMLDivElement> {
  options: AutocompleteInput[];
  onInputChange?: (input: string, autocompleteState: AutocompleteState) => void;
}

const Autocomplete = forwardRef<AutocompleteRef, AutocompleteProps>(({ options, onInputChange, ...props }, ref) => {
  const {
    acStateRef,
    isMenuOpen,
    setIsMenuOpen,
    searchText,
    setSearchText,
    keyboardOption,
    setKeyboardOption,
    results
  } = useAutocompleteState(options, onInputChange);

  const acRefInternal = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsListRef = useRef<HTMLUListElement>(null);
  const isUsingEnterKey = useRef(false);
  const isUsingEnterKeyTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value, true);
  };

  const handleOptionClick = (event: React.MouseEvent<HTMLElement>) => {
    const element = event.target as HTMLUListElement;
    const selectedOption = results.find((option) => option.label === element.innerHTML);
    if (selectedOption) {
      setSearchText(selectedOption.label, false);
    }
    if (inputRef.current) inputRef.current.focus();
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (!acRefInternal.current) return;
    if (acRefInternal.current.contains(event.target as HTMLDivElement)) {
      setIsMenuOpen(true);
    } else {
      setIsMenuOpen(false);
      setKeyboardOption(-1);
    }
  };

  const handleKeyboard = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isNaN(keyboardOption)) setKeyboardOption(0);

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const newOption = event.key === "ArrowUp" ? keyboardOption - 1 : keyboardOption + 1;
      setKeyboardOption(betterMod(newOption, results.length));

      if (resultsListRef.current) {
        const selectedItem = resultsListRef.current.children[keyboardOption] as HTMLUListElement;
        resultsListRef.current.scrollTo({
          behavior: "smooth",
          top: selectedItem.offsetTop
        });
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (keyboardOption != -1) {
        const selectedOption = results[keyboardOption];
        setSearchText(selectedOption.label, false);
        isUsingEnterKey.current = true;
        if (isUsingEnterKeyTimeout.current) clearTimeout(isUsingEnterKeyTimeout.current);
        isUsingEnterKeyTimeout.current = setTimeout(() => (isUsingEnterKey.current = false), 100);
        setKeyboardOption(-1);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    clearInput: () => {
      setSearchText("", false);
    },
    getSearchText: () => acStateRef.current.searchText,
    getIsUsingEnterKey: () => isUsingEnterKey.current
  }));

  return (
    <div ref={acRefInternal} {...props} className={`relative ${isMenuOpen ? "focus" : ""}`}>
      <input
        ref={inputRef}
        type="text"
        value={searchText}
        onChange={handleInputChange}
        onKeyDown={handleKeyboard}
        placeholder="Search..."
        className="h-full w-full bg-grey-light p-3 text-white outline-none"
      />
      {results.length > 0 && (
        <ul
          className={`absolute bottom-full left-0 z-10 max-h-80 w-full list-none overflow-y-scroll bg-grey-light ${isMenuOpen ? "block" : "hidden"}`}
          ref={resultsListRef}
        >
          {results.map((result, index) => (
            <li
              key={result.id}
              onClick={handleOptionClick}
              className={cn("flex cursor-pointer items-center px-4 py-2", {
                "border border-primary": keyboardOption === index,
                "hover:bg-grey": keyboardOption !== index
              })}
            >
              <div>{result.label}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

Autocomplete.displayName = "Autocomplete";

export default Autocomplete;
