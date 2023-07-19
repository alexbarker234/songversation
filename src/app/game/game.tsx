/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./game.module.scss";
import buttonStyles from "@/app/button.module.scss";
import Autocomplete, { AutocompleteRef, AutocompleteState } from "@/components/autocomplete";
import { randBetween } from "@/lib/mathExtensions";
import Modal from "@/components/modal";
import { useRouter } from "next/navigation";
interface GameProps extends React.HTMLAttributes<HTMLDivElement> {
    trackMap: TrackMap;
}

const Game: React.FC<GameProps> = ({ trackMap, ...props }: GameProps) => {
    const router = useRouter();
    const acRef = useRef<AutocompleteRef>(null);
    const [submitEnabled, setSubmitEnabled] = useState(false);
    const [isGameFinished, setGameFinished] = useState(false);
    // in order to access with event listeners - event listeners only capture data thats in their current state so use a useRef
    const [gameState, _setGameState] = useState<GameState>({ currentTrackID: "", remainingTrackIDs: [], lyricDisplay: ["", "", ""], score: 0 });
    const gameStateRef = useRef(gameState);
    const setGameState = (data: GameState) => {
        gameStateRef.current = data;
        _setGameState(data);
    };

    useEffect(() => {
        loadGame();

        document.addEventListener("keydown", handleKeyboard, true);
        return () => {
            document.removeEventListener("keydown", handleKeyboard);
        };
    }, []);

    const trackIDs = Object.keys(trackMap);

    const loadGame = () => {
        let remaining = [...trackIDs];
        remaining = shuffleArray(remaining);
        const firstID = remaining.pop();
        if (!firstID) {
            console.log("error");
            return;
        }
        setGameFinished(false);
        setGameState({ currentTrackID: firstID, remainingTrackIDs: remaining, lyricDisplay: getLyrics(firstID), score: 0 });
    };

    const getLyrics = (trackID: string) => {
        const track = trackMap[trackID];
        if (track && track.lyrics) {
            const lyricStart = randBetween(0, track.lyrics.length - 3);
            return track.lyrics?.slice(lyricStart, lyricStart + 3);
        }
        // this case should never happen as empty ones are filtered out. Typescript is complaining
        return [];
    };

    const chooseNewSong = () => {
        let newRemaining = gameStateRef.current.remainingTrackIDs;
        let newID = newRemaining.pop();
        if (!newID) {
            newRemaining = [...trackIDs];
            newRemaining = shuffleArray(newRemaining);
            newID = newRemaining.pop();
            if (!newID) {
                console.log("error");
                return;
            }
        }
        setGameState({ ...gameStateRef.current, currentTrackID: newID, remainingTrackIDs: newRemaining, lyricDisplay: getLyrics(newID) });
    };

    const setScore = (score: number) =>  setGameState({ ...gameStateRef.current, score});


    const handleKeyboard = (event: KeyboardEvent) => {
        if (event.key == "Enter") {
            const input = acRef.current?.getSearchText();
            // could use submitEnabled instead of autocompleteOptions.includes(input) but that would require another wacky useRef thing
            if (input && input != ""  && autocompleteOptions.includes(input) && !acRef.current?.getIsUsingEnterKey()) submit(input);
        }
    };
    // autocomplete managed events
    const acInputChange = (input: string, acState: AutocompleteState) => {
        setSubmitEnabled(autocompleteOptions.includes(input));
    };

    const handleSubmitButton = (event: React.MouseEvent<HTMLElement>) => {
        const input = acRef.current?.getSearchText();
        if (input) submit(input);
    };

    const submit = (input: string) => {
        const currentTrack = trackMap[gameStateRef.current.currentTrackID];
        if (`${currentTrack.artist} - ${currentTrack.name}` === input) {
            setScore(gameStateRef.current.score + 1);
            chooseNewSong();
        } else {
            finishGame();
        }
        acRef.current?.clearInput();
    };

    const finishGame = () => {
        setGameFinished(true);

        // TODO: save game to DB
    };

    const autocompleteOptions = trackIDs.map((key: string) => `${trackMap[key].artist} - ${trackMap[key].name}`);
    return (
        <>
            <div {...props} className={styles["game-container"]}>
                <div className={styles["track-count"]}>{trackIDs.length} tracks loaded</div>
                <div className={styles["lyric-box"]} key={gameState.lyricDisplay[0]}>
                    {gameState.lyricDisplay.map((lyricLine, index) => (
                        <div key={index} className={styles["lyric-line"]}>
                            <p>{lyricLine}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles["bottom-container"]}>
                <Autocomplete ref={acRef} id={styles["guess-input"]} options={autocompleteOptions} onInputChange={acInputChange} />

                <div className={styles["button-container"]}>
                    <button className={`${styles["skip"]} ${buttonStyles["button"]}`} id="skip" onClick={finishGame}>
                        Give Up
                    </button>
                    <div className={styles["score-container"]}>
                        <p className={styles["score-text"]}>{gameState.score}</p>
                    </div>
                    <button className={`${styles["submit"]} ${buttonStyles["button"]}`} id="submit" onClick={handleSubmitButton} disabled={!submitEnabled}>
                        Submit
                    </button>
                </div>
            </div>
            <Modal isOpen={isGameFinished}>
                <div className={styles["win-modal"]}>
                    <img id="track-image" src={trackMap[gameState.currentTrackID]?.imageURL} alt="Album Photo" />
                    <h2 id="track-name">{trackMap[gameState.currentTrackID]?.name}</h2>
                    <p id="streak-score">Final Streak: {gameState.score}</p>
                    <div className={styles["win-modal-buttons"]}>
                        <button type="button" className={`${buttonStyles["button"]} ${buttonStyles["grey"]}`} onClick={loadGame}>
                            Play Again?
                        </button>
                        <button type="button" className={`${buttonStyles["button"]} ${buttonStyles["grey"]}`} onClick={() => router.push("/")}>
                            Return Home
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

const shuffleArray = (array: any[]) => array.sort(() => Math.random() - 0.5);

interface GameState {
    currentTrackID: string;
    remainingTrackIDs: string[];
    lyricDisplay: string[];
    score: number;
}

export default Game;
