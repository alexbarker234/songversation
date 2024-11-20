"use client";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BsPersonFill, BsStack } from "react-icons/bs";
import { FaCog, FaHome } from "react-icons/fa";
export default function Header() {
  const text = "songversation.";

  let environment = "";
  if (process.env.NODE_ENV === "development") environment = "local";
  else if (process.env.NEXT_PUBLIC_ENVIRONMENT === "dev") environment = "dev";

  const pathname = usePathname();

  return (
    <>
      <nav
        className={cn(
          "group relative flex h-14 items-center justify-center overflow-hidden text-3xl font-bold text-white transition-all md:h-14 md:translate-y-0",
          {
            "h-0": pathname !== "/"
          }
        )}
      >
        <Link href="/" className="p-2">
          {text.split("").map((char, index) => (
            <span
              key={index}
              className="inline-block group-hover:animate-hop"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {char}
            </span>
          ))}
        </Link>
        {environment && (
          <span className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 text-sm font-bold text-black">
            {environment}
          </span>
        )}
        <Link
          href="/settings"
          className="right-4 hidden opacity-50 transition-all hover:rotate-90 hover:scale-110 hover:opacity-100 active:scale-90 md:absolute"
        >
          <FaCog size={24} />
        </Link>
      </nav>
      <BottomNav />
    </>
  );
}

const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-between bg-zinc-950 text-sm md:hidden">
      <BottomNavItem href="/" icon={<FaHome size={24} />} text="Home" />
      <BottomNavItem href="/game/artist" icon={<BsPersonFill size={24} />} text="Artist Quiz" />
      <BottomNavItem href="/game/playlist" icon={<BsStack size={24} />} text="Playlist Quiz" />
      <BottomNavItem href="/settings" icon={<FaCog size={24} />} text="Settings" />
    </div>
  );
};

const BottomNavItem = ({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) => {
  return (
    <Link href={href} className="flex w-fit flex-1 flex-col items-center p-2">
      {icon}
      <span>{text}</span>
    </Link>
  );
};
