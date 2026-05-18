"use client";

import "@/lib/fontawesome";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { gsap } from "gsap";
import { TransitionRouter } from "next-transition-router";
import { useState } from "react";

export default function Providers({ children }: React.PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <TransitionRouter
      auto={true}
      leave={(next, from, to) => {
        console.log("leave", { from, to });

        if (from === to) return next();

        const tween = gsap.fromTo(
          "main",
          { autoAlpha: 1, transform: "translateX(0)" },
          { autoAlpha: 0, transform: "translateX(10px)", onComplete: next, duration: 0.15 }
        );
        return () => tween.kill();
      }}
      enter={(next) => {
        const tween = gsap.fromTo(
          "main",
          { autoAlpha: 0, transform: "translateX(-10px)" },
          { autoAlpha: 1, transform: "translateX(0)", onComplete: next, duration: 0.15 }
        );
        return () => tween.kill();
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TransitionRouter>
  );
}
