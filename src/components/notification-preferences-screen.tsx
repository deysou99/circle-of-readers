import { Link } from "@tanstack/react-router";
import { ArrowLeft, Heart, MessageCircle, UserPlus, Users, CalendarClock, Mail, MessagesSquare, AtSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/social.functions";
import { toast } from "sonner";

type PrefKey =
  | "likes"
  | "comments"
  | "follows"
  | "club_activity"
  | "event_reminders"
  | "direct_messages"
  | "group_messages"
  | "mentions";

const GROUPS: { title: string; rows: { key: PrefKey; label: string; description: string; icon: React.ElementType }[] }[] = [
  {
    title: "Activity",
    rows: [
      { key: "likes", label: "Likes", description: "When someone likes your post", icon: Heart },
      { key: "comments", label: "Comments", description: "Replies to your posts and reviews", icon: MessageCircle },
      { key: "follows", label: "New followers", description: "When a reader follows you", icon: UserPlus },
      { key: "mentions", label: "Mentions", description: "When you are mentioned in a discussion", icon: AtSign },
    ],
  },
  {
    title: "Circles",
    rows: [
      { key: "club_activity", label: "Circle activity", description: "New posts in circles you joined", icon: Users },
      { key: "event_reminders", label: "Event reminders", description: "Reminders before discussions you RSVP'd to", icon: CalendarClock },
    ],
  },
  {
    title: "Messages",
    rows: [
      { key: "direct_messages", label: "Direct messages", description: "Alerts for one-to-one chats", icon: Mail },
      { key: "group_messages", label: "Group chats", description: "Alerts for circle group chats", icon: MessagesSquare },
    ],
  },
];

export function NotificationPreferencesScreen() {
  const fetchPrefs = useServerFn(getNotificationPreferences);
  const updatePrefs = useServerFn(updateNotificationPreferences);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => fetchPrefs(),
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<Record<PrefKey, boolean>>) => updatePrefs({ data: patch }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["notification-preferences"], updated);
      toast.success("Notification preferences saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-paper pb-10 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/profile/settings"><ArrowLeft size={22} className="text-ink" /></Link>
        <h1 className="flex-1 text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Notifications</h1>
      </header>

      <p className="px-4 pt-4 text-sm text-muted-foreground">Choose exactly which alerts reach you. Everything else stays quiet.</p>

      {isLoading && <p className="px-4 pt-6 text-sm text-muted-foreground">Loading your preferences…</p>}

      {!isLoading && data && GROUPS.map((group) => (
        <section key={group.title} className="px-4 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</p>
          <div className="mt-2 space-y-1 rounded-2xl border border-border bg-parchment p-2">
            {group.rows.map((row) => {
              const Icon = row.icon;
              const value = Boolean((data as Record<string, unknown>)[row.key]);
              return (
                <div key={row.key} className="flex items-center justify-between gap-3 px-3 py-3">
                  <div className="flex items-start gap-3">
                    <Icon size={18} className="mt-0.5 text-primary" />
                    <div>
                      <p className="text-sm text-ink">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={value}
                    disabled={mutation.isPending}
                    onCheckedChange={(checked) => mutation.mutate({ [row.key]: checked })}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
