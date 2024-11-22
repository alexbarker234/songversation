import Link from "next/link";

export default function Logo() {
  let environment = "";
  if (process.env.NODE_ENV === "development") environment = "local";
  else if (process.env.NEXT_PUBLIC_ENVIRONMENT === "dev") environment = "dev";

  return (
    <div className="relative m-2 mx-auto w-fit">
      <Link href="/" className="group relative text-3xl font-bold">
        {"songversation.".split("").map((char, index) => (
          <span
            key={index}
            className="inline-block transform group-hover:animate-hop"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {char}
          </span>
        ))}
      </Link>
      {environment && (
        <span className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 text-sm font-bold">
          {environment}
        </span>
      )}
    </div>
  );
}
