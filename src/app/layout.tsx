import Nav from "@/components/Header";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Songversation",
  description: "A Spotify lyric guessing game"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-screen flex-col bg-zinc-950 text-white">
        <Nav />
        {children}
      </body>
    </html>
  );
}
