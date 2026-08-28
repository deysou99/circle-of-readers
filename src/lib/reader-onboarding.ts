/**
 * Circle reader onboarding: question configuration, trait scoring and
 * personality derivation. Pure data + pure functions so both the client
 * (preview) and the server (persistence) share one source of truth.
 */

export type TraitKey =
  | "curiosity"
  | "social"
  | "discussion"
  | "discovery"
  | "introspection"
  | "consistency"
  | "community"
  | "independence"
  | "depth";

export type Traits = Record<TraitKey, number>;

export const EMPTY_TRAITS: Traits = {
  curiosity: 0,
  social: 0,
  discussion: 0,
  discovery: 0,
  introspection: 0,
  consistency: 0,
  community: 0,
  independence: 0,
  depth: 0,
};

export interface Option {
  id: string;
  label: string;
  detail?: string;
  weights: Partial<Traits>;
}

/* ------------------------------- stage 01 -------------------------------- */

export const CURIOSITY_OPTIONS: Option[] = [
  { id: "human_behaviour", label: "Human behaviour", weights: { curiosity: 2, depth: 1, introspection: 1 } },
  { id: "crime_mystery", label: "Crime & mystery", weights: { curiosity: 2, discovery: 1 } },
  { id: "love", label: "Love & relationships", weights: { curiosity: 1, social: 1, introspection: 1 } },
  { id: "money_power", label: "Money & power", weights: { curiosity: 2, discussion: 1 } },
  { id: "history", label: "History", weights: { depth: 2, curiosity: 1 } },
  { id: "politics", label: "Politics & society", weights: { discussion: 2, depth: 1 } },
  { id: "science", label: "Science & technology", weights: { curiosity: 2, depth: 1 } },
  { id: "art_culture", label: "Art & culture", weights: { curiosity: 1, community: 1, discovery: 1 } },
  { id: "strange", label: "The strange & unknown", weights: { discovery: 2, curiosity: 1 } },
  { id: "other_lives", label: "Other people's lives", weights: { social: 1, introspection: 2 } },
  { id: "absurd", label: "The absurd", weights: { curiosity: 1, discovery: 1 } },
  { id: "everything", label: "Honestly, everything", weights: { curiosity: 3, discovery: 2 } },
];

/* ------------------------------- stage 02 -------------------------------- */

export const LOCATION_OPTIONS: Option[] = [
  { id: "bed", label: "In bed.", detail: "Phone on silent. World switched off.", weights: { introspection: 2, independence: 2, depth: 1 } },
  { id: "cafe", label: "At a café.", detail: "People around me, but nobody talking to me.", weights: { social: 1, independence: 1, curiosity: 1 } },
  { id: "outside", label: "Somewhere outside.", detail: "A park, balcony, bench — anywhere with a little life around me.", weights: { curiosity: 1, social: 1 } },
  { id: "soundtrack", label: "At home with a soundtrack.", detail: "Music playing. Something to drink. Book open.", weights: { introspection: 1, consistency: 1 } },
  { id: "friends", label: "With friends.", detail: "I'll probably spend half the time talking about the last chapter.", weights: { social: 2, community: 2, discussion: 1 } },
  { id: "move", label: "On the move.", detail: "Train, bus, flight — apparently that's when I become productive.", weights: { consistency: 2, independence: 1 } },
];

export const INTERRUPTION_OPTIONS: Option[] = [
  { id: "nothing", label: "Nothing.", weights: { depth: 3, independence: 1, consistency: 1 } },
  { id: "conversation", label: "A good conversation.", weights: { social: 2, discussion: 1 } },
  { id: "song", label: "A good song.", weights: { curiosity: 1, introspection: 1 } },
  { id: "notification", label: "A notification.", weights: { social: 1 } },
  { id: "food", label: "Food.", weights: { social: 1, community: 1 } },
  { id: "thoughts", label: "My own thoughts.", weights: { introspection: 3, depth: 1 } },
];

/* ------------------------------- stage 03 -------------------------------- */

export const AFTER_BOOK_OPTIONS: Option[] = [
  { id: "talk", label: "\u201CI need to talk about this.\u201D", detail: "I want to know what everyone else thought.", weights: { social: 2, discussion: 2, community: 1 } },
  { id: "unpack", label: "\u201CWait\u2026 what did I just read?\u201D", detail: "I want to unpack it, analyse it and dissect it.", weights: { depth: 3, introspection: 2 } },
  { id: "recommend", label: "\u201CWho else has read this?\u201D", detail: "I'm immediately looking for people to recommend it to.", weights: { community: 2, social: 2 } },
  { id: "private", label: "\u201CNobody gets to know about this one.\u201D", detail: "Some books are mine.", weights: { independence: 3, introspection: 2 } },
  { id: "next", label: "\u201COkay, what's next?\u201D", detail: "I'm already looking for the next book.", weights: { discovery: 2, consistency: 2 } },
  { id: "rabbit_hole", label: "\u201CI need to know more.\u201D", detail: "One book usually sends me down another rabbit hole.", weights: { curiosity: 3, discovery: 2, depth: 1 } },
];

