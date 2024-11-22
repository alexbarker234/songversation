"use client";
import { useStandalone } from "@/hooks/useStandalone";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { BsPersonFill, BsStack } from "react-icons/bs";
import { FaCog, FaHome } from "react-icons/fa";
import Logo from "./Logo";

export default function Navigation() {
  const { isStandalone } = useStandalone();

  return (
    <>
      <TopNav isStandalone={isStandalone} />
      <BottomNav isStandalone={isStandalone} />
    </>
  );
}
const TopNav = ({ isStandalone }: { isStandalone: boolean }) => {
  return (
    <nav
      className={cn("relative flex shrink-0 items-center justify-center overflow-hidden text-white", {
        hidden: isStandalone
      })}
    >
      <Logo />
      <Link
        href="/settings"
        className="absolute right-4 opacity-50 transition-all hover:rotate-90 hover:scale-110 hover:opacity-100 active:scale-90"
      >
        <FaCog size={24} />
      </Link>
    </nav>
  );
};

const BottomNav = ({ isStandalone }: { isStandalone: boolean }) => {
  if (!isStandalone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-between bg-zinc-950 pb-8 text-sm md:hidden">
      <BottomNavItem href="/" icon={<FaHome size={24} />} text="Home" />
      <BottomNavItem href="/game/artist" icon={<BsPersonFill size={24} />} text="Artist Quiz" />
      <BottomNavItem href="/game/playlist" icon={<BsStack size={24} />} text="Playlist Quiz" />
      <BottomNavItem href="/settings" icon={<FaCog size={24} />} text="Settings" />
    </div>
  );
};

const BottomNavItem = ({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) => {
  return (
    <Link
      href={href}
      className="flex w-fit flex-1 flex-col items-center p-2 transition-all hover:scale-105 hover:opacity-80 active:scale-90"
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
};
