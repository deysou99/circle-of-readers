import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ----------------------------- recommendations ---------------------------- */

export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: shelf }, { data: following }, { data: myClubs }, { data: dismissed }] = await Promise.all([
      supabase.from("profiles").select("favorite_genres").eq("user_id", userId).maybeSingle(),
      supabase.from("user_books").select("book_id, status, rating").eq("user_id", userId),
      supabase.from("follows").select("following_id").eq("follower_id", userId),
      supabase.from("club_memberships").select("club_id").eq("user_id", userId),
      supabase.from("recommendation_dismissals").select("book_id").eq("user_id", userId),
    ]);
    const dismissedIds = new Set((dismissed ?? []).map((d) => d.book_id));

    const genres = (profile?.favorite_genres ?? []) as string[];
    const shelfIds = new Set((shelf ?? []).map((s) => s.book_id));
    const followedIds = (following ?? []).map((f) => f.following_id);
    const clubIds = (myClubs ?? []).map((c) => c.club_id);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: books }, { data: friendPosts }, { data: clubBooks }] = await Promise.all([
      supabase.from("books").select("id, title, author, cover_url, genre, rating, summary").limit(200),
      followedIds.length
        ? supabase
            .from("posts")
            .select("book_id, rating, user_id, created_at")
            .in("user_id", followedIds)
            .not("book_id", "is", null)
            .gte("created_at", since)
        : Promise.resolve({ data: [] as { book_id: string | null; rating: number | null; user_id: string; created_at: string }[] }),
      clubIds.length
        ? supabase.from("clubs").select("id, name, active_book_id").in("id", clubIds)
        : Promise.resolve({ data: [] as { id: string; name: string; active_book_id: string | null }[] }),
    ]);

    const friendCount = new Map<string, number>();
    for (const p of friendPosts ?? []) {
      if (!p.book_id) continue;
      friendCount.set(p.book_id, (friendCount.get(p.book_id) ?? 0) + 1 + (p.rating && p.rating >= 4 ? 1 : 0));
    }
    const clubBookIds = new Map<string, string>();
    for (const c of clubBooks ?? []) {
      if (c.active_book_id) clubBookIds.set(c.active_book_id, c.name);
    }

    const scored = (books ?? [])
      .filter((b) => !shelfIds.has(b.id) && !dismissedIds.has(b.id))
      .map((b) => {
        const reasons: string[] = [];
        let score = Number(b.rating ?? 0) * 0.4;
        if (b.genre && genres.includes(b.genre)) {
          score += 4;
          reasons.push(`Matches your love of ${b.genre}`);
        }
        const fc = friendCount.get(b.id) ?? 0;
        if (fc > 0) {
          score += 3 * fc;
          reasons.push(`${fc} reader${fc > 1 ? "s" : ""} you follow posted about it`);
        }
        const clubName = clubBookIds.get(b.id);
        if (clubName) {
          score += 5;
          reasons.push(`Currently reading in ${clubName}`);
        }
        return { ...b, score, reasons };
      })
      .filter((b) => b.reasons.length > 0 || b.score > 1.6)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    return scored;
  });

/* --------------------------------- events --------------------------------- */

type EventInput = {
  clubId: string;
  title: string;
  description?: string | null;
  startsAt: string;
  durationMinutes?: number;
  location?: string | null;
  bookId?: string | null;
};

export const getClubEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clubId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: events } = await supabase
      .from("club_events")
      .select("*, books(id, title, cover_url)")
      .eq("club_id", data.clubId)
      .gte("starts_at", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
      .order("starts_at", { ascending: true });

    const ids = (events ?? []).map((e) => e.id);
    const { data: rsvps } = ids.length
      ? await supabase.from("event_rsvps").select("event_id, user_id, status, reminder_enabled, reminder_minutes").in("event_id", ids)
      : { data: [] as { event_id: string; user_id: string; status: string; reminder_enabled: boolean; reminder_minutes: number }[] };

    return (events ?? []).map((e) => {
      const forEvent = (rsvps ?? []).filter((r) => r.event_id === e.id);
      const mine = forEvent.find((r) => r.user_id === userId) ?? null;
      return {
        ...e,
        goingCount: forEvent.filter((r) => r.status === "going").length,
        maybeCount: forEvent.filter((r) => r.status === "maybe").length,
        myRsvp: mine ? { status: mine.status, reminderEnabled: mine.reminder_enabled, reminderMinutes: mine.reminder_minutes } : null,
      };
    });
  });

