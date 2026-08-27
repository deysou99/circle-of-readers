import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { READERS, CLUBS, BOOKS } from "@/lib/seed";

const GENRES = ["Fiction", "Mystery", "Sci-Fi", "Romance", "Non-fiction", "Memoir", "Design", "History"];
const PACE = ["1-2 books/month", "3-4 books/month", "5+ books/month", "When I can"];
const WHY = ["Community", "Recommendations", "Tracking", "Challenges"];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [pace, setPace] = useState("");
  const [why, setWhy] = useState<string[]>([]);

  function toggle(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  function finish() {
    navigate({ to: "/home" });
  }

  const steps = [
    <div key="welcome" className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Welcome to Circle</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Let's set up your reader profile in four quick steps so we can match you with books, clubs, and readers you'll love.
      </p>
    </div>,

    <div key="profile" className="space-y-4">
      <h2 className="text-xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Who are you?</h2>
      <div className="flex justify-center py-2">
        <Avatar className="h-20 w-20 ring-2 ring-primary ring-offset-2 ring-offset-paper">
          <AvatarImage src={READERS[0]?.avatar} />
          <AvatarFallback>YO</AvatarFallback>
        </Avatar>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name">Display name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex" className="h-12 rounded-xl border-input bg-paper" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="handle">Handle</Label>
        <Input id="handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@alexreads" className="h-12 rounded-xl border-input bg-paper" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Short bio</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What should other readers know about you?" className="min-h-[100px] rounded-xl border-input bg-paper" />
      </div>
    </div>,

    <div key="genres" className="space-y-4">
      <h2 className="text-xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>What do you love to read?</h2>
      <p className="text-sm text-muted-foreground">Pick your favorite genres so we can recommend the right circles.</p>
      <div className="flex flex-wrap gap-2">
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => toggle(genres, g, setGenres)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              genres.includes(g) ? "bg-primary text-primary-foreground" : "border border-border bg-paper text-ink hover:bg-muted"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label>Reading pace</Label>
        <div className="grid grid-cols-2 gap-2">
          {PACE.map((p) => (
            <button
              key={p}
              onClick={() => setPace(p)}
              className={`rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                pace === p ? "bg-forest text-white" : "border border-border bg-paper text-ink hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>,

    <div key="why" className="space-y-4">
      <h2 className="text-xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>What brings you to Circle?</h2>
      <p className="text-sm text-muted-foreground">Select what matters most. You can change this later.</p>
      <div className="grid grid-cols-2 gap-3">
        {WHY.map((w) => (
          <button
            key={w}
            onClick={() => toggle(why, w, setWhy)}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              why.includes(w) ? "border-primary bg-primary/5 text-ink" : "border-border bg-paper text-ink hover:bg-muted"
            }`}
          >
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${why.includes(w) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Check size={16} />
            </div>
            <p className="text-sm font-medium">{w}</p>
          </button>
        ))}
      </div>
    </div>,

    <div key="ready" className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-forest text-white shadow-lg shadow-forest/20">
        <Check size={40} />
      </div>
      <h2 className="text-2xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>You're all set</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        We found {CLUBS.length} circles and {BOOKS.length} books that match your taste. Dive in when you're ready.
      </p>
    </div>,
  ];

  return (
    <div className="phone-shell flex min-h-screen flex-col bg-paper px-6 pt-safe-top">
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? "w-6 bg-primary" : "w-2 bg-border"}`} />
          ))}
        </div>
        {step > 0 && step < steps.length - 1 && (
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} className="text-sm text-muted-foreground hover:text-ink">
            Back
          </button>
        )}
      </div>

      <div className="mt-8 flex flex-1 flex-col justify-center">
        {steps[step]}
      </div>

      <div className="mb-8 safe-bottom">
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            {step === 0 ? "Get Started" : "Continue"} <ArrowRight size={18} className="ml-2" />
          </Button>
        ) : (
          <Button onClick={finish} className="h-12 w-full rounded-xl bg-forest text-white hover:bg-forest/90">
            Start Reading <Check size={18} className="ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
