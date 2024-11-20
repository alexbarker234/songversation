"use client";
import Button from "@/components/Button";
import Modal from "@/components/modal";
import { db } from "@/db/db";
import { useState } from "react";

export const metadata = {
  title: "Songversation - Settings"
};

export default function SettingsPage() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const clearLocalData = async () => {
    setIsClearing(true);
    try {
      await db.delete();
      window.location.reload();
    } catch (error) {
      console.error("Error clearing data:", error);
    }
    setIsClearing(false);
    setShowConfirmModal(false);
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-8 text-center text-3xl font-bold">Settings</h1>

      <div className="rounded-lg bg-grey p-6">
        <h2 className="mb-4 text-xl font-semibold">Cached Data</h2>
        <p className="mb-4 text-gray-400">
          Clear all cached data including cached songs, lyrics. This does not affect high scores.
        </p>
        <Button onClick={() => setShowConfirmModal(true)} variant="danger">
          Clear Local Data
        </Button>
      </div>

      <Modal isOpen={showConfirmModal} onClose={() => !isClearing && setShowConfirmModal(false)}>
        <div className="max-w-lg rounded-lg bg-grey-dark p-6 text-center text-white">
          <h2 className="mb-4 text-2xl font-bold">Clear Local Data?</h2>
          <p className="mb-6 text-gray-400">
            This will remove all cached songs & lyrics. This does not affect high scores.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setShowConfirmModal(false)}
              variant="bordered"
              disabled={isClearing}
              className="min-w-32"
            >
              Cancel
            </Button>
            <Button onClick={clearLocalData} variant="danger" disabled={isClearing}>
              {isClearing ? "Clearing..." : "Clear Data"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
