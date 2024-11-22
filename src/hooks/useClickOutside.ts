import { useEffect } from "react";

export function useClickOutside(refs: React.RefObject<HTMLElement>[], action: () => void, isActive: boolean) {
  const handleClickOutside = (event: MouseEvent) => {
    if (refs.every((ref) => ref.current && !ref.current.contains(event.target as Node))) {
      action();
    }
  };

  useEffect(() => {
    if (isActive) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActive]);
}
