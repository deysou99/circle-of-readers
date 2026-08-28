import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  changePhoneNumber,
  getPhoneOtpStatus,
  sendPhoneOtp,
  verifyPhoneOtp,
} from "@/lib/phone-verification.functions";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil, ShieldCheck } from "lucide-react";

interface Props {
  phone: string;
  onBack: () => void;
  onVerified: () => void;
}

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

export function PhoneVerifyStep({ phone, onBack, onVerified }: Props) {
  const [code, setCode] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState(phone);
  const [activePhone, setActivePhone] = useState(phone);

  const send = useServerFn(sendPhoneOtp);
  const verify = useServerFn(verifyPhoneOtp);
  const changePhone = useServerFn(changePhoneNumber);
  const fetchStatus = useServerFn(getPhoneOtpStatus);

  // Server-owned session state: survives reloads with the right timers.
  const status = useQuery({
    queryKey: ["phone-otp-status"],
    queryFn: () => fetchStatus({}),
    staleTime: 0,
  });

  const bootstrapped = useRef(false);
  useEffect(() => {
    if (!status.data || bootstrapped.current) return;
    bootstrapped.current = true;
    const s = status.data;
    if (s.phone) {
      setActivePhone(s.phone);
      setPhoneDraft(s.phone);
    }
    setCooldown(s.cooldownRemaining);
    setExpiresIn(s.expiresInSeconds);
    setAttemptsLeft(s.attemptsLeft);
    if (!s.hasActiveCode && s.cooldownRemaining === 0) {
      sendMutation.mutate(s.phone || phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.data]);

  useEffect(() => {
    if (cooldown <= 0 && expiresIn <= 0) return;
    const t = setTimeout(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
      setExpiresIn((e) => (e > 0 ? e - 1 : 0));
    }, 1000);
    return () => clearTimeout(t);
  }, [cooldown, expiresIn]);

  const sendMutation = useMutation({
    mutationFn: (to: string) => send({ data: { phone: to } }),
    onSuccess: (res) => {
      setError(null);
      setCode("");
      setCooldown(res.cooldownSeconds);
      setExpiresIn(res.expiresInSeconds);
      setAttemptsLeft(res.attemptsLeft);
      setActivePhone(res.phone);
      if ("code" in res && res.code) {
        setHint(`SMS delivery isn't switched on yet, so here's your code: ${res.code}`);
      } else {
        setHint(null);
        toast.success(`Code sent to ${res.phone}`);
      }
    },
    onError: (e: Error) => setError(e.message),
  });

  const verifyMutation = useMutation({
    mutationFn: (value: string) => verify({ data: { code: value } }),
    onSuccess: () => {
      toast.success("Phone number verified");
      onVerified();
    },
    onError: (e: Error) => {
      setError(e.message);
      setCode("");
      setAttemptsLeft((a) => Math.max(0, a - 1));
    },
  });

  const changeMutation = useMutation({
    mutationFn: (value: string) => changePhone({ data: { phone: value } }),
    onSuccess: (res) => {
      setEditingPhone(false);
      setActivePhone(res.phone);
      setCooldown(0);
      sendMutation.mutate(res.phone);
      toast.success("Number updated — we've sent a new code");
    },
    onError: (e: Error) => setError(e.message),
  });

  function submit(value: string) {
    if (value.length === 6 && !verifyMutation.isPending) verifyMutation.mutate(value);
  }

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
          We sent a 6-digit code to <span className="text-ink">{activePhone}</span>.
        </p>
      </div>

      {editingPhone ? (
        <div className="mt-5 space-y-2 rounded-xl border border-border bg-parchment p-4">
          <Label htmlFor="phone-edit">Phone number</Label>
          <Input
            id="phone-edit"
            type="tel"
            value={phoneDraft}
            onChange={(e) => setPhoneDraft(e.target.value)}
            className="h-12 rounded-xl border-input bg-paper"
            placeholder="+1 555 000 1234"
          />
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => changeMutation.mutate(phoneDraft)}
              disabled={changeMutation.isPending || phoneDraft.trim().length < 8}
              className="h-10 flex-1 rounded-lg bg-primary text-primary-foreground"
            >
              {changeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save and resend
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditingPhone(false);
                setPhoneDraft(activePhone);
              }}
              className="h-10 rounded-lg border-border bg-paper text-ink"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingPhone(true)}
          className="mt-3 inline-flex w-fit items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
        >
          <Pencil size={12} /> Use a different number
        </button>
      )}

      {hint && (
        <div className="mt-6 rounded-xl border border-border bg-parchment px-4 py-3 text-sm text-ink">
          {hint}
        </div>
      )}

      <div className="mt-7 space-y-3">
        <Label htmlFor="otp">Verification code</Label>
        <InputOTP
          id="otp"
          maxLength={6}
          value={code}
          onChange={(value) => {
            setCode(value);
            setError(null);
            submit(value);
          }}
          aria-describedby="otp-status"
          aria-invalid={Boolean(error)}
        >
          <InputOTPGroup className="w-full justify-between">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} className="h-14 w-12 rounded-xl border-input bg-paper text-xl" />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {error && (
          <p role="alert" className="text-sm text-secondary">
            {error}
          </p>
        )}

        <p id="otp-status" aria-live="polite" className="text-xs text-muted-foreground">
          {expiresIn > 0
            ? `Code expires in ${formatSeconds(expiresIn)} · ${attemptsLeft} ${attemptsLeft === 1 ? "attempt" : "attempts"} left`
            : "Your code has expired — request a new one."}
        </p>

        <button
          type="button"
          disabled={cooldown > 0 || sendMutation.isPending}
          onClick={() => sendMutation.mutate(activePhone)}
          aria-live="polite"
          className="pt-1 text-xs text-muted-foreground underline-offset-4 hover:underline disabled:no-underline disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend code in ${formatSeconds(cooldown)}` : "Send a new code"}
        </button>
      </div>

      <div className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" />
        <span>Your number stays private. We only use it to keep your account secure.</span>
      </div>

      <div className="mt-auto pt-8 safe-bottom">
        <Button
          onClick={() => submit(code)}
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
