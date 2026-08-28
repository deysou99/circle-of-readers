import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ---------------------------------- profile --------------------------------- */

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const [{ count: followers }, { count: following }, { count: finished }, { count: clubs }] =
      await Promise.all([
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
        supabase
          .from("user_books")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "finished"),
        supabase.from("club_memberships").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);

    return {
      profile: data,
      stats: {
        followers: followers ?? 0,
        following: following ?? 0,
        booksRead: finished ?? 0,
        clubs: clubs ?? 0,
      },
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    displayName?: string;
    username?: string;
    bio?: string;
    favoriteGenres?: string[];
    readingPace?: string;
    readingGoal?: number;
    onboarded?: boolean;
  }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.displayName !== undefined) patch['display_name'] = data.displayName;
    if (data.username) patch['username'] = data.username.replace(/^@/, "");
    if (data.bio !== undefined) patch['bio'] = data.bio;
    if (data.favoriteGenres) patch['favorite_genres'] = data.favoriteGenres;
    if (data.readingPace !== undefined) patch['reading_pace'] = data.readingPace;
    if (data.readingGoal !== undefined) patch['reading_goal'] = data.readingGoal;
    if (data.onboarded !== undefined) patch['onboarded'] = data.onboarded;

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("profiles").update(patch).eq("user_id", userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("profiles").insert({
        user_id: userId,
        username: (data.username || `reader_${userId.slice(0, 6)}`).replace(/^@/, ""),
        ...patch,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const getReader = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", data.userId)
      .maybeSingle();

    const [{ count: followers }, { count: following }, { data: isFollowing }, { data: posts }] =
      await Promise.all([
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", data.userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", data.userId),
        supabase
          .from("follows")
          .select("id")
          .eq("follower_id", userId)
          .eq("following_id", data.userId)
          .maybeSingle(),
        supabase
          .from("posts")
          .select("id, content, created_at, likes_count, comments_count")
          .eq("user_id", data.userId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    return {
      profile,
      followers: followers ?? 0,
      following: following ?? 0,
      isFollowing: !!isFollowing,
      posts: posts ?? [],
    };
  });

export const toggleFollow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("following_id", data.userId)
      .maybeSingle();
    if (existing) {
      await supabase.from("follows").delete().eq("id", existing.id);
      return { following: false };
    }
    await supabase.from("follows").insert({ follower_id: userId, following_id: data.userId });
    return { following: true };
  });

/* ----------------------------------- feed ---------------------------------- */

export const getFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: posts } = await supabase
      .from("posts")
      .select("*, books(id, title, author, cover_url), clubs(id, name)")
      .order("created_at", { ascending: false })
      .limit(50);

    const list = posts ?? [];
    const authorIds = [...new Set(list.map((p) => p.user_id))];
    const [{ data: authors }, { data: likes }] = await Promise.all([
      authorIds.length
        ? supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", authorIds)
        : Promise.resolve({ data: [] as never[] }),
      supabase.from("post_likes").select("post_id").eq("user_id", userId),
    ]);

    const authorMap = new Map((authors ?? []).map((a) => [a.user_id, a]));
    const likedIds = new Set((likes ?? []).map((l) => l.post_id));

    return list.map((p) => ({
      ...p,
      liked: likedIds.has(p.id),
      author: authorMap.get(p.user_id) ?? null,
    }));
  });

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { content: string; bookId?: string | null; clubId?: string | null; rating?: number | null }) => {
    if (!input.content?.trim()) throw new Error("Write something first");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        content: data.content.trim(),
        book_id: data.bookId ?? null,
        club_id: data.clubId ?? null,
        rating: data.rating ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return post;
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { postId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", data.postId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      await supabase.from("post_likes").delete().eq("id", existing.id);
      return { liked: false };
    }
    await supabase.from("post_likes").insert({ post_id: data.postId, user_id: userId });
    return { liked: true };
  });

export const getPostDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { postId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: post } = await supabase
      .from("posts")
      .select("*, books(id, title, author, cover_url), clubs(id, name)")
      .eq("id", data.postId)
      .maybeSingle();
    if (!post) return null;

    const [{ data: comments }, { data: like }] = await Promise.all([
      supabase
        .from("comments")
        .select("id, content, created_at, user_id")
        .eq("post_id", data.postId)
        .order("created_at", { ascending: true }),
      supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", data.postId)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const ids = [...new Set([post.user_id, ...(comments ?? []).map((c) => c.user_id)])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", ids);
    const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    return {
      post: { ...post, author: map.get(post.user_id) ?? null, liked: !!like },
      comments: (comments ?? []).map((c) => ({ ...c, author: map.get(c.user_id) ?? null })),
    };
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { postId: string; content: string }) => {
    if (!input.content?.trim()) throw new Error("Comment cannot be empty");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("comments")
      .insert({ post_id: data.postId, user_id: userId, content: data.content.trim() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----------------------------------- books ---------------------------------- */

export const getBooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: books }, { data: shelf }, { data: profile }] = await Promise.all([
      supabase.from("books").select("*").order("title"),
      supabase.from("user_books").select("*").eq("user_id", userId),
      supabase.from("profiles").select("reading_goal").eq("user_id", userId).maybeSingle(),
    ]);
    return {
      books: books ?? [],
      shelf: shelf ?? [],
      readingGoal: profile?.reading_goal ?? 30,
    };
  });

