import { cn } from "@/utils/cn";
import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useDebouncedCallback } from "use-debounce";

interface SearchBoxProps {
  className?: string;
  placeholder?: string;
  runSearch: (searchText: string) => void;
}

export default function SearchBox({ className, placeholder, runSearch }: SearchBoxProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebouncedCallback((text: string) => {
    if (text.replaceAll(" ", "").length >= 3) {
      runSearch(text);
    }
  }, 300);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && search.replaceAll(" ", "").length > 0) {
      runSearch(search);
      debouncedSearch.cancel();
    }
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        "group relative mx-auto my-8 flex w-[95%] max-w-3xl cursor-text items-center rounded-full bg-grey-light outline-2 focus-within:outline focus-within:outline-white",
        className
      )}
      onMouseDown={handleMouseDown}
    >
      <FaSearch size={24} className="ml-4 text-gray-400 transition-colors group-focus-within:text-white" />
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Search..."}
        className="font-inherit h-full w-full bg-transparent p-3 text-inherit text-white outline-none"
      />
    </div>
  );
}
