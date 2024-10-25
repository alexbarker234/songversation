import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  children: React.ReactNode;
  onClose?: () => void;
}

export default function Modal({ isOpen, children, onClose }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (isOpen) {
      dialog?.showModal();
    } else {
      dialog?.close();
    }

    if (onClose) {
      dialog?.addEventListener("close", onClose);
      return () => dialog?.removeEventListener("close", onClose);
    }
  }, [isOpen, onClose]);

  return (
    <dialog ref={dialogRef} onCancel={(e) => e.preventDefault()} className="bg-transparent backdrop:bg-black/70">
      {children}
    </dialog>
  );
}
