import "./globals.scss";
import type { Metadata } from "next";
import Nav from "./nav";

export const metadata: Metadata = {
    title: "Songversation",
    description: "A Spotify lyric guessing game"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <Nav />
                {children}
            </body>
        </html>
    );
}