export const getBookDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: book } = await supabase.from("books").select("*").eq("id", data.bookId).maybeSingle();
    if (!book) return null;

    const [{ data: entry }, { data: posts }] = await Promise.all([
      supabase
        .from("user_books")
        .select("*")
        .eq("user_id", userId)
        .eq("book_id", data.bookId)
        .maybeSingle(),
      supabase
        .from("posts")
        .select("id, content, rating, created_at, user_id")
        .eq("book_id", data.bookId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const ids = [...new Set((posts ?? []).map((p) => p.user_id))];
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", ids)
      : { data: [] as never[] };
    const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    return {
      book,
      shelfEntry: entry,
      reviews: (posts ?? []).map((p) => ({ ...p, author: map.get(p.user_id) ?? null })),
    };
  });

export const setShelfStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookId: string; status: "want" | "reading" | "finished" | null; progress?: number }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.status === null) {
      await supabase.from("user_books").delete().eq("user_id", userId).eq("book_id", data.bookId);
      return { status: null };
    }
    const { error } = await supabase.from("user_books").upsert(
      {
        user_id: userId,
        book_id: data.bookId,
        status: data.status,
        progress: data.progress ?? (data.status === "finished" ? 100 : 0),
      },
      { onConflict: "user_id,book_id" },
    );
    if (error) throw new Error(error.message);
    return { status: data.status };
  });

/* ----------------------------------- clubs ---------------------------------- */

export const getClubs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: clubs }, { data: memberships }] = await Promise.all([
      supabase.from("clubs").select("*, books(id, title, author, cover_url)").order("member_count", { ascending: false }),
      supabase.from("club_memberships").select("club_id").eq("user_id", userId),
    ]);
    const mine = new Set((memberships ?? []).map((m) => m.club_id));
    return {
      myClubs: (clubs ?? []).filter((c) => mine.has(c.id)),
      suggested: (clubs ?? []).filter((c) => !mine.has(c.id)),
    };
  });

export const getClubDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clubId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: club } = await supabase
      .from("clubs")
      .select("*, books(id, title, author, cover_url)")
      .eq("id", data.clubId)
      .maybeSingle();
    if (!club) return null;

    const [{ data: membership }, { data: posts }] = await Promise.all([
      supabase
        .from("club_memberships")
        .select("id")
        .eq("club_id", data.clubId)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("posts")
        .select("id, content, created_at, user_id, likes_count, comments_count")
        .eq("club_id", data.clubId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const ids = [...new Set((posts ?? []).map((p) => p.user_id))];
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", ids)
      : { data: [] as never[] };
    const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    return {
      club,
      isMember: !!membership,
      posts: (posts ?? []).map((p) => ({ ...p, author: map.get(p.user_id) ?? null })),
    };
  });

export const toggleClubMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clubId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("club_memberships")
      .select("id")
      .eq("club_id", data.clubId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      await supabase.from("club_memberships").delete().eq("id", existing.id);
      return { member: false };
    }
    const { error } = await supabase
      .from("club_memberships")
      .insert({ club_id: data.clubId, user_id: userId });
    if (error) throw new Error(error.message);
    return { member: true };
  });

/* --------------------------------- discover -------------------------------- */

export const searchCircle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const q = data.query.trim();
    const like = `%${q}%`;

    const [{ data: books }, { data: clubs }, { data: people }] = await Promise.all([
      q
        ? supabase.from("books").select("*").or(`title.ilike.${like},author.ilike.${like}`).limit(20)
        : supabase.from("books").select("*").order("rating", { ascending: false }).limit(20),
      q
        ? supabase.from("clubs").select("*").or(`name.ilike.${like},category.ilike.${like}`).limit(20)
        : supabase.from("clubs").select("*").order("member_count", { ascending: false }).limit(20),
      q
        ? supabase
            .from("profiles")
            .select("user_id, username, display_name, avatar_url, bio")
            .or(`username.ilike.${like},display_name.ilike.${like}`)
            .limit(20)
        : supabase.from("profiles").select("user_id, username, display_name, avatar_url, bio").limit(20),
    ]);

    return { books: books ?? [], clubs: clubs ?? [], people: people ?? [] };
  });
