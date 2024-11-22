import { cn } from "@/utils/cn";

export default function Loading({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto my-4 h-16 w-16", className)}>
      <span className="absolute left-0 top-0 h-1/2 w-1/4 animate-loader-bounce rounded-lg bg-primary"></span>
      <span className="absolute left-1/2 top-0 h-1/2 w-1/4 -translate-x-1/2 animate-loader-bounce rounded-lg bg-primary -animation-delay-300"></span>
      <span className="absolute right-0 top-0 h-1/2 w-1/4 animate-loader-bounce rounded-lg bg-primary -animation-delay-600"></span>
    </div>
  );
}
