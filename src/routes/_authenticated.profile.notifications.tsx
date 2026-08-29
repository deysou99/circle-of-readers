import { createFileRoute } from "@tanstack/react-router";
import { NotificationPreferencesScreen } from "@/components/notification-preferences-screen";

export const Route = createFileRoute("/_authenticated/profile/notifications")({
  component: NotificationPreferencesRoute,
  head: () => ({
    meta: [
      { title: "Notification preferences — Circle" },
      { name: "description", content: "Choose which Circle activity, circle events and message alerts you receive." },
      { property: "og:title", content: "Notification preferences — Circle" },
      { property: "og:description", content: "Choose which Circle activity, circle events and message alerts you receive." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function NotificationPreferencesRoute() {
  return <NotificationPreferencesScreen />;
}
