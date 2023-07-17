/* eslint-disable @next/next/no-img-element */
"use client";

import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import styles from "./page.module.scss";
import buttonStyles from "@/app/button.module.scss";
import Autocomplete, { AutocompleteState } from "@/components/autocomplete";
import { randBetween } from "@/lib/mathExtensions";
import Modal from "@/components/modal";
import { useRouter } from "next/navigation";
interface GameProps extends React.HTMLAttributes<HTMLDivElement> {
    trackMap: TrackMap;
}

const Game: React.FC<GameProps> = ({ trackMap, ...props }: GameProps) => {
    const router = useRouter();
    const [score, setScore] = useState(0);
    const [correct, setCorrect] = useState<boolean | undefined>(undefined);
    const acInput = useRef("");
    const [submitEnabled, setSubmitEnabled] = useState(false);
    const [isGameFinished, setGameFinished] = useState(false);
    // in order to access with event listeners - event listeners only capture data thats in their current state so use a useRef
    const [gameState, _setGameState] = useState<GameState>({ currentTrackID: "", remainingTrackIDs: [], lyricDisplay: ["", "", ""] });
    const gameStateRef = useRef(gameState);
    const setGameState = (data: GameState) => {
        gameStateRef.current = data;
        _setGameState(data);
    };

    useEffect(() => {
        loadGame();
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
        setScore(0);
        setGameState({ currentTrackID: firstID, remainingTrackIDs: remaining, lyricDisplay: getLyrics(firstID) });

        console.log("loaded game");
        console.log({ ref: gameStateRef.current, firstID });
    };

    const getLyrics = (trackID: string) => {
        const lyricStart = randBetween(0, trackMap[trackID].lyrics.length - 3);
        return trackMap[trackID].lyrics.slice(lyricStart, lyricStart + 3);
    };

    const chooseNewSong = () => {
        let newRemaining = gameState.remainingTrackIDs;
        let newID = newRemaining.pop();
        if (!newID) {
            newRemaining = [...trackIDs];
            newRemaining = shuffleArray(newRemaining);
            newID = newRemaining.pop();
            console.log("rerun");
            if (!newID) {
                console.log("error");
                return;
            }
        }
        setGameState({ ...gameStateRef.current, currentTrackID: newID, remainingTrackIDs: newRemaining, lyricDisplay: getLyrics(newID) });
    };

    // autocomplete managed events
    const onEnterPress = (input: string, acState: AutocompleteState) => {
        console.log({ input, acState });
        if (input != "" && !acState.isMenuOpen && acState.keyboardOption == -1) {
            console.log("sub,otted");
            submit(input);
        }
    };
    const acInputChange = (input: string, acState: AutocompleteState) => {
        setSubmitEnabled(autocompleteOptions.includes(input));
        acInput.current = input;
    };

    const handleSubmitButton = (event: React.MouseEvent<HTMLElement>) => {
        submit(acInput.current);
    };

    const submit = (input: string) => {
        const currentTrack = trackMap[gameStateRef.current.currentTrackID];
        if (`${currentTrack.artist} - ${currentTrack.name}` === input) {
            setScore(score + 1);
            setCorrect(true);
        } else {
            setCorrect(false);
            setGameFinished(true);
        }
        chooseNewSong();
    };
    const autocompleteOptions = trackIDs.map((key: string) => `${trackMap[key].artist} - ${trackMap[key].name}`);
    return (
        <>
            <div {...props} className={styles["game-container"]}>
                <p className={styles["title"]}>Which song is this?</p>
                <div className={styles["lyric-box"]} key={gameState.lyricDisplay[0]}>
                    {gameState.lyricDisplay.map((lyricLine, index) => (
                        <div key={index} className={styles["lyric-line"]}>
                            <p>{lyricLine}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles["bottom-container"]}>
                <Autocomplete id={styles["guess-input"]} options={autocompleteOptions} onEnterPress={onEnterPress} onInputChange={acInputChange} />
                <div
                    className={`${styles["feedback-box"]} ${correct === undefined ? "" : !correct ? styles["incorrect"] : styles["correct"]}`}
                    key={Math.random()}
                >
                    {correct === undefined ? "" : !correct ? "X" : "✓"}
                </div>

                <div className={styles["button-container"]}>
                    <button className={`${styles["skip"]} ${buttonStyles["button"]}`} id="skip">
                        Give Up
                    </button>
                    <div className={styles["score-container"]}>
                        <p className={styles["score-text"]}>{score}</p>
                    </div>
                    <button className={`${styles["submit"]} ${buttonStyles["button"]}`} id="submit" onClick={handleSubmitButton} disabled={!submitEnabled}>
                        Submit
                    </button>
                </div>
            </div>
            <Modal isOpen={isGameFinished}>
                <div className={styles["win-modal"]}>
                    <img id="track-image" src="#" alt="Album Photo" />
                    <h2 id="track-name">{trackMap[gameState.currentTrackID]?.name}</h2>
                    <p id="streak-score">Final Streak: {score}</p>
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
}

export default Game;