"use client";
import { useClickOutside } from "@/hooks/clickOutside";
import { cn } from "@/utils/cn";
import { useEffect, useRef, useState } from "react";

export type AutocompleteOption = {
  id: string;
  label: string;
};

type AutocompleteProps = {
  options: AutocompleteOption[];
  selected: AutocompleteOption | null;
  className?: string;
  setSelected: (option: AutocompleteOption | null) => void;
};

export default function Autocomplete({ options, selected, className, setSelected }: AutocompleteProps) {
  // State
  const [searchText, setSearchText] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [keyboardOption, setKeyboardOption] = useState(-1);
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsListRef = useRef<HTMLUListElement>(null);

  const handleBlur = () => {
    if (searchText === "") {
      setSelected(null);
    }
    setIsMenuOpen(false);
    setSearchText(selected?.label ?? "");
  };

  // Close when clicking off
  useClickOutside([inputRef, resultsListRef], handleBlur, isMenuOpen);

  useEffect(() => {
    setFilteredOptions(options.filter((option) => option.label.toLowerCase().includes(searchText.toLowerCase())));
  }, [searchText, options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setIsMenuOpen(true);
    setKeyboardOption(-1);
  };

  const handleKeyboard = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isMenuOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsMenuOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      setKeyboardOption((prevOption) => (prevOption === filteredOptions.length - 1 ? 0 : prevOption + 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setKeyboardOption((prevOption) => (prevOption <= 0 ? filteredOptions.length - 1 : prevOption - 1));
      e.preventDefault();
    } else if (e.key === "Enter" && keyboardOption >= 0) {
      handleOptionClick(filteredOptions[keyboardOption]);
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleOptionClick = (option: AutocompleteOption) => {
    setSelected(option);
    setSearchText("");
    setIsMenuOpen(false);
    setKeyboardOption(-1);
  };

  useEffect(() => {
    if (resultsListRef.current && keyboardOption >= 0) {
      const activeOption = resultsListRef.current.children[keyboardOption] as HTMLLIElement;
      activeOption?.scrollIntoView({ block: "nearest" });
    }
  }, [keyboardOption]);

  return (
    <div className={cn("relative", { focus: isMenuOpen }, className)}>
      <input
        ref={inputRef}
        type="text"
        value={searchText === "" ? (selected?.label ?? "") : searchText}
        onChange={handleInputChange}
        onKeyDown={handleKeyboard}
        onBlur={handleBlur}
        placeholder="Search..."
        className="w-full rounded-lg border-none bg-grey-light p-3 text-white placeholder-gray-400 outline-none outline-offset-0 transition-colors duration-150 focus:outline focus:outline-primary"
      />
      {filteredOptions.length > 0 && isMenuOpen && (
        <ul
          ref={resultsListRef}
          className={`absolute bottom-full left-0 z-10 mb-2 max-h-80 w-full overflow-y-auto rounded-lg bg-grey-light shadow-lg ${
            isMenuOpen ? "block" : "hidden"
          }`}
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option.id}
              onClick={() => handleOptionClick(option)}
              className={`cursor-pointer px-4 py-2 text-white transition-colors duration-150 hover:bg-primary hover:text-black ${
                keyboardOption === index ? "bg-primary font-semibold text-black" : "bg-grey-light"
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
