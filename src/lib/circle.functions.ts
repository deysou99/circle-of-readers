import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ---------------------------------- profile --------------------------------- */

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { readOwnProfile: readOwnProfileServer } = await import("@/lib/profile.server");
    const { supabase, userId } = context;
    const { data } = await readOwnProfileServer(userId);


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
    const patch: {
      updated_at: string;
      display_name?: string;
      username?: string;
      bio?: string;
      favorite_genres?: string[];
      reading_pace?: string;
      reading_goal?: number;
      onboarded?: boolean;
    } = { updated_at: new Date().toISOString() };
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
      .select("id, user_id, username, display_name, avatar_url, bio, created_at")
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
  .inputValidator((input: { content: string; bookId?: string | null; clubId?: string | null; rating?: number | null; imagePath?: string | null }) => {
    const content = (input.content ?? "").trim();
    if (!content) throw new Error("Write something before publishing");
    if (content.length > 2000) throw new Error("Posts are limited to 2000 characters");
    if (input.rating != null && (input.rating < 1 || input.rating > 5)) throw new Error("Rating must be between 1 and 5");
    if (input.rating != null && !input.bookId) throw new Error("Attach a book to rate it");
    return { ...input, content };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.imagePath && !data.imagePath.startsWith(`${userId}/`)) {
      throw new Error("Invalid attachment");
    }
    if (data.clubId) {
      const { data: membership } = await supabase
        .from("club_memberships")
        .select("id")
        .eq("club_id", data.clubId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!membership) throw new Error("Join the circle before posting to it");
    }
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        content: data.content,
        book_id: data.bookId ?? null,
        club_id: data.clubId ?? null,
        rating: data.rating ?? null,
        image_url: data.imagePath ?? null,
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
    const { readOwnProfile: readOwnProfileServer } = await import("@/lib/profile.server");
    const { supabase, userId } = context;
    const [{ data: books }, { data: shelf }, { data: profile }] = await Promise.all([
      supabase.from("books").select("*").order("title"),
      supabase.from("user_books").select("*").eq("user_id", userId),
      readOwnProfileServer(userId),
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

export type SearchType = "All" | "People" | "Circles" | "Books" | "Posts";

const SEARCH_TYPES: SearchType[] = ["All", "People", "Circles", "Books", "Posts"];

const PAGE_SIZE = 12;

type Key = { c: string; id: string } | null;

type SearchCursor = {
  people: Key;
  clubs: Key;
  books: Key;
  posts: Key;
  /** Ids already served by the relevance-boosted first page, never repeated. */
  boostedPeople: string[];
  boostedClubs: string[];
  page: number;
};

const emptyCursor = (): SearchCursor => ({
  people: null,
  clubs: null,
  books: null,
  posts: null,
  boostedPeople: [],
  boostedClubs: [],
  page: 0,
});

function parseCursor(raw?: string | null): SearchCursor {
  if (!raw) return emptyCursor();
  try {
    const parsed = JSON.parse(raw) as Partial<SearchCursor>;
    return {
      ...emptyCursor(),
      ...parsed,
      boostedPeople: (parsed.boostedPeople ?? []).slice(0, 200),
      boostedClubs: (parsed.boostedClubs ?? []).slice(0, 200),
      page: Math.max(0, Math.min(50, Math.floor(parsed.page ?? 0))),
    };
  } catch {
    return emptyCursor();
  }
}

/** Stable keyset ordering: created_at DESC, id DESC (both immutable). */
function keyset<T extends { order: (c: string, o: { ascending: boolean }) => T; or: (f: string) => T; limit: (n: number) => T }>(
  builder: T,
  cursor: Key,
  size: number,
) {
  let q = builder.order("created_at", { ascending: false }).order("id", { ascending: false });
  if (cursor) q = q.or(`created_at.lt.${cursor.c},and(created_at.eq.${cursor.c},id.eq.${cursor.id})`);
  return q.limit(size + 1);
}

type PersonRow = {
  id: string;
  created_at: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type ClubRow = {
  id: string;
  created_at: string;
  name: string;
  handle: string;
  description: string | null;
  category: string | null;
  avatar_url: string | null;
  is_private: boolean | null;
  member_count: number | null;
  active_book_id: string | null;
  created_by: string | null;
};

type PostSearchRow = {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  likes_count: number | null;
  comments_count: number | null;
  image_url: string | null;
  books: { id: string; title: string; author: string; cover_url: string | null } | null;
  clubs: { id: string; name: string } | null;
};

type BookRow = {
  id: string;
  created_at: string;
  title: string;
  author: string;
  cover_url: string | null;
  summary: string | null;
  genre: string | null;
  pages: number | null;
  published_year: number | null;
  rating: number | null;
};

function nextKey(rows: Array<{ id: string; created_at: string }> | null | undefined): Key {
  const last = (rows ?? [])[(rows ?? []).length - 1];
  return last ? { c: last.created_at, id: last.id } : null;
}

export const searchCircle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string; type?: string; cursor?: string | null; clubId?: string | null }) => ({
    query: (input.query ?? "").trim().slice(0, 100),
    type: (SEARCH_TYPES.includes((input.type ?? "All") as SearchType) ? input.type : "All") as SearchType,
    cursor: typeof input.cursor === "string" ? input.cursor.slice(0, 4000) : null,
    // When set, the search is scoped to one circle: its members, its books and its posts.
    clubId: typeof input.clubId === "string" && input.clubId ? input.clubId.slice(0, 64) : null,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const q = data.query;
    const like = `%${q}%`;
    const type = data.type;
    const cursor = parseCursor(data.cursor);
    const firstPage = cursor.page === 0;
    const clubScope = data.clubId;
    const want = (t: SearchType) => (clubScope && t === "Circles" ? false : type === "All" || type === t);

    const emptyRows = <T,>() => Promise.resolve({ data: [] as T[] });

    const peopleSelect = "id, created_at, user_id, username, display_name, avatar_url, bio";
    const postSelect =
      "id, created_at, content, user_id, likes_count, comments_count, image_url, books(id, title, author, cover_url), clubs(id, name)";

    /* ------- results the reader chose to hide never come back in search ------- */
    const { data: hiddenRows } = await supabase
      .from("search_hidden")
      .select("target_type, target_id")
      .eq("user_id", userId)
      .limit(500);
    const hiddenPeople = (hiddenRows ?? []).filter((h) => h.target_type === "person").map((h) => h.target_id);
    const hiddenClubs = (hiddenRows ?? []).filter((h) => h.target_type === "circle").map((h) => h.target_id);

    /* ------------------------- circle-scoped search prep ------------------------ */
    let scopeMemberIds: string[] = [];
    let scopeBookIds: string[] = [];
    if (clubScope) {
      const [{ data: members }, { data: clubPosts }, { data: clubRow }] = await Promise.all([
        supabase.from("club_memberships").select("user_id").eq("club_id", clubScope).limit(500),
        supabase.from("posts").select("book_id").eq("club_id", clubScope).not("book_id", "is", null).limit(200),
        supabase.from("clubs").select("active_book_id").eq("id", clubScope).maybeSingle(),
      ]);
      scopeMemberIds = (members ?? []).map((m) => m.user_id);
      scopeBookIds = [
        ...new Set([
          ...(clubPosts ?? []).map((p) => p.book_id).filter((b): b is string => Boolean(b)),
          ...(clubRow?.active_book_id ? [clubRow.active_book_id] : []),
        ]),
      ];
    }

    /* ---- relevance boost: followed readers and joined circles come first ---- */
    let boostPeople: PersonRow[] = [];
    let boostClubs: ClubRow[] = [];

    if (firstPage && !clubScope) {
      const [{ data: myFollows }, { data: myClubs }] = await Promise.all([
        want("People")
          ? supabase.from("follows").select("following_id").eq("follower_id", userId).limit(200)
          : emptyRows<{ following_id: string }>(),
        want("Circles")
          ? supabase.from("club_memberships").select("club_id").eq("user_id", userId).limit(200)
          : emptyRows<{ club_id: string }>(),
      ]);

      const followIds = (myFollows ?? []).map((f) => f.following_id).filter((id) => id !== userId);
      const clubIds = (myClubs ?? []).map((m) => m.club_id);

      const [{ data: bp }, { data: bc }] = await Promise.all([
        followIds.length
          ? (q
              ? supabase.from("profiles").select(peopleSelect).in("user_id", followIds).or(`username.ilike.${like},display_name.ilike.${like}`)
              : supabase.from("profiles").select(peopleSelect).in("user_id", followIds)
            ).limit(PAGE_SIZE)
          : emptyRows<PersonRow>(),
        clubIds.length
          ? (q
              ? supabase.from("clubs").select("*").in("id", clubIds).or(`name.ilike.${like},category.ilike.${like},description.ilike.${like}`)
              : supabase.from("clubs").select("*").in("id", clubIds)
            ).limit(PAGE_SIZE)
          : emptyRows<ClubRow>(),
      ]);
      boostPeople = (bp ?? []) as unknown as PersonRow[];
      boostClubs = (bc ?? []) as unknown as ClubRow[];
    }

    const excludedPeople = firstPage ? boostPeople.map((p) => p.user_id) : cursor.boostedPeople;
    const excludedClubs = firstPage ? boostClubs.map((c) => c.id) : cursor.boostedClubs;

    /* ------------------------- keyset-paginated sections ------------------------ */
    let booksBase = q
      ? supabase.from("books").select("*").or(`title.ilike.${like},author.ilike.${like}`)
      : supabase.from("books").select("*");
    if (clubScope) booksBase = booksBase.in("id", scopeBookIds.length ? scopeBookIds : ["00000000-0000-0000-0000-000000000000"]);

    let clubsBase = q
      ? supabase.from("clubs").select("*").or(`name.ilike.${like},category.ilike.${like},description.ilike.${like}`)
      : supabase.from("clubs").select("*");
    const skipClubIds = [...new Set([...excludedClubs, ...hiddenClubs])];
    if (skipClubIds.length) clubsBase = clubsBase.not("id", "in", `(${skipClubIds.join(",")})`);

    let peopleBase = q
      ? supabase.from("profiles").select(peopleSelect).or(`username.ilike.${like},display_name.ilike.${like}`)
      : supabase.from("profiles").select(peopleSelect);
    peopleBase = peopleBase.neq("user_id", userId);
    if (clubScope) peopleBase = peopleBase.in("user_id", scopeMemberIds.length ? scopeMemberIds : ["00000000-0000-0000-0000-000000000000"]);
    const skipPeopleIds = [...new Set([...excludedPeople, ...hiddenPeople])];
    if (skipPeopleIds.length) peopleBase = peopleBase.not("user_id", "in", `(${skipPeopleIds.join(",")})`);

    let postsBase = q
      ? supabase.from("posts").select(postSelect).ilike("content", like)
      : supabase.from("posts").select(postSelect);
    if (clubScope) postsBase = postsBase.eq("club_id", clubScope);

    const [{ data: booksRaw }, { data: clubsRaw }, { data: peopleRaw }, { data: postsRaw }] = await Promise.all([
      want("Books") ? keyset(booksBase as never, cursor.books, PAGE_SIZE) : emptyRows<never>(),
      want("Circles") ? keyset(clubsBase as never, cursor.clubs, PAGE_SIZE) : emptyRows<never>(),
      want("People") ? keyset(peopleBase as never, cursor.people, PAGE_SIZE) : emptyRows<never>(),
      want("Posts") ? keyset(postsBase as never, cursor.posts, PAGE_SIZE) : emptyRows<never>(),
    ]);

    const trim = <T,>(rows: T[] | null) => {
      const list = (rows ?? []) as T[];
      return { rows: list.slice(0, PAGE_SIZE), hasMore: list.length > PAGE_SIZE };
    };

    const booksPage = trim(booksRaw as unknown as BookRow[] | null);
    const clubsPage = trim(clubsRaw as unknown as ClubRow[] | null);
    const peoplePage = trim(peopleRaw as unknown as PersonRow[] | null);
    const postsPage = trim(postsRaw as unknown as PostSearchRow[] | null);

    const peopleList: PersonRow[] = [...boostPeople, ...peoplePage.rows];
    const clubList: ClubRow[] = [...boostClubs, ...clubsPage.rows];
    const postList = postsPage.rows;

    const authorIds = [...new Set(postList.map((p) => p.user_id))];
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [{ data: follows }, { data: memberships }, { data: authors }, { data: followsBack }, { data: activePeople }, { data: activeClubs }] = await Promise.all([
      peopleList.length
        ? supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", userId)
            .in("following_id", peopleList.map((p) => p.user_id))
        : emptyRows<{ following_id: string }>(),
      clubList.length
        ? supabase
            .from("club_memberships")
            .select("club_id")
            .eq("user_id", userId)
            .in("club_id", clubList.map((c) => c.id))
        : emptyRows<{ club_id: string }>(),
      authorIds.length
        ? supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", authorIds)
        : emptyRows<{ user_id: string; username: string; display_name: string | null; avatar_url: string | null }>(),
      // "Follows you" badge
      peopleList.length
        ? supabase
            .from("follows")
            .select("follower_id")
            .eq("following_id", userId)
            .in("follower_id", peopleList.map((p) => p.user_id))
        : emptyRows<{ follower_id: string }>(),
      // "Recently active" badge: posted in the last 7 days
      peopleList.length
        ? supabase
            .from("posts")
            .select("user_id")
            .gte("created_at", since)
            .in("user_id", peopleList.map((p) => p.user_id))
        : emptyRows<{ user_id: string }>(),
      clubList.length
        ? supabase
            .from("posts")
            .select("club_id")
            .gte("created_at", since)
            .in("club_id", clubList.map((c) => c.id))
        : emptyRows<{ club_id: string | null }>(),
    ]);

    const followingSet = new Set((follows ?? []).map((f) => f.following_id));
    const memberSet = new Set((memberships ?? []).map((m) => m.club_id));
    const authorMap = new Map((authors ?? []).map((a) => [a.user_id, a]));
    const followsYouSet = new Set((followsBack ?? []).map((f) => f.follower_id));
    const activePeopleSet = new Set((activePeople ?? []).map((p) => p.user_id));
    const activeClubSet = new Set((activeClubs ?? []).map((p) => p.club_id).filter((c): c is string => Boolean(c)));
    const boostedPeopleSet = new Set(boostPeople.map((p) => p.user_id));
    const boostedClubSet = new Set(boostClubs.map((c) => c.id));

    const books: BookRow[] = booksPage.rows;
    const clubs = clubList.map((c) => ({
      ...c,
      isMember: memberSet.has(c.id),
      badges: [
        ...(boostedClubSet.has(c.id) || memberSet.has(c.id) ? ["Your circle"] : []),
        ...(activeClubSet.has(c.id) ? ["Active this week"] : []),
      ],
    }));
    const people = peopleList.map((p) => ({
      ...p,
      isFollowing: followingSet.has(p.user_id),
      badges: [
        ...(boostedPeopleSet.has(p.user_id) || followingSet.has(p.user_id) ? ["You follow them"] : []),
        ...(followsYouSet.has(p.user_id) ? ["Follows you"] : []),
        ...(activePeopleSet.has(p.user_id) ? ["Recently active"] : []),
      ],
    }));
    const posts = postList.map((p) => ({ ...p, author: authorMap.get(p.user_id) ?? null }));

    const count = books.length + clubs.length + people.length + posts.length;
    const hasMore = booksPage.hasMore || clubsPage.hasMore || peoplePage.hasMore || postsPage.hasMore;

    const nextCursor: SearchCursor = {
      people: nextKey(peoplePage.rows) ?? cursor.people,
      clubs: nextKey(clubsPage.rows) ?? cursor.clubs,
      books: nextKey(booksPage.rows) ?? cursor.books,
      posts: nextKey(postsPage.rows) ?? cursor.posts,
      boostedPeople: excludedPeople,
      boostedClubs: excludedClubs,
      page: cursor.page + 1,
    };

    // Engagement telemetry: one row per page of results served.
    await supabase.from("search_events").insert({
      user_id: userId,
      query: q,
      filter: type,
      event_type: firstPage ? "query" : "load_more",
      result_count: count,
      position: cursor.page,
    });

    return {
      page: cursor.page,
      books,
      clubs,
      people,
      posts,
      count,
      hasMore,
      nextCursor: hasMore ? JSON.stringify(nextCursor) : null,
    };
  });

/** Lightweight typeahead suggestions across readers, circles and books. */
export const searchSuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string; type?: string }) => ({
    query: (input.query ?? "").trim().slice(0, 60),
    type: (SEARCH_TYPES.includes((input.type ?? "All") as SearchType) ? input.type : "All") as SearchType,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const q = data.query;
    if (q.length < 2) return { suggestions: [] as Array<{ id: string; label: string; sublabel: string | null; kind: string }> };
    const like = `%${q}%`;
    const type = data.type;
    const want = (t: SearchType) => type === "All" || type === t;
    const empty = <T,>() => Promise.resolve({ data: [] as T[] });

    const [{ data: people }, { data: clubs }, { data: books }, { data: recents }] = await Promise.all([
      want("People")
        ? supabase
            .from("profiles")
            .select("user_id, username, display_name")
            .neq("user_id", userId)
            .or(`username.ilike.${like},display_name.ilike.${like}`)
            .limit(4)
        : empty<{ user_id: string; username: string; display_name: string | null }>(),
      want("Circles")
        ? supabase.from("clubs").select("id, name, category").ilike("name", like).limit(4)
        : empty<{ id: string; name: string; category: string | null }>(),
      want("Books")
        ? supabase.from("books").select("id, title, author").or(`title.ilike.${like},author.ilike.${like}`).limit(4)
        : empty<{ id: string; title: string; author: string }>(),
      supabase.from("search_recents").select("id, query").eq("user_id", userId).ilike("query", like).limit(3),
    ]);

    const suggestions = [
      ...(recents ?? []).map((r) => ({ id: `recent-${r.id}`, label: r.query, sublabel: null, kind: "recent" })),
      ...(people ?? []).map((p) => ({
        id: `person-${p.user_id}`,
        label: p.display_name ?? p.username,
        sublabel: `@${p.username}`,
        kind: "person",
      })),
      ...(clubs ?? []).map((c) => ({ id: `club-${c.id}`, label: c.name, sublabel: c.category, kind: "circle" })),
      ...(books ?? []).map((b) => ({ id: `book-${b.id}`, label: b.title, sublabel: b.author, kind: "book" })),
    ];

    const seen = new Set<string>();
    return {
      suggestions: suggestions.filter((s) => {
        const key = s.label.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 8),
    };
  });

/** Records dwell time and deepest scroll depth for a completed search session. */
export const logSearchEngagement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string; filter?: string; dwellMs: number; deepestPercent: number; resultsSeen?: number }) => ({
    query: (input.query ?? "").trim().slice(0, 100),
    filter: SEARCH_TYPES.includes((input.filter ?? "All") as SearchType) ? input.filter! : "All",
    dwellMs: Math.max(0, Math.min(60 * 60 * 1000, Math.floor(input.dwellMs ?? 0))),
    deepestPercent: Math.max(0, Math.min(100, Math.floor(input.deepestPercent ?? 0))),
    resultsSeen: Math.max(0, Math.min(10000, Math.floor(input.resultsSeen ?? 0))),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("search_events").insert({
      user_id: userId,
      query: data.query,
      filter: data.filter,
      event_type: "engagement",
      result_type: `dwell_ms:${data.dwellMs}`,
      result_count: data.resultsSeen,
      position: data.deepestPercent,
    });
    return { ok: true };
  });

