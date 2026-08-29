import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, MapPin, Bell, BellOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createClubEvent, getClubEvents, setEventRsvp } from "@/lib/social.functions";
import { toast } from "sonner";

const STATUSES = [
  { value: "going", label: "Going" },
  { value: "maybe", label: "Maybe" },
  { value: "not_going", label: "Can't go" },
] as const;

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ClubEvents({ clubId, canCreate }: { clubId: string; canCreate: boolean }) {
  const fetchEvents = useServerFn(getClubEvents);
  const rsvp = useServerFn(setEventRsvp);
  const create = useServerFn(createClubEvent);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", startsAt: "", location: "" });

  const { data: events, isLoading } = useQuery({
    queryKey: ["club-events", clubId],
    queryFn: () => fetchEvents({ data: { clubId } }),
  });

  const rsvpMutation = useMutation({
    mutationFn: (vars: { eventId: string; status: "going" | "maybe" | "not_going"; reminderEnabled?: boolean; reminderMinutes?: number }) =>
      rsvp({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["club-events", clubId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          clubId,
          title: form.title,
          description: form.description || null,
          startsAt: form.startsAt,
          location: form.location || null,
        },
      }),
    onSuccess: () => {
      toast.success("Discussion scheduled");
      setOpen(false);
      setForm({ title: "", description: "", startsAt: "", location: "" });
      queryClient.invalidateQueries({ queryKey: ["club-events", clubId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="px-4 pt-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming Discussions</p>
        {canCreate && (
          <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs font-medium text-primary">
            <Plus size={14} /> Schedule
          </button>
        )}
      </div>

      {isLoading && <p className="mt-2 text-sm text-muted-foreground">Loading events…</p>}
      {!isLoading && (events ?? []).length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">No discussions scheduled yet.</p>
      )}

      <div className="mt-3 space-y-3">
        {(events ?? []).map((e) => {
          const status = e.myRsvp?.status ?? null;
          const reminderOn = e.myRsvp?.reminderEnabled ?? true;
          return (
            <div key={e.id} className="rounded-2xl border border-border bg-parchment p-4">
              <p className="text-sm font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>{e.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarDays size={13} /> {formatWhen(e.starts_at)}</span>
                {e.location && <span className="flex items-center gap-1"><MapPin size={13} /> {e.location}</span>}
                <span>{e.goingCount} going</span>
              </div>
              {e.description && <p className="mt-2 text-sm text-ink">{e.description}</p>}

              <div className="mt-3 flex gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => rsvpMutation.mutate({ eventId: e.id, status: s.value, reminderEnabled: reminderOn })}
                    className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                      status === s.value ? "bg-primary text-primary-foreground" : "border border-border bg-paper text-ink"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {status && status !== "not_going" && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-paper px-3 py-2">
                  <span className="flex items-center gap-2 text-xs text-ink">
                    {reminderOn ? <Bell size={14} className="text-primary" /> : <BellOff size={14} className="text-muted-foreground" />}
                    Remind me an hour before
                  </span>
                  <Switch
                    checked={reminderOn}
                    onCheckedChange={(checked) =>
                      rsvpMutation.mutate({ eventId: e.id, status, reminderEnabled: checked, reminderMinutes: 60 })
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl bg-paper">
          <SheetHeader>
            <SheetTitle style={{ fontFamily: "var(--font-heading)" }}>Schedule a discussion</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 pt-4">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11 rounded-xl" />
            <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="h-11 rounded-xl" />
            <Input placeholder="Location or link (optional)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-11 rounded-xl" />
            <Textarea placeholder="What will you discuss?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-24 rounded-xl" />
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.title.trim() || !form.startsAt}
              className="h-11 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending ? "Scheduling…" : "Schedule discussion"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
