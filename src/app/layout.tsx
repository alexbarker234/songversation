import Header from "@/components/Header";
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Songversation",
  description: "A Spotify lyric guessing game"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="overscroll-none">
      <Providers>
        <body className="relative flex min-h-screen flex-col bg-zinc-950 text-white">
          <Header />
          {children}
        </body>
      </Providers>
    </html>
  );
}