export const logSearchClick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string; filter?: string; resultType: string; resultId: string; position?: number }) => ({
    query: (input.query ?? "").trim().slice(0, 100),
    filter: SEARCH_TYPES.includes((input.filter ?? "All") as SearchType) ? input.filter! : "All",
    resultType: (input.resultType ?? "").slice(0, 20),
    resultId: (input.resultId ?? "").slice(0, 64),
    position: Math.max(0, Math.floor(input.position ?? 0)),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("search_events").insert({
      user_id: userId,
      query: data.query,
      filter: data.filter,
      event_type: "click",
      result_type: data.resultType,
      result_id: data.resultId,
      position: data.position,
    });
    return { ok: true };
  });


/* ------------------------------ recent searches ----------------------------- */

export const getRecentSearches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("search_recents")
      .select("id, query, filter, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8);
    return data ?? [];
  });

export const saveRecentSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string; filter?: string }) => {
    const query = (input.query ?? "").trim().slice(0, 100);
    if (query.length < 2) throw new Error("Query too short");
    return { query, filter: SEARCH_TYPES.includes((input.filter ?? "All") as SearchType) ? input.filter! : "All" };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("search_recents")
      .upsert(
        { user_id: userId, query: data.query, filter: data.filter, created_at: new Date().toISOString() },
        { onConflict: "user_id,query,filter" },
      );
    return { ok: true };
  });

