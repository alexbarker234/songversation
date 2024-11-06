"use client";
import { db } from "@/db/db";
import { useEffect, useState } from "react";

interface TestDbSaveProps {
  gameItem: GameItem;
}

export default function TestDbSave({ gameItem }: TestDbSaveProps) {
  const [savedGameItems, setSavedGameItems] = useState<GameItem[]>([]);

  useEffect(() => {
    saveGameItem();
    const fetchSavedGameItems = async () => {
      const items = await db.gameItems.toArray();
      setSavedGameItems(items);
    };
    fetchSavedGameItems();
  }, []);

  const saveGameItem = async () => {
    await db.gameItems.put(gameItem);
    const updatedItems = await db.gameItems.toArray();
    setSavedGameItems(updatedItems);
  };

  return (
    <div className="text-center">
      <div className="mt-6">
        <h2 className="mb-4 text-2xl font-semibold">Saved Game Items</h2>
        {savedGameItems.length > 0 ? (
          <ul className="space-y-4">
            {savedGameItems.map((item) => (
              <li key={item.id} className="rounded-md border p-4 shadow">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <img src={item.imageURL} alt={item.name} className="mx-auto h-16 w-16 rounded-md" />
                <p className="text-gray-600">Type: {item.type}</p>
                <p className="text-gray-600">Tracks: {item.trackIds.join(", ")}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No game items saved yet.</p>
        )}
      </div>
    </div>
  );
}
