import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { changePhoneNumber, getPhoneOtpStatus } from "@/lib/phone-verification.functions";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Mail, Phone } from "lucide-react";

/** Change the account email — the new address must be confirmed before access resumes. */
export function ChangeEmailCard({ currentEmail }: { currentEmail: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit() {
    setConfirmOpen(false);
    setPending(true);
    const { error } = await supabase.auth.updateUser(
      { email: email.trim() },
      { emailRedirectTo: `${window.location.origin}/verify-email` },
    );
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Confirm the link we sent to your new address");
    await supabase.auth.refreshSession();
    navigate({ to: "/verify-email", replace: true });
  }

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim() !== currentEmail;

  return (
    <div className="mt-2 space-y-3 rounded-2xl border border-border bg-parchment p-4">
      <div className="flex items-center gap-2">
        <Mail size={16} className="text-muted-foreground" />
        <p className="text-sm font-medium text-ink">Change email</p>
      </div>
      <Label htmlFor="new-email" className="text-xs text-muted-foreground">
        New email address
      </Label>
      <Input
        id="new-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="new@example.com"
        className="h-11 rounded-xl border-input bg-paper"
      />
      <p className="text-xs text-muted-foreground">
        You'll be signed out of the app until you confirm the new address.
      </p>
      <Button
        onClick={() => setConfirmOpen(true)}
        disabled={!valid || pending}
        className="h-11 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Send confirmation link
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change your email?</AlertDialogTitle>
            <AlertDialogDescription>
              We'll email a confirmation link to {email.trim()}. Circle stays locked until you open it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submit}>Send link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Change the phone number — verification restarts immediately for the new number. */
export function ChangePhoneCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchStatus = useServerFn(getPhoneOtpStatus);
  const change = useServerFn(changePhoneNumber);
  const [phone, setPhone] = useState("");

  const status = useQuery({ queryKey: ["phone-otp-status"], queryFn: () => fetchStatus({}) });

  const mutation = useMutation({
    mutationFn: () => change({ data: { phone } }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["onboarding-state"] });
      queryClient.invalidateQueries({ queryKey: ["phone-otp-status"] });
      toast.success("Verify your new number to continue");
      navigate({ to: "/onboarding" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-2 space-y-3 rounded-2xl border border-border bg-parchment p-4">
      <div className="flex items-center gap-2">
        <Phone size={16} className="text-muted-foreground" />
        <p className="text-sm font-medium text-ink">Phone number</p>
        {status.data?.phoneVerified && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-primary">
            <CheckCircle2 size={13} /> Verified
          </span>
        )}
      </div>
      {status.data?.phone && <p className="text-xs text-muted-foreground">Current: {status.data.phone}</p>}
      <Label htmlFor="new-phone" className="text-xs text-muted-foreground">
        New phone number
      </Label>
      <Input
        id="new-phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+1 555 000 1234"
        className="h-11 rounded-xl border-input bg-paper"
      />
      <p className="text-xs text-muted-foreground">
        Changing your number clears verification — you'll enter a fresh code straight away.
      </p>
      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || phone.trim().length < 8}
        variant="outline"
        className="h-11 w-full rounded-xl border-border bg-paper text-ink"
      >
        {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Update and re-verify
      </Button>
    </div>
  );
}
