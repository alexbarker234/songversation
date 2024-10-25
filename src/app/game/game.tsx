"use client";

import buttonStyles from "@/app/button.module.scss";
import Modal from "@/components/modal";
import Autocomplete, { AutocompleteOption } from "@/components/newAuto";
import { useGame } from "@/hooks/game";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./game.module.scss";

export default function Game({ trackMap }: { trackMap: TrackMap }) {
  // STATE
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

  // REFS
  // const acRef = useRef<AutocompleteRef>(null);

  // OTHER
  const router = useRouter();

  const autocompleteOptions = Object.keys(trackMap).map((key) => ({
    label: `${trackMap[key].artist} - ${trackMap[key].name}`,
    id: key
  }));

  useEffect(() => {
    document.addEventListener("keydown", handleKeyboard, true);
    return () => {
      document.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  const handleKeyboard = (event: KeyboardEvent) => {
    // TODO
    // if (event.key === "Enter") {
    //   const input = acRef.current?.getSearchText();
    //   if (input && autocompleteOptions.includes(input) && !acRef.current?.getIsUsingEnterKey()) submit(input);
    // }
  };

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

  return (
    <>
      <div className={styles["game-container"]}>
        <div className={styles["track-count"]}>{Object.keys(trackMap).length} tracks loaded</div>
        <div className={styles["lyric-box"]} key={lyricDisplay[0]}>
          {lyricDisplay.map((lyricLine, index) => (
            <div key={index} className={styles["lyric-line"]}>
              <p>{lyricLine}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={styles["bottom-container"]}>
        <Autocomplete
          options={autocompleteOptions}
          selected={selected}
          onSelect={setSelected}
          className="mx-auto w-11/12 max-w-5xl"
        />
        <div className={styles["button-container"]}>
          <button className={`${styles["skip"]} ${buttonStyles["button"]}`} id="skip" onClick={finishGame}>
            Give Up
          </button>
          <div className={styles["score-container"]}>
            <p className={styles["score-text"]}>{score}</p>
          </div>
          <button
            className={`${styles["submit"]} ${buttonStyles["button"]}`}
            id="submit"
            onClick={handleSubmitButton}
            disabled={selected === null}
          >
            Submit
          </button>
        </div>
      </div>
      <Modal isOpen={isGameFinished}>
        <div className={styles["win-modal"]}>
          <img id="track-image" src={trackMap[currentTrackID]?.imageURL} alt="Album Photo" />
          <h2 id="track-name">{trackMap[currentTrackID]?.name}</h2>
          <p id="streak-score">Final Streak: {score}</p>
          <div className={styles["win-modal-buttons"]}>
            <button type="button" className={`${buttonStyles["button"]} ${buttonStyles["green"]}`} onClick={loadGame}>
              Play Again?
            </button>
            <button
              type="button"
              className={`${buttonStyles["button"]} ${buttonStyles["grey"]}`}
              onClick={() => router.push("/")}
            >
              Return Home
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
