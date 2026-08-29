import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, LogOut, Bell, Lock, Moon, User, Shield, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { ChangeEmailCard, ChangePhoneCard } from "@/components/settings/account-security-cards";

export function ProfileSettingsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/profile">
          <ArrowLeft size={22} className="text-ink" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Settings</h1>
      </header>

      <section className="px-4 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</p>
        <div className="mt-2 rounded-2xl border border-border bg-parchment p-4">
          <p className="text-sm font-medium text-ink">{user?.email || "you@example.com"}</p>
          <p className="text-xs text-muted-foreground">Signed in with {user?.app_metadata?.provider || "email"}</p>
        </div>
      </section>

      <section className="px-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sign-in &amp; security</p>
        <ChangeEmailCard currentEmail={user?.email ?? ""} />
        <ChangePhoneCard />
      </section>

      <section className="px-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reader profile</p>
        <div className="mt-2 rounded-2xl border border-border bg-parchment p-2">
          <Link to="/profile/onboarding-progress" className="block">
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-3">
                <BarChart3 size={18} className="text-primary" />
                <div>
                  <span className="text-sm text-ink">Onboarding progress</span>
                  <p className="text-xs text-muted-foreground">Completed stages, drop-off point and your next best step</p>
                </div>
              </div>
              <span className="text-muted-foreground">›</span>
            </div>
          </Link>
          <Link to="/profile/reader-answers" className="block">
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-primary" />
                <div>
                  <span className="text-sm text-ink">Edit reader answers</span>
                  <p className="text-xs text-muted-foreground">Revisit the four questions and regenerate your reader personality</p>
                </div>
              </div>
              <span className="text-muted-foreground">›</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="px-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preferences</p>
        <div className="mt-2 space-y-1 rounded-2xl border border-border bg-parchment p-2">
          <Link to="/diagnostics" className="block">
            <Row icon={Bell} label="Diagnostics" />
          </Link>
          <Link to="/profile/notifications" className="block">
            <Row icon={Bell} label="Notification preferences" />
          </Link>
          <Row icon={Moon} label="Dark mode" right={<Switch />} />
          <Row icon={Lock} label="Private profile" right={<Switch />} />
        </div>
      </section>

      <section className="px-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Support</p>
        <div className="mt-2 space-y-1 rounded-2xl border border-border bg-parchment p-2">
          <Row icon={User} label="Edit profile" />
          <Row icon={Shield} label="Privacy policy" />
        </div>
      </section>

      <section className="px-4 pt-8 safe-bottom">
        <Button onClick={logout} variant="outline" className="h-12 w-full rounded-xl border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
          <LogOut size={18} className="mr-2" /> Sign out
        </Button>
      </section>
    </div>
  );
}

function Row({ icon: Icon, label, right }: { icon: React.ElementType; label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-3">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-muted-foreground" />
        <span className="text-sm text-ink">{label}</span>
      </div>
      {right || <span className="text-muted-foreground">›</span>}
    </div>
  );
}
