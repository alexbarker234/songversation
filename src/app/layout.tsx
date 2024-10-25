import Nav from "@/components/Header";
import type { Metadata } from "next";
import "./globals.css";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Songversation",
  description: "A Spotify lyric guessing game"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-screen flex-col">
        <Nav />
        {children}
      </body>
    </html>
  );
}
