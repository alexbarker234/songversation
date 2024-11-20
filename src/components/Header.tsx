"use client";
import Link from "next/link";
import { FaCog } from "react-icons/fa";

export default function Header() {
  const text = "songversation.";

  let environment = "";
  if (process.env.NODE_ENV === "development") environment = "local";
  else if (process.env.NEXT_PUBLIC_ENVIRONMENT === "dev") environment = "dev";

  return (
    <nav className="relative flex items-center justify-center bg-primary p-1">
      <Link href="/" className="group p-2 text-3xl font-bold text-black">
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
        className="absolute right-4 text-black opacity-50 transition-all hover:rotate-90 hover:scale-110 hover:opacity-100 active:scale-90"
      >
        <FaCog size={24} />
      </Link>
    </nav>
  );
}
