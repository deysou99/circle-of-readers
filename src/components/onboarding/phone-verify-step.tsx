import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/phone-verification.functions";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

interface Props {
  phone: string;
  onBack: () => void;
  onVerified: () => void;
}

export function PhoneVerifyStep({ phone, onBack, onVerified }: Props) {
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const send = useServerFn(sendPhoneOtp);
  const verify = useServerFn(verifyPhoneOtp);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendMutation = useMutation({
    mutationFn: () => send({ data: { phone } }),
    onSuccess: (res) => {
      setSent(true);
      setCooldown(45);
      if ("code" in res && res.code) {
        setHint(`SMS delivery isn't switched on yet, so here's your code: ${res.code}`);
      } else {
        setHint(null);
        toast.success(`Code sent to ${res.phone}`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifyMutation = useMutation({
    mutationFn: () => verify({ data: { code } }),
    onSuccess: () => {
      toast.success("Phone number verified");
      onVerified();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (!sent && !sendMutation.isPending) sendMutation.mutate();
    // Fire the first code automatically when the step opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col px-6 pb-10 pt-safe-top">
      <div className="mt-5">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Step 02 — Verify your number
        </p>
        <h1
          className="mt-3 text-[30px] leading-[1.15] font-semibold text-ink"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Let's make sure that's you.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We sent a 6-digit code to <span className="text-ink">{phone}</span>.
        </p>
      </div>

      {hint && (
        <div className="mt-6 rounded-xl border border-border bg-parchment px-4 py-3 text-sm text-ink">
          {hint}
        </div>
      )}

      <div className="mt-7 space-y-2">
        <Label htmlFor="otp">Verification code</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="h-14 rounded-xl border-input bg-paper text-center text-2xl tracking-[0.4em]"
          placeholder="••••••"
        />
        <button
          type="button"
          disabled={cooldown > 0 || sendMutation.isPending}
          onClick={() => sendMutation.mutate()}
          className="pt-1 text-xs text-muted-foreground underline-offset-4 hover:underline disabled:no-underline disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Send a new code"}
        </button>
      </div>

      <div className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" />
        <span>Your number stays private. We only use it to keep your account secure.</span>
      </div>

      <div className="mt-auto pt-8 safe-bottom">
        <Button
          onClick={() => verifyMutation.mutate()}
          disabled={code.length !== 6 || verifyMutation.isPending}
          className="h-13 w-full rounded-xl bg-primary py-4 text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {verifyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Verify and continue
        </Button>
      </div>
    </div>
  );
}
