"use client";

import { Data, PeerConnection } from "@/utils/peerUtils";
import { useEffect, useRef, useState } from "react";
import { FaCopy } from "react-icons/fa";

interface ConnectionMessage {
  messageType: "connect-request";
  message: {
    name: string;
  };
}
interface ConnectionResponseMessage {
  messageType: "connect-response";
  message: {
    name: string;
  };
}

interface GenericMessage {
  messageType: "message";
  message: string;
}

interface ScoreMessage {
  messageType: "score-update";
  message: {
    score: number;
  };
}

type GameMessage = ConnectionMessage | ConnectionResponseMessage | GenericMessage | ScoreMessage;

export default function MultiplayerTest() {
  const [myPeerId, setMyPeerId] = useState<string>("");
  const [targetPeerId, setTargetPeerId] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");
  const [peerName, setPeerName] = useState<string>("");
  const [myScore, setMyScore] = useState<number>(0);
  const [peerScore, setPeerScore] = useState<number>(0);

  // is this good practice? TODO: improve?
  const handleMessageRef = useRef<(targetPeerId: string, data: GameMessage) => void>(() => {});

  useEffect(() => {
    // Start peer session when component mounts
    PeerConnection.startPeerSession().then((id) => {
      setMyPeerId(id);

      // Handle incoming connections
      PeerConnection.onIncomingConnection((conn) => {
        setTargetPeerId(conn.peer);
        setIsConnected(true);
        PeerConnection.onConnectionReceiveData(conn.peer, async (data: Data) =>
          handleMessageRef.current(conn.peer, data as GameMessage)
        );
      });
    });

    // Cleanup on unmount
    return () => {
      PeerConnection.closePeerSession();
    };
  }, []);

  const connectToPeer = async () => {
    if (!userName.trim()) {
      alert("Please enter a username before connecting.");
      return;
    }
    try {
      await PeerConnection.connectPeer(targetPeerId);
      setIsConnected(true);
      PeerConnection.onConnectionReceiveData(targetPeerId, (data: Data) =>
        handleMessageRef.current(targetPeerId, data as GameMessage)
      );

      // Send username to the peer
      await PeerConnection.sendConnection(targetPeerId, {
        messageType: "connect-request",
        message: {
          name: userName
        }
      });
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  // Handle Messages, ensure that it updates with state
  useEffect(() => {
    handleMessageRef.current = async (targetPeerId: string, data: GameMessage) => {
      console.log("Received message:", data.message);
      if (data.message) {
        // Handle Connection Request
        if (data.messageType === "connect-request") {
          console.log("Received connect request:", data.message.name);
          const incomingPeerName = data.message.name;
          setPeerName(incomingPeerName);
          await PeerConnection.sendConnection(targetPeerId, {
            messageType: "connect-response",
            message: {
              name: userName
            }
          });
        }

        // Handle Connection Response
        else if (data.messageType === "connect-response") {
          console.log("Received connect response:", data.message.name);
          setPeerName(data.message.name);
        }

        // Handle Score Update
        else if (data.messageType === "score-update") {
          setPeerScore(data.message.score);
        }
      }
    };
  }, [userName]);

  const incrementScore = async () => {
    if (!targetPeerId) return;

    try {
      const newScore = myScore + 1;
      setMyScore(newScore);
      await PeerConnection.sendConnection(targetPeerId, {
        messageType: "score-update",
        message: {
          score: newScore
        }
      });
    } catch (err) {
      console.error("Failed to send score update:", err);
    }
  };

  return (
    <div className="p-4">
      {!isConnected && (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              My Peer ID: {myPeerId}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(myPeerId || "");
                }}
                className="ml-2 rounded bg-gray-200 px-2 py-1 text-sm text-gray-800 hover:bg-gray-300"
              >
                <FaCopy />
              </button>
            </h2>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="mr-2 border p-2 text-black"
            />
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={targetPeerId}
              onChange={(e) => setTargetPeerId(e.target.value)}
              placeholder="Enter peer ID to connect"
              className="mr-2 border p-2 text-black"
            />
            <button onClick={connectToPeer} className="rounded bg-blue-500 px-4 py-2 text-white">
              Connect
            </button>
          </div>
        </>
      )}

      <div className="mb-4">
        <button onClick={incrementScore} className="rounded bg-green-500 px-4 py-2 text-white">
          Increment Score
        </button>
      </div>

      <div className="border p-4">
        <h3 className="mb-2 font-bold">Scores:</h3>
        <div className="mb-1">
          {userName || "You"}: {myScore}
        </div>
        <div className="mb-1">
          {peerName || "Peer"}: {peerScore}
        </div>
      </div>
    </div>
  );
}