export const CONVERSATION_OPTIONS: Option[] = [
  { id: "did_you_like", label: "\u201CDid you like the book?\u201D", weights: { social: 1, community: 1 } },
  { id: "terrible_person", label: "\u201CWas the protagonist actually a terrible person?\u201D", weights: { discussion: 2, depth: 1 } },
  { id: "ending", label: "\u201CI think the ending completely changes the meaning of the book.\u201D", weights: { depth: 3, discussion: 1 } },
  { id: "hear_me_out", label: "\u201COkay, hear me out\u2026\u201D", weights: { discussion: 3, curiosity: 1 } },
];

/* ------------------------------- stage 04 -------------------------------- */

export const BELONGING_OPTIONS: Option[] = [
  { id: "taste", label: "I found people who get my taste.", weights: { community: 2, social: 1 } },
  { id: "unexpected_books", label: "I discovered books I would've never picked myself.", weights: { discovery: 3, curiosity: 1 } },
  { id: "conversations", label: "I had conversations I couldn't have anywhere else.", weights: { discussion: 3, depth: 1 } },
  { id: "regular", label: "I finally started reading regularly again.", weights: { consistency: 3 } },
  { id: "friends", label: "I made actual friends.", weights: { social: 3, community: 2 } },
  { id: "changed_view", label: "Someone completely changed the way I saw a book.", weights: { depth: 2, discussion: 2 } },
  { id: "leave_house", label: "I found my excuse to leave the house.", weights: { social: 2, community: 1 } },
  { id: "recommender", label: "I became the person who always has a book recommendation.", weights: { discovery: 2, community: 2 } },
  { id: "belong", label: "I just wanted somewhere to belong.", weights: { community: 3, social: 1 } },
];

export const ALL_OPTIONS: Option[] = [
  ...CURIOSITY_OPTIONS,
  ...LOCATION_OPTIONS,
  ...INTERRUPTION_OPTIONS,
  ...AFTER_BOOK_OPTIONS,
  ...CONVERSATION_OPTIONS,
  ...BELONGING_OPTIONS,
];

export interface ReaderAnswers {
  curiosity_preferences: string[];
  reading_locations: string[];
  reading_interruptions: string[];
  post_book_behaviour: string[];
  conversation_style: string[];
  community_motivations: string[];
}

export const EMPTY_ANSWERS: ReaderAnswers = {
  curiosity_preferences: [],
  reading_locations: [],
  reading_interruptions: [],
  post_book_behaviour: [],
  conversation_style: [],
  community_motivations: [],
};

export function scoreTraits(answers: ReaderAnswers): Traits {
  const traits: Traits = { ...EMPTY_TRAITS };
  const selected = [
    ...answers.curiosity_preferences,
    ...answers.reading_locations,
    ...answers.reading_interruptions,
    ...answers.post_book_behaviour,
    ...answers.conversation_style,
    ...answers.community_motivations,
  ];
  for (const id of selected) {
    const option = ALL_OPTIONS.find((o) => o.id === id);
    if (!option) continue;
    for (const [key, value] of Object.entries(option.weights)) {
      traits[key as TraitKey] += value ?? 0;
    }
  }
  return traits;
}

export interface Personality {
  name: string;
  description: string;
}

interface PersonalityRule extends Personality {
  score: (t: Traits) => number;
}

const PERSONALITIES: PersonalityRule[] = [
  {
    name: "The Curious Contrarian",
    description: "You read alone, but rarely keep your thoughts to yourself.",
    score: (t) => t.discussion * 1.4 + t.independence * 1.2 + t.curiosity,
  },
  {
    name: "The Social Explorer",
    description: "Give you a strange book, interesting people and a table to sit around. You'll figure out the rest.",
    score: (t) => t.social * 1.3 + t.discovery * 1.3 + t.community,
  },
  {
    name: "The Quiet Obsessive",
    description: "You disappear into books and emerge with 17 opinions.",
    score: (t) => t.depth * 1.4 + t.introspection * 1.3 + t.independence,
  },
  {
    name: "The Rabbit-Hole Reader",
    description: "One chapter is never just one chapter.",
    score: (t) => t.curiosity * 1.5 + t.discovery * 1.2 + t.depth * 0.6,
  },
  {
    name: "The Conversation Starter",
    description: "You don't just finish books. You bring them into the room.",
    score: (t) => t.discussion * 1.3 + t.social * 1.2 + t.community * 1.1,
  },
  {
    name: "The Steady Companion",
    description: "You keep a quiet, constant rhythm — and you'd like some good company alongside it.",
    score: (t) => t.consistency * 1.6 + t.community * 0.9 + t.introspection * 0.6,
  },
  {
    name: "The Circle Keeper",
    description: "Books are the reason. The people are the point.",
    score: (t) => t.community * 1.5 + t.social * 1.1 + t.discussion * 0.7,
  },
];

export function derivePersonality(traits: Traits): Personality {
  let best = PERSONALITIES[0]!;
  let bestScore = -Infinity;
  for (const p of PERSONALITIES) {
    const s = p.score(traits);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return { name: best.name, description: best.description };
}

export function topTraits(traits: Traits, count = 3): TraitKey[] {
  return (Object.keys(traits) as TraitKey[])
    .sort((a, b) => traits[b] - traits[a])
    .filter((k) => traits[k] > 0)
    .slice(0, count);
}
