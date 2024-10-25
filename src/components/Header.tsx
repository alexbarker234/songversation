"use client";
import Link from "next/link";

export default function Nav() {
  const text = "songversation.";

  return (
    <nav className="flex items-center justify-center bg-primary p-1">
      <Link href="/" className="group p-2 text-3xl font-bold text-black">
        {text.split("").map((char, index) => (
          <span
            key={index}
            className="group-hover:animate-hop inline-block"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {char}
          </span>
        ))}
      </Link>
    </nav>
  );
}
