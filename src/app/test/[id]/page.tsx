"use client";

import { db } from "@/db/db";
import { useEffect, useState } from "react";

interface SpotifyItem {
  id: string;
  name: string;
  imageURL: string;
}

interface Track {
  id: string;
  artist: string;
  name: string;
  imageURL: string;
  lyrics?: string[];
  hasFetchedLyrics?: boolean;
}

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  const [savedGameItem, setSavedGameItem] = useState<SpotifyItem | undefined>(undefined);
  const [savedTracks, setSavedTracks] = useState<Track[]>([]);
  const type = "artist";

  useEffect(() => {
    if (navigator.onLine) {
      fetchAndSaveData();
    } else {
      loadFromDatabase();
    }
  }, []);

  const fetchAndSaveData = async () => {
    try {
      // Fetch SpotifyItem data
      const itemResponse = await fetch(`/api/item/${type}/${id}`);
      const item: SpotifyItem = await itemResponse.json();

      // Fetch Track data
      const tracksResponse = await fetch(`/api/tracks/${type}/${id}`);
      const trackMap: Record<string, Track> = await tracksResponse.json();
      const tracks = Object.values(trackMap);

      // Save item to the Dexie database
      const gameItem: GameItem = {
        id: id,
        name: item.name,
        imageURL: item.imageURL,
        type: type,
        trackIds: tracks.map((track) => track.id)
      };

      await db.gameItems.put(gameItem);

      // Save tracks to the Dexie database
      for (const track of tracks) {
        await db.tracks.put(track);
      }

      // Update state with the latest data from the database
      setSavedGameItem(gameItem);
      setSavedTracks(tracks);
    } catch (error) {
      console.error("Error fetching data:", error);
      // If there's an error, try to load from the database as a fallback
      loadFromDatabase();
    }
  };

  // Load data from Dexie database if offline
  const loadFromDatabase = async () => {
    const gameItem = await db.gameItems.where("id").equals(id).first();
    if (!gameItem) return;
    const relatedTracks = await db.tracks.where("id").anyOf(gameItem.trackIds).toArray();

    setSavedGameItem(gameItem);
    setSavedTracks(relatedTracks);
  };

  return (
    <div className="text-center">
      <div className="mt-6">
        <h2 className="mb-4 text-2xl font-semibold">Saved Game Items</h2>
        {savedGameItem ? (
          <div className="rounded-md border p-4 shadow">
            <h3 className="text-lg font-semibold">{savedGameItem.name}</h3>
            <img src={savedGameItem.imageURL} alt={savedGameItem.name} className="mx-auto h-16 w-16 rounded-md" />
          </div>
        ) : (
          <p className="text-gray-500">No game items saved yet.</p>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-4 text-2xl font-semibold">Saved Tracks</h2>
        {savedTracks.length > 0 ? (
          <ul className="flex flex-wrap justify-center gap-4">
            {savedTracks.map((track) => (
              <li key={track.id} className="h-52 w-52 rounded-md border p-4 shadow">
                <h3 className="text-lg font-semibold">{track.name}</h3>
                <p className="text-gray-600">Artist: {track.artist}</p>
                <img src={track.imageURL} alt={track.name} className="mx-auto h-16 w-16 rounded-md" />
                {track.lyrics && (
                  <div>
                    <h4 className="mt-2 text-sm font-semibold">Lyrics:</h4>
                    <ul className="list-inside list-disc text-sm text-gray-700">
                      {track.lyrics.map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No tracks saved yet.</p>
        )}
      </div>
    </div>
  );
}
