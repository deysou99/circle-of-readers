import { createFileRoute } from "@tanstack/react-router";
import { NotificationsScreen } from "@/components/notifications-screen";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsRoute,
  head: () => ({
    meta: [
      { title: "Notifications — Circle" },
      { name: "description", content: "Your Circle notifications." },
      { property: "og:title", content: "Notifications — Circle" },
      { property: "og:description", content: "Your Circle notifications." },
    ],
  }),
});

function NotificationsRoute() {
  return <NotificationsScreen />;
}
