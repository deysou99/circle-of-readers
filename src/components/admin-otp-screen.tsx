import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getIsAdmin, listOtpIncidents } from "@/lib/admin.functions";

const LABELS: Record<string, string> = {
  sms_failed: "SMS delivery failed",
  fallback_in_app: "Fell back to in-app code",
  verify_failed: "Wrong code entered",
  verify_blocked: "Attempt limit reached",
  phone_changed: "Phone number changed",
};

export function AdminOtpScreen() {
  const isAdminFn = useServerFn(getIsAdmin);
  const incidentsFn = useServerFn(listOtpIncidents);

  const admin = useQuery({ queryKey: ["is-admin"], queryFn: () => isAdminFn({}) });
  const incidents = useQuery({
    queryKey: ["otp-incidents"],
    queryFn: () => incidentsFn({ data: { limit: 300 } }),
    enabled: admin.data?.isAdmin === true,
  });

  if (admin.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Checking your access…</p>;
  }

  if (!admin.data?.isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>
          Admins only
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page lists verification incidents across Circle and needs the admin role.
        </p>
      </div>
    );
  }

  const counts = incidents.data?.counts ?? {};

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Admin</p>
      <h1
        className="mt-1 text-2xl font-semibold tracking-tight text-ink"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        OTP &amp; SMS incidents
      </h1>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Object.keys(LABELS).map((key) => (
          <div key={key} className="rounded-2xl border border-border bg-parchment p-3">
            <p className="text-xs text-muted-foreground">{LABELS[key]}</p>
            <p className="mt-1 text-xl font-semibold text-ink">{counts[key] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {incidents.isLoading && <p className="text-sm text-muted-foreground">Loading incidents…</p>}
        {incidents.data?.incidents.length === 0 && (
          <p className="text-sm text-muted-foreground">No verification incidents recorded yet.</p>
        )}
        {incidents.data?.incidents.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border border-border bg-paper px-3 py-2 text-sm text-ink"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{LABELS[row.eventType] ?? row.eventType}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(row.at).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              user {row.userId.slice(0, 8)}… · phone ••••{row.phoneLast4 ?? "----"} · attempts{" "}
              {row.attempts}
              {row.deliveryMode ? ` · ${row.deliveryMode}` : ""}
            </p>
            {row.error && <p className="mt-1 text-xs text-secondary">{row.error}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
