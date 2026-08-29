import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ProfileLite = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

/* ------------------------- followers / following list ----------------------- */

export const getMyCircle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: followerRows }, { data: followingRows }] = await Promise.all([
      supabase.from("follows").select("follower_id, created_at").eq("following_id", userId),
      supabase.from("follows").select("following_id, created_at").eq("follower_id", userId),
    ]);

    const followerIds = (followerRows ?? []).map((r) => r.follower_id);
    const followingIds = (followingRows ?? []).map((r) => r.following_id);
    const allIds = Array.from(new Set([...followerIds, ...followingIds]));

    let profiles: ProfileLite[] = [];
    if (allIds.length) {
      const { data } = await supabase
        .from("public_profiles")
        .select("user_id, username, display_name, avatar_url, bio")
        .in("user_id", allIds);
      profiles = ((data ?? []) as Array<Partial<ProfileLite>>).map((p) => ({
        user_id: p.user_id ?? "",
        username: p.username ?? "reader",
        display_name: p.display_name ?? null,
        avatar_url: p.avatar_url ?? null,
        bio: p.bio ?? null,
      }));
    }

    const byId = new Map(profiles.map((p) => [p.user_id, p]));
    const followingSet = new Set(followingIds);

    const shape = (id: string) => {
      const p = byId.get(id);
      return {
        user_id: id,
        username: p?.username ?? "reader",
        display_name: p?.display_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        bio: p?.bio ?? null,
        isFollowing: followingSet.has(id),
      };
    };

    return {
      followers: followerIds.map(shape),
      following: followingIds.map(shape),
    };
  });

/* --------------------------------- reviews --------------------------------- */

export const getMyReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: postRows }, { data: shelfRows }] = await Promise.all([
      supabase
        .from("posts")
        .select("id, content, rating, created_at, likes_count, comments_count, book_id, books(id, title, author, cover_url)")
        .eq("user_id", userId)
        .not("rating", "is", null)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("user_books")
        .select("id, rating, updated_at, book_id, books(id, title, author, cover_url)")
        .eq("user_id", userId)
        .not("rating", "is", null)
        .order("updated_at", { ascending: false })
        .limit(50),
    ]);

    const reviewedBookIds = new Set((postRows ?? []).map((p) => p.book_id).filter(Boolean) as string[]);

    return {
      reviews: [
        ...(postRows ?? []).map((p) => ({
          id: p.id,
          kind: "post" as const,
          text: p.content,
          rating: p.rating ?? 0,
          createdAt: p.created_at,
          likes: p.likes_count ?? 0,
          comments: p.comments_count ?? 0,
          book: p.books ?? null,
        })),
        ...(shelfRows ?? [])
          .filter((s) => !reviewedBookIds.has(s.book_id))
          .map((s) => ({
            id: s.id,
            kind: "rating" as const,
            text: "",
            rating: s.rating ?? 0,
            createdAt: s.updated_at,
            likes: 0,
            comments: 0,
            book: s.books ?? null,
          })),
      ],
    };
  });

/* ---------------------------------- posts ---------------------------------- */

export const getMyPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("posts")
      .select("id, content, image_url, rating, created_at, likes_count, comments_count, books(id, title, author, cover_url), clubs(id, name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { posts: data ?? [] };
  });

/* ---------------------------------- likes ---------------------------------- */

export const getMyLikes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: likeRows }, { data: shelfRows }] = await Promise.all([
      supabase
        .from("post_likes")
        .select("id, created_at, posts(id, content, created_at, likes_count, comments_count, user_id, books(id, title, cover_url))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("user_books")
        .select("id, rating, status, books(id, title, author, cover_url)")
        .eq("user_id", userId)
        .gte("rating", 4)
        .limit(30),
    ]);

    return {
      posts: (likeRows ?? []).filter((l) => l.posts).map((l) => ({ id: l.id, post: l.posts! })),
      books: (shelfRows ?? []).filter((s) => s.books).map((s) => ({ id: s.id, rating: s.rating ?? 0, book: s.books! })),
    };
  });

/* ---------------------------- reading insights ------------------------------ */

