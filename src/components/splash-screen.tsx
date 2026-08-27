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
      <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
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
