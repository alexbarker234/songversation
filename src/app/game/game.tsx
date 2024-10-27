"use client";

import Autocomplete, { AutocompleteOption } from "@/components/autocomplete";
import Button from "@/components/Button";
import Modal from "@/components/modal";
import { useGame } from "@/hooks/game";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Game({ trackMap }: { trackMap: TrackMap }) {
  const [selected, setSelected] = useState<AutocompleteOption | null>(null);

  const {
    currentTrackID,
    remainingTrackIDs,
    lyricDisplay,
    score,
    isGameFinished,
    loadGame,
    chooseNewSong,
    setScore,
    finishGame
  } = useGame(trackMap);
  const router = useRouter();

  const autocompleteOptions = Object.keys(trackMap).map((key) => ({
    label: `${trackMap[key].artist} - ${trackMap[key].name}`,
    id: key
  }));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && selected !== null) {
        event.preventDefault();
        submit(selected.id);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected]);

  const handleSubmitButton = () => {
    if (selected) submit(selected?.id);
  };

  const submit = (trackId: string) => {
    const currentTrack = trackMap[currentTrackID];
    if (currentTrack.id === trackId) {
      setScore(score + 1);
      chooseNewSong();
    } else {
      finishGame();
    }
    setSelected(null);
  };

  const restart = () => {
    loadGame();
    setSelected(null);
  };

  return (
    <>
      <div className="flex w-full flex-col items-center text-center">
        <div className="text-xs opacity-50">{Object.keys(trackMap).length} tracks loaded</div>
        <LyricBox lyricDisplay={lyricDisplay} />
      </div>

      <div className="fixed bottom-0 flex h-48 w-full flex-col items-center justify-center bg-zinc-950">
        <Autocomplete
          options={autocompleteOptions}
          selected={selected}
          setSelected={setSelected}
          className="mx-auto w-11/12 max-w-5xl"
        />

        <div className="mt-8 flex w-11/12 max-w-5xl justify-between">
          <Button onClick={finishGame} variant="bordered">
            Give Up
          </Button>
          <div className="mx-4 text-center text-6xl">{score}</div>
          <Button variant="green" onClick={handleSubmitButton} disabled={selected === null}>
            Submit
          </Button>
        </div>
      </div>

      <Modal isOpen={isGameFinished}>
        <div className="max-w-md rounded-lg bg-grey p-8 text-center text-white">
          <img
            id="track-image"
            src={trackMap[currentTrackID]?.imageURL}
            alt="Album Photo"
            className="bg-grey-dark mx-auto h-64 w-64"
          />
          <h2 id="track-name" className="my-4 text-xl">
            {trackMap[currentTrackID]?.name}
          </h2>
          <p id="streak-score" className="mb-4">
            Final Streak: {score}
          </p>
          <div className="flex justify-evenly gap-6">
            <Button variant="green" onClick={restart}>
              Play Again?
            </Button>
            <Button variant="bordered" onClick={() => router.push("/")}>
              Return Home
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function LyricBox({ lyricDisplay }: { lyricDisplay: string[] }) {
  return (
    <div className="bg-grey-dark mt-4 flex w-full max-w-5xl flex-col justify-evenly overflow-hidden rounded-lg px-4">
      {lyricDisplay.map((lyricLine, index) => (
        <div
          key={index}
          className="animate-fade-in relative flex min-h-12 select-none items-center justify-center py-4 text-2xl opacity-0 transition-opacity duration-1000"
          style={{ animationDelay: `${index * 1}s` }}
        >
          <p>{lyricLine}</p>
        </div>
      ))}
    </div>
  );
}
