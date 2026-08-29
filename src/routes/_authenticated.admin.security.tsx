import { createFileRoute } from "@tanstack/react-router";
import { AdminSecurityScreen } from "@/components/admin-security-screen";

export const Route = createFileRoute("/_authenticated/admin/security")({
  component: AdminSecurityRoute,
  head: () => ({
    meta: [
      { title: "Security & access — Circle admin" },
      {
        name: "description",
        content: "Admin view of Circle security alerts and who viewed circle membership rosters.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Security & access — Circle admin" },
      {
        property: "og:description",
        content: "Admin view of Circle security alerts and who viewed circle membership rosters.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AdminSecurityRoute() {
  return <AdminSecurityScreen />;
}