export const getMyUpcomingEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: rsvps } = await supabase
      .from("event_rsvps")
      .select("status, reminder_enabled, reminder_minutes, club_events(id, title, starts_at, location, club_id, clubs(id, name))")
      .eq("user_id", userId)
      .neq("status", "not_going");

    const rows = (rsvps ?? [])
      .filter((r) => r.club_events && new Date(r.club_events.starts_at).getTime() > Date.now())
      .sort((a, b) => new Date(a.club_events!.starts_at).getTime() - new Date(b.club_events!.starts_at).getTime());
    return rows.map((r) => ({
      status: r.status,
      reminderEnabled: r.reminder_enabled,
      reminderMinutes: r.reminder_minutes,
      event: r.club_events!,
    }));
  });

export const createClubEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: EventInput) => {
    const title = (input.title ?? "").trim();
    if (!title) throw new Error("Give the discussion a title");
    if (!input.startsAt || Number.isNaN(new Date(input.startsAt).getTime())) throw new Error("Pick a valid date and time");
    return { ...input, title };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: event, error } = await supabase
      .from("club_events")
      .insert({
        club_id: data.clubId,
        title: data.title,
        description: data.description ?? null,
        starts_at: new Date(data.startsAt).toISOString(),
        duration_minutes: data.durationMinutes ?? 60,
        location: data.location ?? null,
        book_id: data.bookId ?? null,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return event;
  });

export const setEventRsvp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { eventId: string; status: "going" | "maybe" | "not_going"; reminderEnabled?: boolean; reminderMinutes?: number }) => {
    if (!["going", "maybe", "not_going"].includes(input.status)) throw new Error("Invalid RSVP status");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("event_rsvps").upsert(
      {
        event_id: data.eventId,
        user_id: userId,
        status: data.status,
        reminder_enabled: data.reminderEnabled ?? true,
        reminder_minutes: data.reminderMinutes ?? 60,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id,user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, status: data.status };
  });

/* ------------------------------- messaging -------------------------------- */

type MiniProfile = { user_id: string; username: string; display_name: string | null; avatar_url: string | null };

async function participantProfiles(
  supabase: { from: (t: string) => any },
  userIds: string[],
): Promise<Map<string, MiniProfile>> {
  if (!userIds.length) return new Map<string, MiniProfile>();
  const { data } = await supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds);
  return new Map<string, MiniProfile>(((data ?? []) as MiniProfile[]).map((p) => [p.user_id, p]));
}

export const getConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: mine } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId);

    const ids = (mine ?? []).map((m) => m.conversation_id);
    if (!ids.length) return [];

    const [{ data: convos }, { data: participants }, { data: messages }] = await Promise.all([
      supabase.from("conversations").select("*, clubs(id, name, avatar_url)").in("id", ids).order("last_message_at", { ascending: false }),
      supabase.from("conversation_participants").select("conversation_id, user_id, last_read_at").in("conversation_id", ids),
      supabase.from("messages").select("id, conversation_id, sender_id, content, created_at").in("conversation_id", ids).order("created_at", { ascending: false }).limit(500),
    ]);

    const profiles = await participantProfiles(supabase, [...new Set((participants ?? []).map((p) => p.user_id))]);
    const readMap = new Map((mine ?? []).map((m) => [m.conversation_id, m.last_read_at]));

    return (convos ?? []).map((c) => {
      const convMessages = (messages ?? []).filter((m) => m.conversation_id === c.id);
      const last = convMessages[0] ?? null;
      const lastRead = readMap.get(c.id) ?? new Date(0).toISOString();
      const unread = convMessages.filter((m) => m.sender_id !== userId && new Date(m.created_at) > new Date(lastRead)).length;
      const others = (participants ?? [])
        .filter((p) => p.conversation_id === c.id && p.user_id !== userId)
        .map((p) => profiles.get(p.user_id) ?? null)
        .filter(Boolean);
      return {
        id: c.id,
        kind: c.kind,
        title: c.title,
        club: c.clubs,
        lastMessage: last ? { id: last.id, content: last.content, createdAt: last.created_at, mine: last.sender_id === userId } : null,
        lastMessageAt: c.last_message_at,
        unread,
        others,
      };
    });
  });

