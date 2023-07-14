"use client";

import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import styles from "./page.module.scss";
import buttonStyles from "@/app/button.module.scss";
import Autocomplete, { Option } from "@/components/autocomplete";
import { randBetween } from "@/lib/mathExtensions";

interface GameProps extends React.HTMLAttributes<HTMLDivElement> {
    trackMap: TrackMap;
}

const Game: React.FC<GameProps> = ({ trackMap, ...props }: GameProps) => {
    useEffect(() => {
        document.addEventListener("keydown", handleKeyboard, true);
    }, []);

    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<GameState>({currentTrackID: '', remainingTrackIDs: []});
    const [lyricDisplay, setLyricDisplay] = useState(["test1", "test2", "test3"]);

    const trackIDs = Object.keys(trackMap);

    // load
    useEffect(()=> {
        const firstID = trackIDs[0];
        setGameState({currentTrackID: firstID, remainingTrackIDs: [...trackIDs]})

        const lyricStart = randBetween(0, trackMap[firstID].lyrics.length - 3);     
        setLyricDisplay( trackMap[firstID].lyrics.slice(lyricStart, lyricStart + 3))
    }, [])


    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyboard = (event: KeyboardEvent) => {
        if (event.code == "Enter") {
            if (inputRef.current) submit(inputRef.current.value);
        }
    };

    const handleSubmitButton = (input: React.MouseEvent<HTMLElement>) => {
        if (inputRef.current) submit(inputRef.current.value);
    };

    const submit = (input: string) => {
        console.log(input);
        console.log(gameState)

        const currentTrack = trackMap[gameState.currentTrackID]
        console.log(`sub: ${currentTrack.artist} - ${currentTrack.name}`)
    };

    return (
        <>
            <div {...props} className={styles["game-container"]}>
                <p className={styles["title"]}>Which song is this?</p>
                <div className={styles["lyric-box"]}>
                    {lyricDisplay.map((lyricLine, index) => (
                        <div key={index} className={styles["lyric-line"]}><p>{lyricLine}</p></div>
                    ))}
                </div>
            </div>
            <div className={styles["bottom-container"]}>
                <Autocomplete
                    ref={inputRef}
                    id={styles["guess-input"]}
                    options={trackIDs.map((key: string) => ({ name: `${trackMap[key].artist} - ${trackMap[key].name}`, id: key } as Option))}
                />

                <div className={styles["button-container"]}>
                    <button className={`${styles["skip"]} ${buttonStyles["button"]}`} id="skip">
                        Give Up
                    </button>
                    <div className={styles["score-container"]}>
                        <p className={styles["score-text"]}>{score}</p>
                    </div>
                    <button className={`${styles["submit"]} ${buttonStyles["button"]}`} id="submit" onClick={handleSubmitButton}>
                        Submit
                    </button>
                </div>
                <div className={styles["win-screen"]} style={{ display: "none" }}>
                    <h1 className={styles["streak"]}></h1>
                    <button className={`${styles["play-again"]} ${buttonStyles["button"]}`}>Play Again?</button>
                </div>
            </div>
        </>
    );
};

interface GameState {
    currentTrackID: string;
    remainingTrackIDs: string[];
}

export default Game;
