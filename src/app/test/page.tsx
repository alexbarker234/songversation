"use client";

import { db } from "@/db/db";
import { useEffect, useState } from "react";

const sampleTrack: Track = {
  id: "1",
  artist: "Sample Artist",
  name: "Sample Song",
  imageURL: "https://via.placeholder.com/150",
  lyrics: ["Sample lyric line 1", "Sample lyric line 2"],
  hasFetchedLyrics: true
};

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);

  // Fetch tracks from Dexie database on component mount
  useEffect(() => {
    const fetchTracks = async () => {
      const allTracks = await db.tracks.toArray();
      setTracks(allTracks);
    };
    fetchTracks();
  }, []);

  // Function to add a new track
  const addTrack = async () => {
    await db.tracks.add({ ...sampleTrack, id: `${tracks.length + 1}` });
    const updatedTracks = await db.tracks.toArray();
    setTracks(updatedTracks);
  };

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-4 text-center text-2xl font-semibold">Songversation Tracks</h1>
      <button
        onClick={addTrack}
        className="mb-4 w-full rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
      >
        Add Sample Track
      </button>
      <div className="space-y-4">
        {tracks.length > 0 ? (
          tracks.map((track) => (
            <div key={track.id} className="rounded-md border p-4 shadow">
              <div className="flex items-center space-x-4">
                <img src={track.imageURL} alt={track.name} className="h-16 w-16 rounded-md object-cover" />
                <div>
                  <h2 className="text-lg font-semibold">{track.name}</h2>
                  <p className="text-gray-500">{track.artist}</p>
                </div>
              </div>
              {track.lyrics && (
                <div className="mt-2">
                  <h3 className="text-sm font-semibold">Lyrics:</h3>
                  <ul className="list-inside list-disc text-sm text-gray-700">
                    {track.lyrics.map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No tracks available</p>
        )}
      </div>
    </div>
  );
}
