import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  completeOnboarding,
  getOnboardingState,
  saveReaderStage,
} from "@/lib/onboarding.functions";
import {
  AFTER_BOOK_OPTIONS,
  BELONGING_OPTIONS,
  CONVERSATION_OPTIONS,
  CURIOSITY_OPTIONS,
  EMPTY_ANSWERS,
  INTERRUPTION_OPTIONS,
  LOCATION_OPTIONS,
  type Personality,
  type ReaderAnswers,
} from "@/lib/reader-onboarding";
import { BasicProfileStep } from "@/components/onboarding/basic-profile-step";
import {
  CardGroup,
  ChipGroup,
  SelectionHint,
  StageHeader,
  StageProgress,
} from "@/components/onboarding/reader-stages";

const TOTAL_STAGES = 4;

export function OnboardingScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchState = useServerFn(getOnboardingState);
  const persistStage = useServerFn(saveReaderStage);
  const finish = useServerFn(completeOnboarding);

  const stateQuery = useQuery({
    queryKey: ["onboarding-state"],
    queryFn: () => fetchState({}),
    staleTime: 0,
  });

  const [phase, setPhase] = useState<"loading" | "profile" | "reader" | "reveal">("loading");
  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState<ReaderAnswers>(EMPTY_ANSWERS);
  const [personality, setPersonality] = useState<Personality | null>(null);

  const data = stateQuery.data;

  useEffect(() => {
    if (!data) return;
    if (data.stage === "done") {
      navigate({ to: "/home" });
      return;
    }
    if (data.reader) {
      setAnswers({
        curiosity_preferences: data.reader.curiosity_preferences ?? [],
        reading_locations: data.reader.reading_locations ?? [],
        reading_interruptions: data.reader.reading_interruptions ?? [],
        post_book_behaviour: data.reader.post_book_behaviour ?? [],
        conversation_style: data.reader.conversation_style ?? [],
        community_motivations: data.reader.community_motivations ?? [],
      });
    }
    const resume = Math.min(Math.max((data.profile?.onboarding_step ?? 1) - 1, 0), TOTAL_STAGES - 1);
    setStage(resume);
    setPhase(data.stage === "profile" ? "profile" : "reader");
  }, [data, navigate]);

  const stageMutation = useMutation({
    mutationFn: (input: { step: number; answers: Partial<ReaderAnswers> }) => persistStage({ data: input }),
    onError: (e: Error) => toast.error(e.message),
  });

  const finishMutation = useMutation({
    mutationFn: () => finish({ data: { answers } }),
    onSuccess: (result) => {
      setPersonality(result.personality);
      setPhase("reveal");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-state"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function set<K extends keyof ReaderAnswers>(key: K, value: string[]) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  const canContinue = useMemo(() => {
    if (stage === 0) return answers.curiosity_preferences.length > 0;
    if (stage === 1) return answers.reading_locations.length > 0 && answers.reading_interruptions.length > 0;
    if (stage === 2) return answers.post_book_behaviour.length > 0 && answers.conversation_style.length > 0;
    return answers.community_motivations.length > 0;
  }, [stage, answers]);

  function goNext() {
    stageMutation.mutate({ step: stage + 2, answers });
    if (stage === TOTAL_STAGES - 1) {
      finishMutation.mutate();
    } else {
      setStage((s) => s + 1);
    }
  }

  if (phase === "loading" || stateQuery.isLoading) {
    return (
      <div className="phone-shell flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (phase === "profile" && data) {
    return (
      <div className="phone-shell mx-auto min-h-screen max-w-md bg-paper">
        <BasicProfileStep
          identity={data.identity}
          profile={data.profile as never}
          isGoogle={!!data.identity.avatarUrl || !!data.identity.email}
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            setPhase("reader");
            setStage(0);
          }}
        />
      </div>
    );
  }

  if (phase === "reveal" && personality) {
    return <PersonalityReveal personality={personality} onEnter={() => navigate({ to: "/home" })} />;
  }

  return (
    <div className="phone-shell mx-auto flex min-h-screen max-w-md flex-col bg-paper px-6 pt-safe-top">
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (stage === 0 ? setPhase("profile") : setStage((s) => s - 1))}
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <StageProgress step={stage} total={TOTAL_STAGES} />
      </div>

      <div key={stage} className="mt-8 flex-1 animate-in fade-in slide-in-from-right-2 duration-300">
        {stage === 0 && (
          <>
            <StageHeader
              title="What makes you curious?"
              copy="Some people chase stories. Some chase ideas. Some accidentally fall down a rabbit hole at 2 AM."
              question="What could keep you reading long after you should have gone to sleep?"
            />
            <div className="mt-6 space-y-3">
              <ChipGroup
                options={CURIOSITY_OPTIONS}
                value={answers.curiosity_preferences}
                max={5}
                onChange={(v) => set("curiosity_preferences", v)}
              />
              <SelectionHint count={answers.curiosity_preferences.length} max={5} />
            </div>
          </>
        )}

        {stage === 1 && (
          <>
            <StageHeader
              title="Where does your brain like to wander?"
              copy="There isn't really a right way to read."
              question="It's 8 PM. You have two free hours. Where are you?"
            />
            <div className="mt-5 space-y-3">
              <CardGroup
                options={LOCATION_OPTIONS}
                value={answers.reading_locations}
                max={2}
                onChange={(v) => set("reading_locations", v)}
              />
              <SelectionHint count={answers.reading_locations.length} max={2} />
            </div>
            <div className="mt-9 border-t border-border pt-7">
              <p className="text-base font-medium text-ink">What's allowed to interrupt your reading?</p>
              <div className="mt-4">
                <CardGroup
                  compact
                  options={INTERRUPTION_OPTIONS}
                  value={answers.reading_interruptions}
                  max={1}
                  onChange={(v) => set("reading_interruptions", v)}
                />
              </div>
            </div>
          </>
        )}

        {stage === 2 && (
          <>
            <StageHeader
              title="You just finished a book you loved."
              question="What happens next?"
            />
            <div className="mt-5 space-y-3">
              <CardGroup
                options={AFTER_BOOK_OPTIONS}
                value={answers.post_book_behaviour}
                max={2}
                onChange={(v) => set("post_book_behaviour", v)}
              />
              <SelectionHint count={answers.post_book_behaviour.length} max={2} />
            </div>
            <div className="mt-9 border-t border-border pt-7">
              <p className="text-base font-medium text-ink">Which conversation sounds more like you?</p>
              <div className="mt-4">
                <CardGroup
                  compact
                  options={CONVERSATION_OPTIONS}
                  value={answers.conversation_style}
                  max={1}
                  onChange={(v) => set("conversation_style", v)}
                />
              </div>
            </div>
          </>
        )}

        {stage === 3 && (
          <>
            <StageHeader
              title="Imagine you've been coming to Circle for six months."
              copy="What would make you think: &ldquo;I'm glad I found these people.&rdquo;"
            />
            <div className="mt-6 space-y-3">
              <CardGroup
                compact
                options={BELONGING_OPTIONS}
                value={answers.community_motivations}
                max={3}
                onChange={(v) => set("community_motivations", v)}
              />
              <SelectionHint count={answers.community_motivations.length} max={3} />
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-0 mt-8 bg-gradient-to-t from-paper via-paper to-transparent pb-6 pt-4 safe-bottom">
        <Button
          onClick={goNext}
          disabled={!canContinue || finishMutation.isPending}
          className="h-13 w-full rounded-xl bg-primary py-4 text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {finishMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {stage === TOTAL_STAGES - 1 ? "Finish" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function PersonalityReveal({ personality, onEnter }: { personality: Personality; onEnter: () => void }) {
  return (
    <div className="phone-shell mx-auto flex min-h-screen max-w-md flex-col bg-paper px-7 pt-safe-top">
      <div className="flex flex-1 flex-col justify-center">
        <p className="animate-in fade-in text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground duration-500">
          We think we know your type.
        </p>
        <h1
          className="mt-6 animate-in fade-in slide-in-from-bottom-2 text-[38px] leading-[1.08] font-semibold text-ink duration-500"
          style={{ fontFamily: "var(--font-heading)", animationDelay: "120ms", animationFillMode: "both" }}
        >
          {personality.name}
        </h1>
        <p
          className="mt-5 animate-in fade-in slide-in-from-bottom-2 text-[17px] leading-relaxed text-muted-foreground duration-500"
          style={{ animationDelay: "260ms", animationFillMode: "both" }}
        >
          {personality.description}
        </p>
        <div className="mt-8 h-px w-16 bg-border" />
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          We'll use this to shape the circles, books and people we put in front of you. It can change as you read.
        </p>
      </div>
      <div className="pb-10 safe-bottom">
        <Button
          onClick={onEnter}
          className="h-13 w-full rounded-xl bg-ink py-4 text-base font-medium text-paper hover:bg-ink/90"
        >
          Enter Circle
        </Button>
      </div>
    </div>
  );
}
