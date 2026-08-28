import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, BarChart3, Check, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getOnboardingProgress } from "@/lib/onboarding-progress.functions";

export function OnboardingProgressScreen() {
  const navigate = useNavigate();
  const fetchProgress = useServerFn(getOnboardingProgress);
  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-progress"],
    queryFn: () => fetchProgress({}),
    staleTime: 0,
  });

  return (
    <div className="min-h-screen bg-paper pb-10 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/profile" aria-label="Back to profile">
          <ArrowLeft size={22} className="text-ink" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>
          Your onboarding
        </h1>
        <Link to="/profile/onboarding-analytics" aria-label="Onboarding analytics">
          <BarChart3 size={20} className="text-muted-foreground" />
        </Link>
      </header>

      {isLoading || !data ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <section className="px-4 pt-6">
            <p className="text-3xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>
              {data.percent}% complete
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.completedCount} of {data.totalSteps} steps done
            </p>
            <Progress value={data.percent} className="mt-4 h-2" />
          </section>

          <section className="px-4 pt-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Steps</p>
            <ul className="mt-3 space-y-2">
              {data.steps.map((step) => (
                <li
                  key={step.key}
                  className="flex items-center gap-3 rounded-xl border border-border bg-parchment px-4 py-3"
                >
                  <span
                    className={
                      step.complete
                        ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                        : "flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground"
                    }
                  >
                    {step.complete ? <Check size={13} /> : <Circle size={9} />}
                  </span>
                  <span className="flex-1 text-sm text-ink">{step.label}</span>
                  {data.nextStep?.key === step.key && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      Next
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {data.dropOff && (
            <section className="px-4 pt-6">
              <div className="rounded-2xl border border-secondary/30 bg-secondary/5 px-4 py-3">
                <p className="text-sm font-medium text-ink">You last stepped away here</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {data.dropOff.stageKey ?? "Reader questions"} ·{" "}
                  {new Date(data.dropOff.at).toLocaleString()}
                </p>
              </div>
            </section>
          )}

          <section className="px-4 pt-8 safe-bottom">
            {data.complete ? (
              <Button
                onClick={() => navigate({ to: "/profile/reader-answers" })}
                variant="outline"
                className="h-12 w-full rounded-xl border-border text-ink"
              >
                Revisit my answers
              </Button>
            ) : (
              <Button
                onClick={() => navigate({ to: "/onboarding" })}
                className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Resume: {data.nextStep?.label ?? data.resumeStageLabel ?? "Continue"}
              </Button>
            )}
          </section>
        </>
      )}
    </div>
  );
}
