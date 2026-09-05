import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ to: "/auth" });
    }, 2200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="phone-shell flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-elevated shadow-lg shadow-ink/5">
        <img src="/src/assets/circle-logo-black.png" alt="Circle" className="h-12 w-12 object-contain" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-ink" style={{ fontFamily: "var(--font-heading)" }}>
        Circle
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">by MyFlip</p>
      <div className="mt-10 h-1 w-32 overflow-hidden rounded-full bg-border">
        <div className="h-full w-full origin-left animate-[scale-x_2.2s_ease-in-out_forwards] bg-primary" style={{ animationName: "load-bar" }} />
      </div>
      <style>{`
        @keyframes load-bar {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
