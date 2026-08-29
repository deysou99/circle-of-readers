import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldAlert, ShieldCheck, Eye } from "lucide-react";
import { getIsAdmin } from "@/lib/admin.functions";
import { acknowledgeSecurityAlert, listRosterAccessLog, listSecurityAlerts } from "@/lib/security.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function AdminSecurityScreen() {
  const isAdminFn = useServerFn(getIsAdmin);
  const alertsFn = useServerFn(listSecurityAlerts);
  const logFn = useServerFn(listRosterAccessLog);
  const ackFn = useServerFn(acknowledgeSecurityAlert);
  const queryClient = useQueryClient();

  const admin = useQuery({ queryKey: ["is-admin"], queryFn: () => isAdminFn({}) });
  const enabled = admin.data?.isAdmin === true;

  const alerts = useQuery({ queryKey: ["security-alerts"], queryFn: () => alertsFn({}), enabled });
  const log = useQuery({ queryKey: ["roster-access-log"], queryFn: () => logFn({ data: { limit: 200 } }), enabled });

  const ack = useMutation({
    mutationFn: (id: string) => ackFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Alert acknowledged");
      void queryClient.invalidateQueries({ queryKey: ["security-alerts"] });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't acknowledge that alert"),
  });

  if (admin.isLoading) return <p className="p-6 text-sm text-muted-foreground">Checking your access…</p>;

  if (!enabled) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page shows security alerts and roster access history, and needs the admin role.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Admin</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink" style={{ fontFamily: "var(--font-heading)" }}>
        Security &amp; access
      </h1>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-parchment p-3">
          <p className="text-xs text-muted-foreground">Open alerts</p>
          <p className="mt-1 text-xl font-semibold text-ink">{alerts.data?.open ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-parchment p-3">
          <p className="text-xs text-muted-foreground">Recurring violations</p>
          <p className="mt-1 text-xl font-semibold text-ink">{alerts.data?.recurring ?? 0}</p>
        </div>
      </div>

      <h2 className="mt-8 flex items-center gap-2 text-sm font-semibold text-ink">
        <ShieldAlert size={16} /> Policy violation alerts
      </h2>
      {alerts.isLoading && <p className="mt-3 text-sm text-muted-foreground">Loading alerts…</p>}
      {alerts.isError && (
        <p className="mt-3 text-sm text-secondary">Couldn't load alerts. <button className="underline" onClick={() => void alerts.refetch()}>Retry</button></p>
      )}
      {!alerts.isLoading && !alerts.isError && (alerts.data?.alerts.length ?? 0) === 0 && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck size={16} /> No alerts recorded. Scans are clean.
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {(alerts.data?.alerts ?? []).map((a) => (
          <li key={a.id} className="rounded-2xl border border-border bg-parchment p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{a.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {a.scanner} · {a.level} · seen {a.occurrences}× · last {when(a.lastSeenAt)}
                </p>
                {a.detail && <p className="mt-1 text-xs text-ink">{a.detail}</p>}
              </div>
              {a.status === "open" ? (
                <Button size="sm" variant="outline" className="h-8 shrink-0 rounded-full text-xs" onClick={() => ack.mutate(a.id)}>
                  Acknowledge
                </Button>
              ) : (
                <span className="shrink-0 text-xs text-muted-foreground">Acknowledged</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 flex items-center gap-2 text-sm font-semibold text-ink">
        <Eye size={16} /> Roster access log
      </h2>
      {log.isLoading && <p className="mt-3 text-sm text-muted-foreground">Loading access history…</p>}
      {!log.isLoading && (log.data?.entries.length ?? 0) === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">No roster views recorded yet.</p>
      )}
      <ul className="mt-3 space-y-2">
        {(log.data?.entries ?? []).map((e) => (
          <li key={e.id} className="rounded-2xl border border-border bg-parchment p-3">
            <p className="text-sm text-ink">
              {e.viewerName} viewed {e.clubName ? `${e.clubName} members` : e.scope.replace("_", " ")}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{e.rows} rows · {when(e.at)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
