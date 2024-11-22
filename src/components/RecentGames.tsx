"use client";

import { db } from "@/lib/db";
import { GameItem } from "@/types";
import { cn } from "@/utils/cn";
import { capitaliseFirstLetter } from "@/utils/stringUtils";
import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "./Button";

const buttonOptions = ["all", "artist", "playlist"] as const;

export default function RecentGames() {
  const [currentMenu, setCurrentMenu] = useState<"all" | "artist" | "playlist">("all");
  const [savedGameItems, setSavedGameItems] = useState<GameItem[]>([]);
  useEffect(() => {
    const readData = async () => {
      const items = await db.gameItems.toArray();
      setSavedGameItems(items);
    };
    readData();
  }, []);

  const sortedItems = savedGameItems.sort((a, b) => (a.lastPlayed && b.lastPlayed ? b.lastPlayed - a.lastPlayed : -1));

  return (
    <div className="mx-auto mb-12 max-w-lg p-6">
      <h1 className="mb-6 text-center text-2xl font-semibold">Recent Games</h1>

      <div className="mb-4 flex justify-center gap-4">
        {buttonOptions.map((option) => (
          <Button
            key={option}
            onClick={() => setCurrentMenu(option)}
            className={`transition-all ${currentMenu === option ? "bg-white text-grey" : ""}`}
            variant="grey-light"
          >
            {capitaliseFirstLetter(option)}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {sortedItems
          .filter((item) => currentMenu === "all" || item.type === currentMenu)
          .map((item) => (
            <GameItemDisplay key={item.id} item={item} />
          ))}
      </div>
    </div>
  );
}

const GameItemDisplay = ({ item }: { item: GameItem }) => {
  return (
    <Link
      href={`/game/${item.type}/${item.id}`}
      className={cn("flex rounded-lg p-2 shadow transition-colors hover:bg-grey-light", {
        "pointer-events-none opacity-50": !item.offlineReady && !navigator.onLine
      })}
    >
      <img src={item.imageURL} alt={item.name} className="mr-2 h-16 w-16" />
      <div className="flex flex-col">
        <h2 className="text-lg font-semibold">{item.name}</h2>
        <p className="mt-2 text-sm text-gray-500">{capitaliseFirstLetter(item.type)}</p>
      </div>
    </Link>
  );
};
