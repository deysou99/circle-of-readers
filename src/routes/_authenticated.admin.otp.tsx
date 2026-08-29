import { createFileRoute } from "@tanstack/react-router";
import { AdminOtpScreen } from "@/components/admin-otp-screen";

export const Route = createFileRoute("/_authenticated/admin/otp")({
  component: AdminOtpRoute,
  head: () => ({
    meta: [
      { title: "OTP & SMS incidents — Circle admin" },
      {
        name: "description",
        content: "Admin view of verification failures, SMS fallbacks and phone changes in Circle.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "OTP & SMS incidents — Circle admin" },
      {
        property: "og:description",
        content: "Admin view of verification failures, SMS fallbacks and phone changes in Circle.",
      },
    ],
  }),
});

function AdminOtpRoute() {
  return <AdminOtpScreen />;
}
