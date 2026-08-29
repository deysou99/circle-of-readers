import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* --------------------------- roster access audit --------------------------- */

/** Records that the signed-in reader opened a circle's member roster. */
export const logRosterAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clubId?: string | null; scope?: string; rows?: number; context?: string }) => ({
    clubId: input.clubId ?? null,
    scope: (input.scope ?? "club_roster").slice(0, 40),
    rows: Math.max(0, Math.floor(input.rows ?? 0)),
    context: input.context ? input.context.slice(0, 120) : null,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("club_roster_access_log").insert({
      viewer_id: userId,
      club_id: data.clubId,
      scope: data.scope,
      rows_returned: data.rows,
      context: data.context,
    });
    if (error) return { logged: false };
    return { logged: true };
  });

async function assertAdmin(supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> }, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Forbidden");
}

export type RosterAccessRow = {
  id: string;
  viewerId: string;
  viewerName: string;
  clubId: string | null;
  clubName: string | null;
  scope: string;
  rows: number;
  at: string;
};

/** Admin-only feed of who viewed which membership roster and when. */
export const listRosterAccessLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number } | undefined) => ({ limit: Math.min(input?.limit ?? 200, 500) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase as never, userId);

    const { data: rows, error } = await supabase
      .from("club_roster_access_log")
      .select("id, viewer_id, club_id, scope, rows_returned, created_at, clubs(name)")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error("Couldn't load the access log.");

    const viewerIds = [...new Set((rows ?? []).map((r) => r.viewer_id))];
    const names = new Map<string, string>();
    if (viewerIds.length) {
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("user_id, username, display_name")
        .in("user_id", viewerIds);
      for (const p of (profiles ?? []) as Array<{ user_id: string; username: string; display_name: string | null }>) {
        names.set(p.user_id, p.display_name ?? p.username);
      }
    }

    const entries: RosterAccessRow[] = (rows ?? []).map((r) => ({
      id: r.id,
      viewerId: r.viewer_id,
      viewerName: names.get(r.viewer_id) ?? "Unknown reader",
      clubId: r.club_id,
      clubName: (r as { clubs?: { name: string } | null }).clubs?.name ?? null,
      scope: r.scope,
      rows: r.rows_returned,
      at: r.created_at,
    }));

    return { entries };
  });

/* ------------------------------ security alerts ---------------------------- */

export type SecurityAlertRow = {
  id: string;
  findingId: string;
  scanner: string;
  title: string;
  level: string;
  detail: string | null;
  status: string;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
  acknowledgedAt: string | null;
};

/** Admin-only list of policy-violation alerts raised by security scans. */
export const listSecurityAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase as never, userId);

    const { data, error } = await supabase
      .from("security_alerts")
      .select("*")
      .order("last_seen_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("Couldn't load security alerts.");

    const alerts: SecurityAlertRow[] = (data ?? []).map((a) => ({
      id: a.id,
      findingId: a.finding_id,
      scanner: a.scanner,
      title: a.title,
      level: a.level,
      detail: a.detail,
      status: a.status,
      occurrences: a.occurrences,
      firstSeenAt: a.first_seen_at,
      lastSeenAt: a.last_seen_at,
      acknowledgedAt: a.acknowledged_at,
    }));

    return {
      alerts,
      open: alerts.filter((a) => a.status === "open").length,
      recurring: alerts.filter((a) => a.occurrences > 1 && a.status === "open").length,
    };
  });

/** Records (or bumps) an alert for a finding detected by a security scan. */
export const recordSecurityAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { findingId: string; scanner: string; title: string; level?: string; detail?: string }) => {
    if (!input.findingId || !input.scanner || !input.title) throw new Error("Alert needs a finding, scanner and title");
    return {
      findingId: input.findingId.slice(0, 120),
      scanner: input.scanner.slice(0, 60),
      title: input.title.slice(0, 200),
      level: ["error", "warn", "info"].includes(input.level ?? "") ? input.level! : "warn",
      detail: input.detail?.slice(0, 1000) ?? null,
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase as never, userId);

    const { data: existing } = await supabase
      .from("security_alerts")
      .select("id, occurrences")
      .eq("scanner", data.scanner)
      .eq("finding_id", data.findingId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("security_alerts")
        .update({
          occurrences: existing.occurrences + 1,
          last_seen_at: new Date().toISOString(),
          status: "open",
          acknowledged_at: null,
          level: data.level,
          detail: data.detail,
          title: data.title,
        })
        .eq("id", existing.id);
      return { recorded: true, recurring: true };
    }

    const { error } = await supabase.from("security_alerts").insert({
      finding_id: data.findingId,
      scanner: data.scanner,
      title: data.title,
      level: data.level,
      detail: data.detail,
    });
    if (error) throw new Error("Couldn't record this alert.");
    return { recorded: true, recurring: false };
  });

/** Marks an alert as acknowledged so it stops showing as new. */
export const acknowledgeSecurityAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing alert");
    return { id: input.id };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase as never, userId);
    const { error } = await supabase
      .from("security_alerts")
      .update({ status: "acknowledged", acknowledged_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error("Couldn't acknowledge this alert.");
    return { ok: true };
  });
