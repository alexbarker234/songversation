import { Data, PeerConnection } from "@/utils/peerUtils";
import { useEffect, useRef, useState } from "react";

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

interface ScoreMessage {
  messageType: "score-update";
  message: {
    score: number;
  };
}

interface FinishedGameMessage {
  messageType: "finished-game";
  message: {
    score: number;
  };
}

interface StartGameMessage {
  messageType: "start-game";
  message: {
    seed: string;
  };
}

type GameMessage =
  | ConnectionMessage
  | ConnectionResponseMessage
  | ScoreMessage
  | FinishedGameMessage
  | StartGameMessage;

// The "Host" is the peer being connected TO
export function useMultiplayer(onDisconnect?: () => void) {
  const [myPeerId, setMyPeerId] = useState<string>("");
  const [targetPeerId, setTargetPeerId] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");
  const [peerName, setPeerName] = useState<string>("");
  const [peerScore, setPeerScore] = useState<number>(0);
  const [seed, setSeed] = useState<string>("");

  // is this good practice? TODO: improve?
  const handleMessageRef = useRef<(targetPeerId: string, data: GameMessage) => void>(() => {});

  // Generate a random seed
  const generateSeed = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Load username from localStorage on initial render
  useEffect(() => {
    const savedUsername = localStorage.getItem("multiplayer_username");
    if (savedUsername) {
      setUserName(savedUsername);
    }
  }, []);

  const setUserNameWithStorage = (name: string) => {
    setUserName(name);
    localStorage.setItem("multiplayer_username", name);
  };

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

        // Handle disconnections
        PeerConnection.onConnectionDisconnected(conn.peer, () => {
          setIsConnected(false);
          setTargetPeerId("");
          setPeerName("");
          setPeerScore(0);
          onDisconnect?.();
        });
      });
    });

    // Cleanup on unmount
    return () => {
      PeerConnection.closePeerSession();
    };
  }, []);

  const connectToPeer = async (targetPeerId: string) => {
    if (!userName.trim()) {
      alert("Please enter a username before connecting.");
      return;
    }
    setTargetPeerId(targetPeerId);
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
              name: userName,
              seed: seed
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

        // Handle Start Game
        else if (data.messageType === "start-game") {
          setSeed(data.message.seed);
          console.log("Received game seed:", data.message.seed);
        }
      }
    };
  }, [userName, seed]);

  const sendScore = async (score: number) => {
    if (!targetPeerId) return;

    try {
      await PeerConnection.sendConnection(targetPeerId, {
        messageType: "score-update",
        message: {
          score: score
        }
      });
    } catch (err) {
      console.error("Failed to send score update:", err);
    }
  };

  const startGame = async () => {
    if (!targetPeerId) return;

    try {
      const newSeed = generateSeed();
      setSeed(newSeed);
      await PeerConnection.sendConnection(targetPeerId, {
        messageType: "start-game",
        message: {
          seed: newSeed
        }
      });
    } catch (err) {
      console.error("Failed to start game:", err);
    }
  };

  return {
    myPeerId,
    userName,
    isConnected,
    seed,
    peer: {
      name: peerName,
      score: peerScore
    },
    connectToPeer,
    sendScore,
    startGame,
    setUserName: setUserNameWithStorage
  };
}