export const getConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { conversationId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: convo } = await supabase
      .from("conversations")
      .select("*, clubs(id, name, avatar_url)")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (!convo) throw new Error("Conversation not found");

    const [{ data: participants }, { data: messages }] = await Promise.all([
      supabase.from("conversation_participants").select("user_id, last_read_at").eq("conversation_id", convo.id),
      supabase.from("messages").select("*").eq("conversation_id", convo.id).order("created_at", { ascending: true }).limit(300),
    ]);

    const profiles = await participantProfiles(supabase, (participants ?? []).map((p) => p.user_id));
    const readers = (participants ?? []).filter((p) => p.user_id !== userId);

    const withReceipts = (messages ?? []).map((m) => {
      if (m.sender_id !== userId) return { ...m, seenBy: [], seenCount: 0, sender: profiles.get(m.sender_id) ?? null };
      const seenBy = readers
        .filter((r) => new Date(r.last_read_at) >= new Date(m.created_at))
        .map((r) => profiles.get(r.user_id))
        .filter(Boolean);
      return { ...m, seenBy, seenCount: seenBy.length, sender: profiles.get(m.sender_id) ?? null };
    });

    return {
      conversation: {
        id: convo.id,
        kind: convo.kind,
        title: convo.title,
        club: convo.clubs,
      },
      participantCount: (participants ?? []).length,
      others: readers.map((r) => profiles.get(r.user_id) ?? null).filter(Boolean),
      messages: withReceipts,
    };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { conversationId: string; content: string }) => {
    const content = (input.content ?? "").trim();
    if (!content) throw new Error("Write a message first");
    if (content.length > 2000) throw new Error("Messages are limited to 2000 characters");
    return { ...input, content };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: message, error } = await supabase
      .from("messages")
      .insert({ conversation_id: data.conversationId, sender_id: userId, content: data.content })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", data.conversationId)
      .eq("user_id", userId);
    return message;
  });

export const markConversationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { conversationId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", data.conversationId)
      .eq("user_id", userId);
    return { ok: true };
  });

export const startDirectConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.userId === userId) throw new Error("You cannot message yourself");

    const { data: mine } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", userId);
    const ids = (mine ?? []).map((m) => m.conversation_id);
    if (ids.length) {
      const { data: shared } = await supabase
        .from("conversation_participants")
        .select("conversation_id, conversations(kind)")
        .eq("user_id", data.userId)
        .in("conversation_id", ids);
      const direct = (shared ?? []).find((s) => s.conversations?.kind === "direct");
      if (direct) return { conversationId: direct.conversation_id };
    }

    const { data: convo, error } = await supabase
      .from("conversations")
      .insert({ kind: "direct", created_by: userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: partError } = await supabase.from("conversation_participants").insert([
      { conversation_id: convo.id, user_id: userId },
      { conversation_id: convo.id, user_id: data.userId },
    ]);
    if (partError) throw new Error(partError.message);
    return { conversationId: convo.id };
  });

export const getClubConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clubId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: membership } = await supabase
      .from("club_memberships")
      .select("id")
      .eq("club_id", data.clubId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!membership) throw new Error("Join the circle to open its group chat");

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("club_id", data.clubId)
      .eq("kind", "group")
      .maybeSingle();

    let conversationId = existing?.id ?? null;
    if (!conversationId) {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ kind: "group", club_id: data.clubId, created_by: userId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      conversationId = created.id;
    }

    await supabase
      .from("conversation_participants")
      .upsert({ conversation_id: conversationId, user_id: userId }, { onConflict: "conversation_id,user_id" });

    return { conversationId };
  });

/* -------------------------- notification settings ------------------------- */

const PREF_KEYS = [
  "likes",
  "comments",
  "follows",
  "club_activity",
  "event_reminders",
  "direct_messages",
  "group_messages",
  "mentions",
] as const;
type PrefKey = (typeof PREF_KEYS)[number];

export const getNotificationPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle();
    if (data) return data;
    const { data: created } = await supabase
      .from("notification_preferences")
      .insert({ user_id: userId })
      .select("*")
      .single();
    return created;
  });

