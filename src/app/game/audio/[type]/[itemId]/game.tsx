"use client";

import AudioClipPlayer from "@/components/AudioClipPlayer";
import Autocomplete, { AutocompleteOption } from "@/components/Autocomplete";
import Button from "@/components/Button";
import DebugTrackList from "@/components/DebugTrackList";
import FieldInfoHover from "@/components/InfoHover";
import Loading from "@/components/Loading";
import Modal from "@/components/Modal";
import { usePreviewGame } from "@/hooks/game/usePreviewGame";
import { usePreviewGameData } from "@/hooks/game/usePreviewGameData";
import { useWindowSize } from "@/hooks/useWindowSize";
import { getScore } from "@/lib/localScoreManager";
import { Track } from "@/types";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

interface AudioGameProps {
  type: "playlist" | "artist";
  id: string;
}

export default function AudioGame({ type, id }: AudioGameProps) {
  const [selected, setSelected] = useState<AutocompleteOption | null>(null);
  const { gameItem, isLoading, trackMap, fetchPreviews, playableTrackCount } = usePreviewGameData(type, id);

  const isDataReady = !isLoading;

  const {
    currentTrackID,
    previewUrl,
    clipKey,
    score,
    isGameFinished,
    isLoaded,
    trackOrder,
    currentTrackIndex,
    isPlayable,
    errorMessage,
    loadGame,
    submit,
    finishGame
  } = usePreviewGame(trackMap, type, id, isDataReady, fetchPreviews);

  const autocompleteOptions = Object.keys(trackMap).map((key) => ({
    label: `${trackMap[key]?.artist} - ${trackMap[key]?.name}`,
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
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

  const handleSubmit = (trackId: string) => {
    submit(trackId);
    setSelected(null);
  };

  const restart = () => {
    loadGame();
    setSelected(null);
  };

  if (errorMessage) return <div className="my-12 text-center text-xl">{errorMessage}</div>;
  if (!isPlayable) return <div className="my-12 text-center text-xl">Sorry, the game could not be loaded.</div>;
  if (!isLoaded) return <Loading className="my-auto" />;
  if (!currentTrackID || !gameItem) {
    throw new Error("No current track ID or game item");
  }

  return (
    <>
      <div className="mb-1 mt-8 flex items-center justify-center text-center text-2xl md:mt-4 md:text-3xl">
        <div>
          Which <span className="font-semibold">{gameItem.name}</span> song is this?
        </div>
      </div>
      <div className="flex w-full flex-col items-center text-center">
        <div className="flex items-center text-xs text-gray-500">
          <span>
            {playableTrackCount} of {Object.keys(trackMap).length} tracks have previews
          </span>
          <FieldInfoHover content="Some tracks may not have audio previews and will be skipped" />
        </div>
        <div className="mt-4 flex w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-grey-dark px-4">
          <AudioClipPlayer previewUrl={previewUrl} clipKey={clipKey} />
        </div>
      </div>

      <div className="bottom-0 flex w-full flex-col items-center justify-center bg-zinc-950 p-4 pb-10 md:fixed md:pb-4">
        <Autocomplete
          options={autocompleteOptions}
          selected={selected}
          setSelected={setSelected}
          className="mx-auto w-11/12 max-w-5xl"
        />

        <div className="mt-8 flex w-11/12 max-w-5xl justify-between">
          <Button onClick={finishGame} variant="bordered" className="cursor-pointer disabled:cursor-not-allowed">
            Give Up
          </Button>
          <div className="mx-4 text-center text-6xl">{score}</div>
          <Button
            variant="green"
            onClick={() => selected && handleSubmit(selected.id)}
            disabled={selected === null}
            className="cursor-pointer disabled:cursor-not-allowed"
          >
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
      <DebugTrackList trackMap={trackMap} trackOrder={trackOrder} currentTrackIndex={currentTrackIndex} mode="audio" />
    </>
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
  const { width } = useWindowSize();

  useEffect(() => {
    setHighScore(getScore(type, id, "audio"));
  }, [isOpen, type, id]);

  if (!finalTrack) return null;

  const isHighscore = score === highScore && score != 0;
  return (
    <Modal isOpen={isOpen}>
      {isHighscore && isOpen && (
        <Confetti
          className="pointer-events-none absolute left-0 top-0 h-full w-full"
          width={width}
          numberOfPieces={300}
          recycle={false}
          tweenDuration={20000}
        />
      )}
      <div className="mx-auto w-11/12 max-w-[448px] overflow-hidden rounded-lg bg-grey-dark p-6 text-center text-white shadow-lg">
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
          <Button variant="green" onClick={restart} className="cursor-pointer disabled:cursor-not-allowed">
            Play Again
          </Button>
          <Button
            variant="bordered"
            onClick={() => router.push("/")}
            className="cursor-pointer disabled:cursor-not-allowed"
          >
            Return Home
          </Button>
        </div>
      </div>
    </Modal>
  );
}
