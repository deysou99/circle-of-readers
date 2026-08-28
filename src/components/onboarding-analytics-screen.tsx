import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getOnboardingFunnel } from "@/lib/onboarding-progress.functions";

const PIE_COLORS = ["hsl(var(--primary))", "#2D4F3C", "#E83227", "#B8B2A4"];

export function OnboardingAnalyticsScreen() {
  const fetchFunnel = useServerFn(getOnboardingFunnel);
  const [signupMethod, setSignupMethod] = useState<string>("");
  const [device, setDevice] = useState<string>("");
  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-funnel", signupMethod, device],
    queryFn: () =>
      fetchFunnel({
        data: {
          ...(signupMethod ? { signupMethod } : {}),
          ...(device ? { device } : {}),
        },
      }),
    staleTime: 30_000,
  });
  const [drillStage, setDrillStage] = useState<string | null>(null);

  const selected = data?.stages.find((s) => s.key === drillStage) ?? null;
  const stageEvents = (data?.timeline ?? []).filter((e) => !drillStage || e.stageKey === drillStage);

  const exportCsv = () => {
    if (!data) return;
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines: string[] = [];
    lines.push("section,key,label,metric,value");
    Object.entries(data.totals).forEach(([k, v]) =>
      lines.push(["totals", k, k, "count", v].map(esc).join(",")),
    );
    data.stages.forEach((s) => {
      (["viewed", "completed", "back", "dropOffs", "completionRate"] as const).forEach((m) =>
        lines.push(["stages", s.key, s.label, m, s[m]].map(esc).join(",")),
      );
    });
    data.resumePoints.forEach((r) =>
      lines.push(["resumePoints", r.key, r.label, "count", r.count].map(esc).join(",")),
    );
    lines.push("");
    lines.push("section,at,eventType,stageKey,signupMethod,device");
    data.timeline.forEach((e) =>
      lines.push(
        ["events", e.at, e.eventType, e.stageKey ?? "", e.signupMethod, e.device].map(esc).join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `circle-onboarding-funnel-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-paper pb-10 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/profile/onboarding-progress" aria-label="Back to onboarding progress">
          <ArrowLeft size={22} className="text-ink" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>
          Onboarding funnel
        </h1>
      </header>

      {isLoading || !data ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 px-4 pt-5">
            <Metric label="Sessions" value={data.totals.sessions} />
            <Metric label="Starts" value={data.totals.starts} />
            <Metric label="Resumes" value={data.totals.resumes} />
            <Metric label="Completions" value={data.totals.completions} />
          </section>

          <section className="px-4 pt-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Stage completion
            </p>
            <div className="mt-3 h-56 rounded-2xl border border-border bg-parchment p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.stages}
                  onClick={(e) => {
                    const key = (e?.activePayload?.[0]?.payload as { key?: string } | undefined)?.key;
                    if (key) setDrillStage((current) => (current === key ? null : key));
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="key" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={22} />
                  <Tooltip />
                  <Bar dataKey="viewed" name="Viewed" fill="#B8B2A4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="dropOffs" name="Drop-offs" fill="#E83227" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Tap a stage to drill into its events.</p>
          </section>

          <section className="px-4 pt-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Resume points
            </p>
            <div className="mt-3 h-52 rounded-2xl border border-border bg-parchment p-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie data={data.resumePoints} dataKey="count" nameKey="label" outerRadius={70} label>
                    {data.resumePoints.map((entry, i) => (
                      <Cell key={entry.key} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="px-4 pt-7">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {selected ? `${selected.label} — events` : "Recent events"}
              </p>
              {drillStage && (
                <button
                  onClick={() => setDrillStage(null)}
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
            {selected && (
              <p className="mt-2 text-xs text-muted-foreground">
                {selected.viewed} views · {selected.completed} completions · {selected.completionRate}%
                completion · {selected.back} back steps · {selected.dropOffs} drop-offs
              </p>
            )}
            <ul className="mt-3 space-y-1.5">
              {stageEvents.length === 0 && (
                <li className="rounded-xl border border-border bg-parchment px-4 py-3 text-sm text-muted-foreground">
                  No events recorded yet.
                </li>
              )}
              {stageEvents
                .slice()
                .reverse()
                .map((e, i) => (
                  <li
                    key={`${e.at}-${i}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-parchment px-4 py-2.5"
                  >
                    <span className="text-sm text-ink">{e.eventType.replace(/_/g, " ")}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(e.at).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-parchment px-4 py-3">
      <p className="text-2xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
