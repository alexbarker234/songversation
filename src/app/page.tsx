import Link from "next/link";

export default function Home() {
  return (
    <div className="relative mx-auto flex w-11/12 max-w-5xl flex-wrap justify-center">
      <MenuTile href="/game/artist" title="🎤 Artist Quiz" description="Guess songs from your favourite artists!" />
    </div>
  );
}

function MenuTile({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="hover:bg-grey-dark m-2 h-40 w-80 rounded-xl bg-grey p-4 text-white transition-colors duration-200"
    >
      <div className="mb-2 text-2xl">{title}</div>
      <div className="text-base">{description}</div>
    </Link>
  );
}
