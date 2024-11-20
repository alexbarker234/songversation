import Button from "@/components/Button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">Sorry, this page doesn&apos;t exist</h2>
      <Link href="/">
        <Button variant="green"> Return Home</Button>
      </Link>
    </div>
  );
}
