import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Sparkles } from "lucide-react";
import { getOnboardingProgress } from "@/lib/onboarding-progress.functions";

/**
 * Shows a resume entry point whenever onboarding is unfinished, pointing at
 * the exact stage the reader dropped off on.
 */
export function ResumeOnboardingBanner() {
  const fetchProgress = useServerFn(getOnboardingProgress);
  const { data } = useQuery({
    queryKey: ["onboarding-progress"],
    queryFn: () => fetchProgress({}),
    staleTime: 30_000,
  });

  if (!data || data.complete) return null;

  return (
    <Link to="/profile/onboarding-progress" className="block px-4 pt-3">
      <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">Finish setting up your reader profile</p>
          <p className="truncate text-xs text-muted-foreground">
            {data.percent}% done · Next: {data.nextStep?.label ?? data.resumeStageLabel ?? "Continue"}
          </p>
        </div>
        <ArrowRight size={16} className="shrink-0 text-primary" />
      </div>
    </Link>
  );
}
