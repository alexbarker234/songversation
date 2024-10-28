"use client";

import Autocomplete, { AutocompleteOption } from "@/components/autocomplete";
import Button from "@/components/Button";
import DebugTrackList from "@/components/DebugTrackList";
import Modal from "@/components/modal";
import { useGame } from "@/hooks/game";
import { useLyrics } from "@/hooks/lyrics";
import { getScore } from "@/lib/localScoreManager";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import Loading from "../loading";

interface GameProps {
  trackMap: TrackMap;
  type: "playlist" | "artist";
  id: string;
}

export default function Game({ trackMap: startTrackMap, id, type }: GameProps) {
  const [selected, setSelected] = useState<AutocompleteOption | null>(null);
  const { trackMap, isDone } = useLyrics(startTrackMap);

  const {
    currentTrackID,
    lyricDisplay,
    score,
    isGameFinished,

    trackOrder,
    currentTrackIndex,

    loadGame,
    submit,
    finishGame
  } = useGame(trackMap, type, id);

  const autocompleteOptions = Object.keys(trackMap).map((key) => ({
    label: `${trackMap[key].artist} - ${trackMap[key].name}`,
    id: key
  }));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && selected !== null) {
        event.preventDefault();
        handleSubmit(selected.id);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected]);

  const handleSubmitButton = () => {
    if (selected) handleSubmit(selected?.id);
  };

  const handleSubmit = (trackId: string) => {
    submit(trackId);
    setSelected(null);
  };

  const restart = () => {
    loadGame();
    setSelected(null);
  };
  if (!isDone) return <Loading />;

  return (
    <>
      <div className="flex w-full flex-col items-center text-center">
        <div className="text-xs opacity-50">{Object.keys(trackMap).length} tracks loaded</div>
        <LyricBox lyricDisplay={lyricDisplay} trackId={currentTrackID} />
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
      <FinishModal
        isOpen={isGameFinished}
        score={score}
        finalTrack={trackMap[currentTrackID]}
        restart={restart}
        type={type}
        id={id}
      />
      <DebugTrackList trackMap={trackMap} trackOrder={trackOrder} currentTrackIndex={currentTrackIndex} />
    </>
  );
}

function LyricBox({ lyricDisplay, trackId }: { lyricDisplay: string[]; trackId: string }) {
  return (
    <div className="mt-4 flex w-full max-w-5xl flex-col justify-evenly overflow-hidden rounded-lg bg-grey-dark px-4">
      {lyricDisplay.map((lyricLine, index) => (
        <div
          key={trackId + index}
          className="relative flex min-h-12 animate-fade-in select-none items-center justify-center py-4 text-2xl opacity-0 transition-opacity duration-1000"
          style={{ animationDelay: `${index * 1}s` }}
        >
          <p>{lyricLine}</p>
        </div>
      ))}
    </div>
  );
}

function FinishModal({
  isOpen,
  score,
  finalTrack,
  restart,
  type,
  id
}: {
  isOpen: boolean;
  score: number;
  finalTrack: Track | undefined;
  restart: () => void;
  type: "playlist" | "artist";
  id: string;
}) {
  const router = useRouter();
  const [highScore, setHighScore] = useState<number | null>(null);

  useEffect(() => {
    setHighScore(getScore(type, id));

    // Refresh whenever open is changed
  }, [isOpen]);

  if (!finalTrack) return null;

  const isHighscore = score === highScore && score != 0;

  return (
    <Modal isOpen={isOpen}>
      {isHighscore && isOpen && (
        <Confetti className="absolute left-0 top-0 h-full w-full" width={472} numberOfPieces={50} />
      )}
      <div className="mx-auto h-[472px] w-[448px] overflow-hidden rounded-lg bg-grey-dark p-6 text-center text-white shadow-lg">
        <img
          src={finalTrack.imageURL}
          alt="Album Cover"
          className="mx-auto mb-4 h-48 w-48 rounded-lg object-cover shadow-md"
        />

        <h2 className="mb-1 text-2xl font-semibold">{finalTrack.name}</h2>

        <div className="mt-4 flex justify-center gap-4">
          <div className="rounded-lg bg-grey-light p-4 text-lg shadow-inner">
            <p className="font-semibold">Final Score</p>
            <p className={cn("text-2xl font-bold", { "animate-pulse-scale text-primary": isHighscore })}>{score}</p>
          </div>
          <div className="rounded-lg bg-grey-light p-4 text-lg shadow-inner">
            <p className="font-semibold">Best Score</p>
            <p className={cn("text-2xl font-bold", { "animate-pulse-scale text-primary": isHighscore })}>{highScore}</p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-6">
          <Button variant="green" onClick={restart}>
            Play Again
          </Button>
          <Button variant="bordered" onClick={() => router.push("/")}>
            Return Home
          </Button>
        </div>
      </div>
    </Modal>
  );
}