export const getReadingInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { year?: number | null }) => ({ year: input?.year ?? null }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const year = data.year;
    const from = year ? new Date(Date.UTC(year, 0, 1)).toISOString() : null;
    const to = year ? new Date(Date.UTC(year + 1, 0, 1)).toISOString() : null;

    const inRange = (iso: string | null | undefined) => {
      if (!from || !to || !iso) return !from;
      return iso >= from && iso < to;
    };

    const [{ data: shelf }, { data: posts }, { data: memberships }, { data: profile }, { count: followers }] =
      await Promise.all([
        supabase
          .from("user_books")
          .select("id, status, rating, progress, updated_at, created_at, books(id, title, author, genre, pages, cover_url)")
          .eq("user_id", userId),
        supabase.from("posts").select("id, created_at, rating, likes_count, comments_count").eq("user_id", userId),
        supabase.from("club_memberships").select("id, joined_at").eq("user_id", userId),
        supabase.from("profiles").select("reading_goal").eq("user_id", userId).maybeSingle(),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
      ]);

    const shelfRows = shelf ?? [];
    const scopedShelf = shelfRows.filter((r) => inRange(r.updated_at));
    const finished = scopedShelf.filter((r) => r.status === "finished");
    const reading = shelfRows.filter((r) => r.status === "reading");
    const wantToRead = shelfRows.filter((r) => r.status === "want");

    const pagesRead = finished.reduce((sum, r) => sum + (r.books?.pages ?? 0), 0);
    const ratings = scopedShelf.map((r) => r.rating).filter((r): r is number => typeof r === "number");
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const genreCount = new Map<string, number>();
    for (const r of finished) {
      const g = r.books?.genre;
      if (g) genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
    }
    const topGenres = [...genreCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([genre, count]) => ({ genre, count }));

    const longest = finished
      .slice()
      .sort((a, b) => (b.books?.pages ?? 0) - (a.books?.pages ?? 0))[0];

    const scopedPosts = (posts ?? []).filter((p) => inRange(p.created_at));
    const likesReceived = scopedPosts.reduce((s, p) => s + (p.likes_count ?? 0), 0);
    const commentsReceived = scopedPosts.reduce((s, p) => s + (p.comments_count ?? 0), 0);
    const reviewsWritten = scopedPosts.filter((p) => p.rating != null).length;

    // Books finished per month (12 buckets) for the selected year, or last 12 months all-time.
    const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i, count: 0 }));
    for (const r of finished) {
      const d = new Date(r.updated_at);
      const idx = d.getUTCMonth();
      const bucket = monthly[idx];
      if (bucket) bucket.count += 1;
    }

    // Reading streak: distinct months with at least one finished book.
    const activeMonths = monthly.filter((m) => m.count > 0).length;
    let bestStreak = 0;
    let run = 0;
    for (const m of monthly) {
      run = m.count > 0 ? run + 1 : 0;
      bestStreak = Math.max(bestStreak, run);
    }

    const goal = profile?.reading_goal ?? 30;
    const scopedClubs = (memberships ?? []).filter((m) => inRange(m.joined_at));

    const firstYear = shelfRows.length
      ? Math.min(...shelfRows.map((r) => new Date(r.created_at).getUTCFullYear()))
      : new Date().getUTCFullYear();
    const currentYear = new Date().getUTCFullYear();
    const years: number[] = [];
    for (let y = currentYear; y >= Math.min(firstYear, currentYear); y--) years.push(y);

    return {
      years,
      insights: {
        booksRead: finished.length,
        pagesRead,
        avgPages: finished.length ? Math.round(pagesRead / finished.length) : 0,
        currentlyReading: reading.length,
        wantToRead: wantToRead.length,
        avgRating: Math.round(avgRating * 10) / 10,
        ratedBooks: ratings.length,
        reviewsWritten,
        postsPublished: scopedPosts.length,
        likesReceived,
        commentsReceived,
        clubsJoined: scopedClubs.length,
        followers: followers ?? 0,
        goal,
        goalPercent: Math.min(100, Math.round((finished.length / Math.max(goal, 1)) * 100)),
        activeMonths,
        bestStreak,
        avgPerMonth: Math.round((finished.length / 12) * 10) / 10,
        topGenres,
        longestBook: longest?.books ? { title: longest.books.title, pages: longest.books.pages ?? 0 } : null,
        monthly,
      },
    };
  });
