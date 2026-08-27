# Circle by MyFlip — First Build

A mobile-first social reading and book-club app: splash, auth, onboarding, and five persistent tabs (Home, Clubs, Discover, Books, Profile), built on the "Modern library" design direction with a real backend and seeded sample content.

## Design foundation

Carried directly from the selected direction:

- Paper `#FAFAFA`, ink `#1C1917`, primary `#00D084`, secondary `#E83227`, forest `#2D4F3C` (progress), parchment `#F5F2EA` (surfaces)
- Outfit for headings; Manrope for body text and UI labels
- Moderate radii (rounded-md covers, rounded-xl/2xl surfaces), hairline `ink/5` borders, generous vertical rhythm
- Phone-width column centered with safe-area padding; tablets get the same column with wider gutters
- Uppercase micro-labels ("Active Circle", "The Common Room") as section headers
- Restrained motion: fades, progress fills, tab state changes only

## Backend (Lovable Cloud)

Enable Cloud, then one migration creating: profiles, user_preferences (onboarding answers as JSON so questions can change freely), books, user_books, clubs, club_members, posts, comments, post_likes, messages (DM), group_messages, conversations, notifications. Every table gets grants, row-level security, and policies scoped to the signed-in user (public read where content is communal, e.g. clubs, books, posts).

Auth: email/password plus Google sign-in. Goodreads appears as a third button that opens a clearly-labelled placeholder connect sheet — no fabricated API. A profile row is created on signup by trigger; onboarding completion is a flag so returning users skip straight to Home.

Seed data ships in the same migration: ~16 books, 6 clubs, 12 sample readers, ~24 posts with comments, a few conversations, notifications, and reading stats, so no screen is empty.

## Screens

Public: splash (animated wordmark, ~1.5s), auth, email sign-in/sign-up, forgot password, reset password.

Onboarding (progress dots, back/next): basic info (name, email, phone required; photo, city, DOB, address optional), then five questions rendered from a config file — the question schema supports single choice, multi choice, slider, genre grid, yes/no, text, and book search, so questions can be swapped later without touching UI.

Authenticated tabs and their sub-screens:

- Home — greeting header with notifications and avatar, active Circle card, create-post prompt, community feed; post detail with likes and comments; create-post composer (photo/video, caption, tag book, tag circle); notifications center
- Clubs — joined clubs list, club detail with Overview / Discussion / Members / Activity / Schedule / Resources sections, group chat
- Discover — search across books, clubs, people, articles; sections for Explore Clubs, Discover Books, Readers, Circle Journal, Trending; article reader
- Books — Currently Reading / Read / Want to Read shelves, add-book search sheet, book detail with status actions, rating, notes
- Profile — reading dashboard (books read, pages, streak calendar, yearly goal), currently reading, activity, shelves, favorite genres, history; settings and sign out
- Messages — conversation list and chat thread; other users' public profiles with a Message action

Every list has designed empty, skeleton-loading, and error states.

## Technical notes

- TanStack Start file routes; public routes at top level, all tabs under an `_authenticated` layout with a persistent bottom nav that preserves scroll per tab
- Data via server functions with auth middleware + TanStack Query; media uploads to Cloud storage
- Reusable components: BottomNav, BookCard, BookCover, ClubCard, UserCard, PostCard, ProfileHeader, ReadingStats, StreakCalendar, ProgressBar, ChatBubble, SearchResult, EmptyState, Skeletons, BottomSheet
- Book covers and reader photos generated as assets in the direction's warm photographic style
- Per-route head metadata; no secrets in client code

## Build order

1. Cloud + schema + seed
2. Design tokens, fonts, core components
3. Splash, auth, onboarding
4. Tab shell + Home + post flows
5. Clubs + group chat
6. Discover + editorial
7. Books
8. Profile + dashboard
9. Messages + notifications
10. Empty/loading/error pass and mobile QA
