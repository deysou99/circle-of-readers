import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, updateMyProfile } from "@/lib/circle.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ProfileEditScreen() {
  const fetchProfile = useServerFn(getMyProfile);
  const save = useServerFn(updateMyProfile);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });
  const profile = data?.profile;

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState("");
  const [goal, setGoal] = useState("30");

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setUsername(profile.username ?? "");
    setBio(profile.bio ?? "");
    setGenres((profile.favorite_genres ?? []).join(", "));
    setGoal(String(profile.reading_goal ?? 30));
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          displayName: displayName.trim(),
          username: username.trim(),
          bio: bio.trim(),
          favoriteGenres: genres.split(",").map((g) => g.trim()).filter(Boolean),
          readingGoal: Number(goal) || 30,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile updated");
      navigate({ to: "/profile" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-paper pb-10 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/profile" aria-label="Back to profile"><ArrowLeft size={22} className="text-ink" /></Link>
        <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Edit profile</h1>
      </header>

      <main className="space-y-5 px-4 pt-5">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-11 rounded-xl bg-parchment" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11 rounded-xl bg-parchment" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="rounded-xl bg-parchment" placeholder="What do you love reading?" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="genres">Favourite genres</Label>
          <Input id="genres" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Literary fiction, Sci-fi" className="h-11 rounded-xl bg-parchment" />
          <p className="text-xs text-muted-foreground">Separate genres with commas.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal">Yearly reading goal</Label>
          <Input id="goal" type="number" min={1} value={goal} onChange={(e) => setGoal(e.target.value)} className="h-11 rounded-xl bg-parchment" />
        </div>

        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="h-12 w-full rounded-xl">
          {mutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </main>
    </div>
  );
}
