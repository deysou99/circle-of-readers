import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getConversations, getMyUpcomingEvents, getNotificationPreferences, savePushSubscription } from "@/lib/social.functions";

type Prefs = { push_enabled?: boolean; direct_messages?: boolean; group_messages?: boolean; event_reminders?: boolean } | null | undefined;

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

/** Registers the browser as a push target so alerts can be delivered to this device. */
export async function registerPushDevice(save: (args: { data: { endpoint: string; p256dh?: string | null; auth?: string | null; userAgent?: string | null } }) => Promise<unknown>) {
  if (typeof window === "undefined") return false;
  const permission = await requestPushPermission();
  if (permission !== "granted") return false;
  const endpoint = `local:${window.location.origin}:${navigator.userAgent.slice(0, 60)}`;
  await save({ data: { endpoint, userAgent: navigator.userAgent.slice(0, 200) } });
  return true;
}

function notify(title: string, body: string, tag: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag, icon: "/favicon.ico" });
  } catch {
    /* Notification constructor is unavailable in some embedded webviews */
  }
}

/**
 * Delivers RSVP reminders and new-message alerts as system notifications,
 * gated by the reader's saved notification preferences.
 */
export function usePushAlerts() {
  const fetchPrefs = useServerFn(getNotificationPreferences);
  const fetchEvents = useServerFn(getMyUpcomingEvents);
  const fetchConversations = useServerFn(getConversations);
  const savePush = useServerFn(savePushSubscription);
  const seenMessages = useRef(new Set<string>());
  const firedReminders = useRef(new Set<string>());
  const primed = useRef(false);

  const { data: prefs } = useQuery({ queryKey: ["notification-preferences"], queryFn: () => fetchPrefs(), staleTime: 60_000 });
  const pushOn = Boolean((prefs as Prefs)?.push_enabled);

  useEffect(() => {
    if (!pushOn || typeof window === "undefined") return;
    void registerPushDevice(savePush);
  }, [pushOn, savePush]);

  const { data: events } = useQuery({
    queryKey: ["push-upcoming-events"],
    queryFn: () => fetchEvents(),
    enabled: pushOn,
    refetchInterval: 60_000,
  });

  const { data: conversations } = useQuery({
    queryKey: ["push-conversations"],
    queryFn: () => fetchConversations(),
    enabled: pushOn,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!pushOn || !(prefs as Prefs)?.event_reminders) return;
    for (const e of (events ?? []) as { id: string; title: string; starts_at: string; myRsvp?: { status?: string; reminderEnabled?: boolean; reminderMinutes?: number } | null }[]) {
      const rsvp = e.myRsvp;
      if (!rsvp || rsvp.status === "not_going" || rsvp.reminderEnabled === false) continue;
      const lead = (rsvp.reminderMinutes ?? 60) * 60 * 1000;
      const untilStart = new Date(e.starts_at).getTime() - Date.now();
      if (untilStart > 0 && untilStart <= lead && !firedReminders.current.has(e.id)) {
        firedReminders.current.add(e.id);
        notify("Discussion coming up", `${e.title} starts soon.`, `event-${e.id}`);
      }
    }
  }, [events, pushOn, prefs]);

  useEffect(() => {
    if (!pushOn) return;
    const list = (conversations ?? []) as { id: string; isGroup?: boolean; title?: string | null; lastMessage?: { id: string; content: string } | null; unread?: number }[];
    for (const c of list) {
      const last = c.lastMessage;
      if (!last) continue;
      if (!primed.current) {
        seenMessages.current.add(last.id);
        continue;
      }
      if (seenMessages.current.has(last.id)) continue;
      seenMessages.current.add(last.id);
      if (!c.unread) continue;
      const allowed = c.isGroup ? (prefs as Prefs)?.group_messages : (prefs as Prefs)?.direct_messages;
      if (!allowed) continue;
      notify(c.title ?? "New message", last.content.slice(0, 120), `conversation-${c.id}`);
    }
    primed.current = true;
  }, [conversations, pushOn, prefs]);
}
