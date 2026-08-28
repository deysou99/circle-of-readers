import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertCircle, Check, Loader2, RefreshCw, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  connectGoodreads,
  disconnectGoodreads,
  startGoodreadsConnect,
  syncGoodreads,
} from "@/lib/onboarding.functions";

export const GOODREADS_NONCE_KEY = "circle:goodreads:nonce";

export type GoodreadsState = {
  connected: boolean;
  profileUrl: string;
  verifiedAt: string | null;
  lastSyncAt: string | null;
  stats: { totalBooks?: number; averageRating?: number | null; shelfCounts?: Record<string, number> } | null;
};

export function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface Props {
  value: GoodreadsState;
  onChange?: (next: GoodreadsState) => void;
  /** Query keys to refresh after a change (profile page). */
  invalidateKeys?: string[][];
  title?: string;
  subtitle?: string;
}

export function GoodreadsPanel({ value, onChange, invalidateKeys = [], title, subtitle }: Props) {
  const qc = useQueryClient();
  const [state, setState] = useState<GoodreadsState>(value);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(value.profileUrl ?? "");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  function apply(next: GoodreadsState) {
    setState(next);
    onChange?.(next);
    for (const key of invalidateKeys) void qc.invalidateQueries({ queryKey: key });
  }

  const link = useServerFn(connectGoodreads);
  const unlink = useServerFn(disconnectGoodreads);
  const start = useServerFn(startGoodreadsConnect);
  const sync = useServerFn(syncGoodreads);

  const startMutation = useMutation({
    mutationFn: () => start({ data: { returnUrl: `${window.location.origin}/goodreads/callback` } }),
    onSuccess: (res) => {
      try {
        window.sessionStorage.setItem(GOODREADS_NONCE_KEY, res.nonce);
      } catch {
        /* private mode — callback will fall back to a friendly error */
      }
      if (res.mode === "oauth" && res.authorizeUrl) {
        window.location.href = res.authorizeUrl;
        return;
      }
      setOpen(true);
      setError("");
      if (res.message) toast.info(res.message);
    },
    onError: () => {
      setOpen(true);
      setError("We couldn't start the Goodreads connection. Paste your profile link instead.");
    },
  });

  const linkMutation = useMutation({
    mutationFn: () => link({ data: { profileUrl: url } }),
    onSuccess: (res) => {
      setUrl(res.profileUrl);
      setOpen(false);
      setError("");
      apply({ ...state, connected: true, profileUrl: res.profileUrl, verifiedAt: res.verifiedAt });
      toast.success(
        res.verified
          ? "Goodreads profile linked and verified."
          : "Goodreads profile saved — we couldn't reach it just now, so double-check it's public.",
      );
    },
    onError: (e: Error) => setError(e.message || "Something went wrong. Please try again."),
  });

  const syncMutation = useMutation({
    mutationFn: () => sync({}),
    onSuccess: (res) => {
      apply({ ...state, lastSyncAt: res.syncedAt, stats: res.summary });
      toast.success(`Synced ${res.summary.totalBooks} books from Goodreads.`);
    },
    onError: (e: Error) => toast.error(e.message || "We couldn't sync Goodreads. Please try again."),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => unlink({}),
    onSuccess: () => {
      setUrl("");
      setError("");
      setConfirmOpen(false);
      apply({ connected: false, profileUrl: "", verifiedAt: null, lastSyncAt: null, stats: null });
      toast.success("Goodreads disconnected.");
    },
    onError: (e: Error) => {
      setConfirmOpen(false);
      toast.error(e.message);
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-parchment p-5">
      <p className="text-sm font-medium text-ink">{title ?? "Already have a reading history?"}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {subtitle ?? "Connect Goodreads and bring your shelves with you."}
      </p>

      {state.connected ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-forest">
            <Check size={16} /> Goodreads connected
          </div>
          {state.profileUrl && <p className="truncate text-xs text-muted-foreground">{state.profileUrl}</p>}
          <dl className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl border border-border bg-paper p-2.5">
              <dt className="uppercase tracking-wide text-muted-foreground">Verified</dt>
              <dd className="mt-0.5 text-xs text-ink">{formatStamp(state.verifiedAt)}</dd>
            </div>
            <div className="rounded-xl border border-border bg-paper p-2.5">
              <dt className="uppercase tracking-wide text-muted-foreground">Last sync</dt>
              <dd className="mt-0.5 text-xs text-ink">
                {state.lastSyncAt ? formatStamp(state.lastSyncAt) : "Never synced"}
              </dd>
            </div>
          </dl>
          {state.stats?.totalBooks ? (
            <p className="text-xs text-muted-foreground">
              {state.stats.totalBooks} books imported
              {state.stats.averageRating ? ` · avg rating ${state.stats.averageRating}` : ""}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="h-10 flex-1 rounded-xl bg-ink text-paper hover:bg-ink/90"
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" /> Sync Goodreads
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(true)}
              disabled={disconnectMutation.isPending}
              className="h-10 rounded-xl border-border bg-paper text-muted-foreground hover:text-secondary"
            >
              <Link2Off className="mr-2 h-4 w-4" /> Disconnect
            </Button>
          </div>
        </div>
      ) : open ? (
        <div className="mt-4 space-y-2">
          <Input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            placeholder="https://goodreads.com/user/show/…"
            className="h-11 rounded-xl border-input bg-paper"
            disabled={linkMutation.isPending}
          />
          {error ? (
            <p className="flex items-start gap-1.5 text-xs text-secondary">
              <AlertCircle size={13} className="mt-px shrink-0" />
              {error}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Open Goodreads, tap your profile, and paste the link (or just your profile ID).
            </p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => linkMutation.mutate()}
              disabled={linkMutation.isPending || !url.trim()}
              className="h-10 flex-1 rounded-xl bg-ink text-paper hover:bg-ink/90 disabled:opacity-40"
            >
              {linkMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
                </>
              ) : (
                "Save link"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              disabled={linkMutation.isPending}
              className="h-10 rounded-xl text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
          className="mt-4 h-11 w-full rounded-xl border-border bg-paper text-ink hover:bg-muted"
        >
          {startMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Connect Goodreads
        </Button>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: "var(--font-heading)" }}>Disconnect Goodreads?</AlertDialogTitle>
            <AlertDialogDescription>
              We'll remove your linked profile and the reading data we synced from it. Your Circle shelves and
              reader personality stay exactly as they are — you can reconnect any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="mt-0 h-10 flex-1 rounded-xl">Keep connected</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                disconnectMutation.mutate();
              }}
              disabled={disconnectMutation.isPending}
              className="h-10 flex-1 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {disconnectMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
