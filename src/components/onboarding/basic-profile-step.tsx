import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { saveBasicProfile } from "@/lib/onboarding.functions";
import { GoodreadsPanel, type GoodreadsState } from "@/components/goodreads-panel";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";


interface Props {
  identity: { email: string; firstName: string; lastName: string; avatarUrl: string };
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    goodreads_connected: boolean;
    goodreads_profile: string | null;
    goodreads_verified_at?: string | null;
    goodreads_last_sync_at?: string | null;
    goodreads_stats?: unknown;
  } | null;
  isGoogle: boolean;
  onDone: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d][\d\s()-]{7,17}$/;

export function BasicProfileStep({ identity, profile, isGoogle, onDone }: Props) {
  const [firstName, setFirstName] = useState(profile?.first_name ?? identity.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? identity.lastName ?? "");
  const [email, setEmail] = useState(profile?.email ?? identity.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [goodreads, setGoodreads] = useState<GoodreadsState>({
    connected: profile?.goodreads_connected ?? false,
    profileUrl: profile?.goodreads_profile ?? "",
    verifiedAt: profile?.goodreads_verified_at ?? null,
    lastSyncAt: profile?.goodreads_last_sync_at ?? null,
    stats: (profile?.goodreads_stats as GoodreadsState["stats"]) ?? null,
  });


  const emailLocked = isGoogle && !!identity.email;
  const phoneRequired = !isGoogle;

  const errors = {
    firstName: firstName.trim().length < 1 ? "First name is required" : "",
    lastName: lastName.trim().length < 1 ? "Last name is required" : "",
    email: !EMAIL_RE.test(email.trim()) ? "Enter a valid email address" : "",
    phone: phoneRequired && !PHONE_RE.test(phone.trim()) ? "Enter a valid phone number" : "",
  };
  const valid = !Object.values(errors).some(Boolean);

  const save = useServerFn(saveBasicProfile);


  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          firstName,
          lastName,
          email,
          phone,
          goodreadsConnected: goodreads.connected,
          goodreadsProfile: goodreads.profileUrl,
          ...(identity.avatarUrl ? { avatarUrl: identity.avatarUrl } : {}),
        },
      }),
    onSuccess: onDone,
    onError: (e: Error) => toast.error(e.message),
  });

  function field(key: keyof typeof errors) {
    return touched[key] && errors[key] ? (
      <p className="text-xs text-secondary">{errors[key]}</p>
    ) : null;
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pb-10 pt-safe-top">
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Step 01 — Who you are
        </p>
        <h1
          className="mt-3 text-[30px] leading-[1.15] font-semibold text-ink"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Let's set up your Circle profile.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {isGoogle
            ? "We've pulled what we can from your Google account. Change anything that isn't right."
            : "Just the essentials. The interesting questions come next."}
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first">First name</Label>
            <Input
              id="first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
              className="h-12 rounded-xl border-input bg-paper"
              placeholder="Alex"
            />
            {field("firstName")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last">Last name</Label>
            <Input
              id="last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
              className="h-12 rounded-xl border-input bg-paper"
              placeholder="Mercer"
            />
            {field("lastName")}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            value={email}
            readOnly={emailLocked}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            className={`h-12 rounded-xl border-input bg-paper ${emailLocked ? "text-muted-foreground" : ""}`}
            placeholder="you@example.com"
          />
          {emailLocked ? (
            <p className="text-xs text-muted-foreground">Signed in with this Google account.</p>
          ) : (
            field("email")
          )}
        </div>

        {phoneRequired && (
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              className="h-12 rounded-xl border-input bg-paper"
              placeholder="+1 555 0134"
            />
            {field("phone")}
          </div>
        )}
      </div>

      <div className="mt-7">
        <GoodreadsPanel
          value={goodreads}
          onChange={setGoodreads}
          subtitle={
            isGoogle
              ? "Connect your Goodreads account and we'll get to know your reading taste faster."
              : "Connect Goodreads and bring your shelves with you."
          }
        />
        <p className="mt-3 text-xs text-muted-foreground">Optional — you can do this later.</p>
      </div>

      <div className="mt-auto pt-8 safe-bottom">
        <Button
          onClick={() => {
            setTouched({ firstName: true, lastName: true, email: true, phone: true });
            if (valid) saveMutation.mutate();
          }}
          disabled={!valid || saveMutation.isPending}
          className="h-13 w-full rounded-xl bg-primary py-4 text-base font-medium text-primary-foreground transition-opacity hover:bg-primary/90 disabled:opacity-40"
        >
          {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue
        </Button>
      </div>
    </div>
  );
}