export const clearRecentSearches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("search_recents").delete().eq("user_id", userId);
    return { ok: true };
  });



/* ------------------------------ saved searches ------------------------------ */

export const getSavedSearches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("search_saved")
      .select("id, name, query, filter, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    return data ?? [];
  });

export const saveSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name?: string; query: string; filter?: string }) => {
    const query = (input.query ?? "").trim().slice(0, 100);
    if (query.length < 2) throw new Error("Type a search before saving it");
    const filter = SEARCH_TYPES.includes((input.filter ?? "All") as SearchType) ? input.filter! : "All";
    const name = ((input.name ?? "").trim() || (filter === "All" ? query : `${query} · ${filter}`)).slice(0, 60);
    return { name, query, filter };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("search_saved").insert({ user_id: userId, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSavedSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: (input.id ?? "").slice(0, 64) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("search_saved").delete().eq("id", data.id).eq("user_id", userId);
    return { ok: true };
  });

/* --------------------------- hidden search results -------------------------- */

export const getHiddenSearchResults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("search_hidden")
      .select("id, target_type, target_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    const rows = data ?? [];
    const personIds = rows.filter((r) => r.target_type === "person").map((r) => r.target_id);
    const clubIds = rows.filter((r) => r.target_type === "circle").map((r) => r.target_id);
    const [{ data: people }, { data: clubs }] = await Promise.all([
      personIds.length
        ? supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", personIds)
        : Promise.resolve({ data: [] as { user_id: string; username: string; display_name: string | null; avatar_url: string | null }[] }),
      clubIds.length
        ? supabase.from("clubs").select("id, name, avatar_url").in("id", clubIds)
        : Promise.resolve({ data: [] as { id: string; name: string; avatar_url: string | null }[] }),
    ]);
    const peopleMap = new Map((people ?? []).map((p) => [p.user_id, p]));
    const clubMap = new Map((clubs ?? []).map((c) => [c.id, c]));
    return rows.map((r) => ({
      ...r,
      label:
        r.target_type === "person"
          ? peopleMap.get(r.target_id)?.display_name ?? peopleMap.get(r.target_id)?.username ?? "Reader"
          : clubMap.get(r.target_id)?.name ?? "Circle",
      avatar_url:
        r.target_type === "person" ? peopleMap.get(r.target_id)?.avatar_url ?? null : clubMap.get(r.target_id)?.avatar_url ?? null,
    }));
  });

export const hideSearchResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { targetType: "person" | "circle"; targetId: string }) => {
    const targetType = input.targetType === "circle" ? "circle" : "person";
    const targetId = (input.targetId ?? "").slice(0, 64);
    if (!targetId) throw new Error("Missing target");
    return { targetType, targetId };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("search_hidden")
      .upsert(
        { user_id: userId, target_type: data.targetType, target_id: data.targetId },
        { onConflict: "user_id,target_type,target_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unhideSearchResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { targetType: "person" | "circle"; targetId: string }) => ({
    targetType: input.targetType === "circle" ? "circle" : "person",
    targetId: (input.targetId ?? "").slice(0, 64),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("search_hidden")
      .delete()
      .eq("user_id", userId)
      .eq("target_type", data.targetType)
      .eq("target_id", data.targetId);
    return { ok: true };
  });
