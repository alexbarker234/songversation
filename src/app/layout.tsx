import Navigation from "@/components/Navigation";
import type { Metadata } from "next";
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
        <body className="relative flex h-screen flex-col overflow-x-hidden bg-zinc-950 text-white">
          <Navigation />
          <main className="flex min-h-0 w-full flex-grow flex-col overflow-x-hidden">{children}</main>
        </body>
      </Providers>
    </html>
  );
}
