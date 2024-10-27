import Nav from "@/components/Header";
import type { Metadata } from "next";
import { FaGithub } from "react-icons/fa";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Songversation",
  description: "A Spotify lyric guessing game"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Providers>
        <body className="flex h-screen flex-col bg-zinc-950 text-white">
          <Nav />
          {children}
          <a
            className="absolute bottom-0 right-0 m-2 opacity-50 transition-opacity hover:opacity-100"
            href="https://github.com/alexbarker234/songversation"
            target="_blank"
            rel="noreferrer"
          >
            <FaGithub size={30} />
          </a>
        </body>
      </Providers>
    </html>
  );
}