export const updateNotificationPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<Record<PrefKey, boolean>> & { push_enabled?: boolean; seen_indicator_mode?: string }) => {
    const patch: Record<string, boolean | string> = {};
    for (const key of PREF_KEYS) {
      if (typeof input[key] === "boolean") patch[key] = input[key] as boolean;
    }
    if (typeof input.push_enabled === "boolean") patch["push_enabled"] = input.push_enabled;
    if (typeof input.seen_indicator_mode === "string") {
      if (!["full", "initials", "hidden"].includes(input.seen_indicator_mode)) throw new Error("Invalid seen indicator mode");
      patch["seen_indicator_mode"] = input.seen_indicator_mode;
    }
    if (!Object.keys(patch).length) throw new Error("Nothing to update");
    return patch;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: updated, error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: userId, ...data, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

/* -------------------------------- timeline -------------------------------- */

export const getTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { type?: "all" | "posts" | "books" | "progress"; clubId?: string | null; range?: "all" | "today" | "week" | "month" }) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const type = data.type ?? "all";
    const range = data.range ?? "all";

    let query = supabase
      .from("posts")
      .select("*, books(id, title, author, cover_url), clubs(id, name)")
      .order("created_at", { ascending: false })
      .limit(60);

    if (data.clubId) query = query.eq("club_id", data.clubId);
    if (type === "books") query = query.not("book_id", "is", null);
    if (type === "progress") query = query.not("rating", "is", null);
    if (type === "posts") query = query.is("book_id", null);

    if (range !== "all") {
      const days = range === "today" ? 1 : range === "week" ? 7 : 30;
      query = query.gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
    }

    const { data: posts } = await query;
    const list = posts ?? [];
    const authorIds = [...new Set(list.map((p) => p.user_id))];
    const [{ data: authors }, { data: likes }] = await Promise.all([
      authorIds.length
        ? supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", authorIds)
        : Promise.resolve({ data: [] as { user_id: string; username: string; display_name: string | null; avatar_url: string | null }[] }),
      supabase.from("post_likes").select("post_id").eq("user_id", userId),
    ]);
    const authorMap = new Map((authors ?? []).map((a) => [a.user_id, a]));
    const likedIds = new Set((likes ?? []).map((l) => l.post_id));

    return list.map((p) => ({ ...p, liked: likedIds.has(p.id), author: authorMap.get(p.user_id) ?? null }));
  });

export const getMyClubsForFilter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("club_memberships")
      .select("club_id, clubs(id, name)")
      .eq("user_id", userId);
    return (data ?? []).map((m) => m.clubs).filter((c): c is { id: string; name: string } => !!c);
  });

/* ----------------------------- timeline presets --------------------------- */

export const getTimelinePresets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("timeline_presets")
      .select("id, name, type, range, club_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    return data ?? [];
  });

export const saveTimelinePreset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; type: string; range: string; clubId?: string | null }) => {
    const name = input.name.trim();
    if (!name) throw new Error("Give this view a name");
    if (name.length > 40) throw new Error("Keep the name under 40 characters");
    return { ...input, name };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("timeline_presets")
      .insert({ user_id: userId, name: data.name, type: data.type, range: data.range, club_id: data.clubId ?? null })
      .select("id, name, type, range, club_id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteTimelinePreset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("timeline_presets").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------ recommendation dismissals ----------------------- */

export const dismissRecommendation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookId: string; reason?: string | null }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("recommendation_dismissals")
      .upsert({ user_id: userId, book_id: data.bookId, reason: data.reason ?? null }, { onConflict: "user_id,book_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const undoRecommendationDismissal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("recommendation_dismissals").delete().eq("user_id", userId).eq("book_id", data.bookId);
    return { ok: true };
  });

/* ---------------------------- push subscriptions -------------------------- */

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { endpoint: string; p256dh?: string | null; auth?: string | null; userAgent?: string | null }) => {
    if (!input.endpoint) throw new Error("Missing push endpoint");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh ?? null,
        auth_key: data.auth ?? null,
        user_agent: data.userAgent ?? null,
      },
      { onConflict: "user_id,endpoint" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removePushSubscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("push_subscriptions").delete().eq("user_id", userId);
    return { ok: true };
  });
