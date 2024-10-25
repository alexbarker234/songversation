"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";

export default function SearchBox({ runSearch }: { runSearch: (searchText: string) => void }) {
  const [searchText, setSearchText] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);

    if (typingTimeout) clearTimeout(typingTimeout);

    setTypingTimeout(
      setTimeout(() => {
        if (searchText.replaceAll(" ", "").length < 3) return;
        runSearch(searchText);
      }, 500)
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && searchText.replaceAll(" ", "").length > 0) {
      runSearch(searchText);
      if (typingTimeout) clearTimeout(typingTimeout);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [typingTimeout]);

  return (
    <div className="mx-auto my-8 w-[95%] max-w-[700px]">
      <input
        type="text"
        value={searchText}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        className="font-inherit h-full w-full border-none bg-[var(--bg-color3)] p-3 text-inherit text-white outline-none"
      />
    </div>
  );
}
