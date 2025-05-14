"use client";

import { useMultiplayer } from "@/hooks/game/useMultiplayer";
import { useEffect, useState } from "react";
import { FaCopy } from "react-icons/fa";
import Game from "./game";

interface MultiplayerGameProps {
  type: "playlist" | "artist";
  id: string;
}

export default function MultiplayerGame({ type, id }: MultiplayerGameProps) {
  const [peerIdInput, setPeerIdInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [hasDisconnected, setHasDisconnected] = useState(false);

  const onDisconnect = () => {
    setHasDisconnected(true);
    setGameStarted(false);
  };

  const { myPeerId, isConnected, seed, peer, userName, connectToPeer, sendScore, startGame, setUserName } =
    useMultiplayer(onDisconnect);

  useEffect(() => {
    if (isConnected && seed) {
      setGameStarted(true);
    }
  }, [isConnected, seed]);

  const handleConnect = () => {
    console.log(userName);
    if (!userName.trim()) {
      alert("Please enter your username");
      return;
    }
    setUserName(userName);
    connectToPeer(peerIdInput);
  };

  const handleStartGame = () => {
    startGame();
  };

  const copyPeerId = () => {
    navigator.clipboard.writeText(myPeerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onScoreUpdate = (score: number) => {
    sendScore(score);
  };

  if (!gameStarted) {
    return (
      <>
        <DisconnectModal isOpen={hasDisconnected} onClose={() => setHasDisconnected(false)} />
        <div className="flex flex-col items-center justify-center p-6">
          <h1 className="mb-6 text-3xl font-bold">Multiplayer Game</h1>

          <div className="mb-8 w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-lg">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Your Username</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Your Peer ID</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={myPeerId}
                  readOnly
                  className="w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white focus:outline-none"
                />
                <button
                  onClick={copyPeerId}
                  className="ml-2 rounded-md bg-blue-600 p-2 hover:bg-blue-700"
                  title="Copy to clipboard"
                >
                  <FaCopy />
                </button>
              </div>
              {copied && <p className="mt-1 text-xs text-green-400">Copied to clipboard!</p>}
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Connect to Peer</label>
              <input
                type="text"
                value={peerIdInput}
                onChange={(e) => setPeerIdInput(e.target.value)}
                placeholder="Enter peer ID to connect"
                className="w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleConnect}
                className="rounded-md bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!peerIdInput || !userName.trim()}
              >
                Connect
              </button>

              <button
                onClick={handleStartGame}
                className="rounded-md bg-green-600 px-4 py-2 font-medium hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!isConnected}
              >
                Start Game
              </button>
            </div>
          </div>

          {isConnected && (
            <div className="rounded-lg bg-gray-800 p-4 text-center">
              <p className="text-lg font-medium text-green-400">Connected to {peer.name}</p>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mt-2 flex h-16 w-full justify-center">
        <PlayerScoreCard name={peer.name} score={peer.score} />
      </div>
      <Game type={type} id={id} seed={seed} onScoreUpdate={onScoreUpdate} />
    </>
  );
}

function PlayerScoreCard({ score, name }: { score: number; name: string }) {
  return (
    <div className="flex aspect-square w-24 flex-col items-center justify-center rounded-lg bg-grey px-1">
      <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm text-white">
        {name}
      </div>
      <div className="mt-1 font-bold text-green-400">{score}</div>
    </div>
  );
}
function DisconnectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <div className="mx-auto w-11/12 max-w-md overflow-hidden rounded-lg bg-grey-dark p-6 text-center text-white shadow-lg">
        <h2 className="mb-4 text-2xl font-semibold text-red-400">Connection Lost</h2>

        <p className="mb-6">
          Your opponent has disconnected from the game. You can return to the multiplayer setup to find a new opponent.
        </p>

        <div className="flex justify-center">
          <button onClick={onClose} className="rounded-md bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700">
            Return to Setup
          </button>
        </div>
      </div>
    </div>
  );
}
