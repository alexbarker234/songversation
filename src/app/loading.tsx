import { CSSProperties } from "react";

interface LoadingProp {
  style?: CSSProperties;
}

export default function Loading({ style }: LoadingProp) {
  return (
    <div className="relative mx-auto my-4 h-16 w-16" style={style}>
      <span className="animate-loader-bounce absolute left-0 top-0 h-1/2 w-1/4 rounded-lg bg-primary"></span>
      <span className="animate-loader-bounce -animation-delay-300 absolute left-1/2 top-0 h-1/2 w-1/4 -translate-x-1/2 rounded-lg bg-primary"></span>
      <span className="animate-loader-bounce -animation-delay-600 absolute right-0 top-0 h-1/2 w-1/4 rounded-lg bg-primary"></span>
    </div>
  );
}
