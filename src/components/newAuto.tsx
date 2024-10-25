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
  onSelect: (option: AutocompleteOption) => void;
};

const Autocomplete: React.FC<AutocompleteProps> = ({ options, selected, className, onSelect }) => {
  // State
  const [searchText, setSearchText] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [keyboardOption, setKeyboardOption] = useState(-1);
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsListRef = useRef<HTMLUListElement>(null);

  // Close when clicking off
  useClickOutside([inputRef, resultsListRef], () => setIsMenuOpen(false), isMenuOpen);

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
    onSelect(option);
    setSearchText(option.label);
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
        value={searchText}
        onChange={handleInputChange}
        onKeyDown={handleKeyboard}
        placeholder="Search..."
        className="h-full w-full bg-grey-light p-3 text-white outline-none"
      />
      {filteredOptions.length > 0 && isMenuOpen && (
        <ul
          className={`absolute bottom-full left-0 z-10 max-h-80 w-full list-none overflow-y-scroll bg-grey-light ${
            isMenuOpen ? "block" : "hidden"
          }`}
          ref={resultsListRef}
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option.id}
              onClick={() => handleOptionClick(option)}
              className={`flex cursor-pointer items-center px-4 py-2 ${
                keyboardOption === index ? "border border-primary" : "hover:bg-grey"
              }`}
            >
              <div>{option.label}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
