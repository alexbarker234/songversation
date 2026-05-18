"use client";

import { db } from "@/lib/db";
import { GameItem } from "@/types";
import { cn } from "@/utils/cn";
import { capitaliseFirstLetter } from "@/utils/stringUtils";
import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "./Button";

const typeOptions = ["all", "artist", "playlist"] as const;
type TypeFilter = (typeof typeOptions)[number];

export default function RecentGames() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [savedGameItems, setSavedGameItems] = useState<GameItem[]>([]);

  useEffect(() => {
    const readData = async () => {
      const items = await db.gameItems.toArray();
      setSavedGameItems(items);
    };
    readData();
  }, []);

  const sortedItems = savedGameItems.sort((a, b) => (a.lastPlayed && b.lastPlayed ? b.lastPlayed - a.lastPlayed : -1));

  const filteredItems = sortedItems.filter((item) => typeFilter === "all" || item.type === typeFilter);

  return (
    <div className="mx-auto mb-12 max-w-lg p-6">
      <h1 className="mb-6 text-center text-2xl font-semibold">Recent Games</h1>

      <div className="mb-4 flex justify-center gap-4">
        {typeOptions.map((option) => (
          <Button
            key={option}
            onClick={() => setTypeFilter(option)}
            className={cn("w-auto min-w-0 px-4 transition-all", {
              "bg-white text-grey": typeFilter === option
            })}
            variant="grey-light"
          >
            {capitaliseFirstLetter(option)}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredItems.map((item) => (
          <GameItemDisplay key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

const GameItemDisplay = ({ item }: { item: GameItem }) => {
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  const lyricsDisabled = isOffline && !item.offlineReady;
  const audioDisabled = isOffline;

  return (
    <div className="flex rounded-lg bg-grey p-2 shadow">
      <img src={item.imageURL} alt={item.name} className="mr-2 h-16 w-16 shrink-0 rounded object-cover" />
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h2 className="truncate text-lg font-semibold">{item.name}</h2>
          <p className="text-sm text-gray-500">{capitaliseFirstLetter(item.type)}</p>
        </div>
        <div className="mt-2 flex gap-2">
          <Link
            href={`/game/${item.type}/${item.id}`}
            className={cn(
              "cursor-pointer rounded-lg bg-grey-light px-3 py-1 text-sm font-medium transition-colors hover:bg-primary hover:text-black",
              { "pointer-events-none cursor-not-allowed opacity-50": lyricsDisabled }
            )}
          >
            Lyrics
          </Link>
          <Link
            href={`/game/audio/${item.type}/${item.id}`}
            className={cn(
              "cursor-pointer rounded-lg bg-grey-light px-3 py-1 text-sm font-medium transition-colors hover:bg-primary hover:text-black",
              { "pointer-events-none cursor-not-allowed opacity-50": audioDisabled }
            )}
          >
            Audio
          </Link>
        </div>
      </div>
    </div>
  );
};
