import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, BookOpen, Users, User } from "lucide-react";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/clubs", label: "Clubs", icon: Users },
  { to: "/discover", label: "Discover", icon: Search },
  { to: "/books", label: "Books", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-paper/90 backdrop-blur-md safe-bottom">
      <div className="phone-shell grid h-[72px] grid-cols-5 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.to || pathname.startsWith(tab.to + "/");
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-ink"
              }`}
            >
              <div className={`rounded-full p-1.5 transition-colors ${active ? "bg-primary/10" : ""}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
