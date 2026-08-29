# Circle: Your Reading Community

# Build Brief — Circle by MyFlip

## 1. Product Overview

Build a **mobile-first social reading and book-club application called “Circle”**, a community product by **MyFlip**.

Circle is designed around one core idea:

> **A social space for people who love reading to discover books, join reading circles, participate in book-club events, share their reading journey, and connect with other readers.**

This is **not an e-commerce app** and should not feel like a traditional bookstore.

It should feel like a combination of:

* A modern book club
* A social network for readers
* A reading tracker
* A community platform
* An event-based discussion platform

The experience should be **premium, editorial, warm, intimate, social, and highly visual**.

The application should initially be designed and developed primarily for **mobile devices (Android and iOS)**, with tablet responsiveness as a secondary requirement.

Do not design this as a desktop website squeezed into a mobile screen. The entire information architecture and interaction model should be **mobile-native**.

---

# 2. Primary Product Goals

The app should allow users to:

1. Create an account and onboard themselves.
2. Tell Circle about their reading interests.
3. Discover other readers.
4. Join book clubs / reading circles.
5. Participate in active book-club events.
6. Communicate through direct messages.
7. Participate in event-specific group chats.
8. Share photos and short videos related to their reading.
9. Discover books.
10. Maintain a personal collection of books they have read.
11. Track their reading activity.
12. View reading statistics and streaks.
13. Build a reader identity/profile.
14. Read Circle's blogs/articles and editorial content.
15. Discover upcoming and active clubs.

---

# 3. Design Direction

The design should feel like a **premium modern reading community**, not a generic social media application.

### Desired characteristics

* Minimal
* Editorial
* Sophisticated
* Warm
* Human
* Book-centric
* Community-driven
* Highly visual
* Generous whitespace
* Excellent typography
* Subtle animations
* Strong hierarchy
* Rounded but not overly playful
* Premium UI components

Think of the experience as a combination of:

**Modern editorial publication + premium social app + reading tracker + intimate book club.**

Avoid:

* Generic SaaS dashboards
* Corporate UI
* Excessive gradients
* Overly complicated navigation
* Generic social-media clones
* Excessive cards everywhere
* Excessive gamification
* Cluttered screens
* Bright neon colors
* Large unnecessary illustrations

Books, covers, photography, typography and reader-generated content should be the visual focus.

---

# 4. Platform

Build primarily for:

* iOS
* Android
* Mobile phones
* Tablets

Use a responsive architecture so that the application can adapt to larger screens, but prioritize the mobile experience.

Use a **bottom navigation bar** as the primary navigation mechanism.

---

# 5. Main Navigation

The application should have **five primary tabs**.

### Tab 1 — Home

Social/community feed.

### Tab 2 — My Clubs

The user's active and joined book clubs.

### Tab 3 — Discover / Search

Discover clubs, books, people, blogs and articles.

### Tab 4 — My Books

The user's personal reading collection.

### Tab 5 — Profile

The user's reader identity, statistics and reading dashboard.

Use clear icons and labels.

The navigation should remain persistent throughout the authenticated application.

---

# 6. Initial Application Flow

The initial experience should follow this flow:

```text
Splash Screen
     ↓
Authentication
     ↓
Account Creation / Login
     ↓
Basic User Information
     ↓
Reader Onboarding Questions
     ↓
Home
```

---

# 7. Splash Screen

Create a minimal splash screen.

Display the **Circle logo/wordmark** centrally.

Use a subtle logo animation.

The animation should be short and elegant.

Do not create an elaborate loading screen.

After approximately 1–2 seconds, transition to authentication.

---

# 8. Authentication

Create a premium authentication screen.

Headline example:

**Welcome to Circle.**

Supporting text:

**A place for people who love to read.**

Provide three authentication options:

### Option 1

**Continue with Google**

Use Google authentication UI conventions.

### Option 2

**Continue with Email**

Allow users to enter:

* Email
* Password

Include:

* Forgot password
* Create account
* Login

### Option 3

**Continue with Goodreads**

Create a Goodreads login/connect option.

For the first version, the Goodreads integration can be represented as a **placeholder integration / mock authentication flow**, but architect the application so a real Goodreads integration can be added later.

Do not fabricate a real Goodreads API integration if credentials/API access are unavailable.

---

# 9. New User Onboarding

After a new user successfully authenticates, take them through onboarding.

The onboarding should be divided into several clean screens rather than displaying one enormous form.

Use a progress indicator.

Example:

```text
1 ─── 2 ─── 3 ─── 4
```

Allow the user to move backward and forward.

---

# 10. Basic User Information

Collect basic information such as:

### Required

* Full name
* Email
* Phone number

### Optional

* Profile picture
* Address
* City
* Date of birth

Do not overwhelm the user.

Use a clean form design with large touch targets.

Clearly mark optional fields.

Include:

**Continue**

button.

---

# 11. Reader Personality / Interest Questions

After basic information, present **five onboarding questions**.

The exact questions have not been finalized yet.

Therefore, create a flexible question system that allows these questions to be modified later without redesigning the entire onboarding experience.

The question system should support:

* Single choice
* Multiple choice
* Slider/rating
* Genre selection
* Yes/no
* Text response

Create five placeholder questions for now.

Example structure:

### Question 01

**What kind of books do you usually reach for?**

Options:

* Fiction
* Mystery
* Romance
* Fantasy
* Science Fiction
* Biography
* History
* Self-help
* Business
* Poetry
* Other

### Question 02

**What are you currently reading?**

Allow:

* Book search
* Skip

### Question 03

**How often do you read?**

Options:

* Every day
* A few times a week
* Once a week
* Occasionally

### Question 04

**What do you enjoy most about reading?**

Multiple selections.

### Question 05

**What are you hoping to find on Circle?**

Options could include:

* Find people who read similar books
* Join book clubs
* Discover books
* Discuss books
* Build a reading habit
* Track my reading

These are placeholders only.

Build the system so the questions can easily be replaced later.

---

# 12. Home — Community Feed

After onboarding, users land on the Home tab.

The Home screen is the primary social/community experience.

The feed should contain reader-generated content.

Users can post:

* Photos of books
* Reading desk/setup photos
* Current reads
* Book covers
* Short videos
* Reading updates
* Quotes from books
* Book-club related content

Content should remain **strictly book/reading focused**.

This should NOT become a generic social network.

---

# 13. Home Screen Structure

Build the Home screen approximately like this:

```text
Top Bar

Circle logo / greeting
Notifications icon
Profile/avatar

↓

Current Circle / Active Event

↓

Create Post

↓

Community Feed

Post
Post
Post
Post
```

The top of the screen can contain an active book-club event card.

For example:

**Currently Reading Together**

Book cover

**The Midnight Library**

Circle #04

**12 days remaining**

[Open Circle]

---

# 14. Create Post

Create a floating or prominent **Create Post** action.

When tapped, open a post composer.

Users should be able to:

* Upload image
* Upload short video
* Add caption
* Tag a book
* Tag a Circle/event

The UI should encourage visual book-related posts.

Example:

**What are you reading today?**

[Add Photo/Video]

[Select Book]

[Add to Circle]

[Post]

---

# 15. Social Feed Posts

Each post should contain:

* User avatar
* Username
* Time posted
* Image/video
* Caption
* Book association if available
* Circle/event association if available
* Like
* Comment
* Share/save

Keep the interaction model familiar but visually distinct from Instagram.

The focus should remain on **books and reading**, not influencer-style content.

---

# 16. My Clubs

The second tab should be called:

**My Clubs**

This section represents the book clubs / reading circles the user has joined or subscribed to.

Display:

### Active Clubs

The currently active reading experiences.

Each club can contain:

* Book cover
* Book title
* Author
* Circle name
* Progress
* Number of participants
* Next event
* Days remaining
* Discussion status

Example:

**Circle #07**

*Tomorrow, and Tomorrow, and Tomorrow*

By Gabrielle Zevin

**64% of Circle completed**

[Enter Circle]

---

# 17. Club Detail Page

When a user opens a club, create a dedicated club experience.

Possible sections:

### Overview

* Book cover
* Book title
* Author
* Description
* Reading schedule
* Club progress
* Participants

### Discussion

Event-specific group discussion.

### Members

List of participants.

### Activity

Posts and reading activity from participants.

### Schedule

Important dates, chapters and events.

### Resources

Articles, notes, questions and other material.

The exact club functionality will be expanded later, so build this architecture modularly.

---

# 18. Group Chat

Every active Circle/event can have its own group chat.

The group chat should be tied to the specific event.

Example:

```text
Circle #07
Tomorrow, and Tomorrow, and Tomorrow

42 members

[Group Chat]
```

Chat should support:

* Text
* Emoji
* Book references
* Images
* Replies
* Reactions

Design the chat as a focused book discussion rather than a generic messaging app.

---

# 19. Direct Messages

Users should also be able to connect with other users through direct messaging.

Create a messaging architecture that supports:

```text
Messages

Search conversations

Conversation
Conversation
Conversation

+
New message
```

Conversation screen:

```text
User Name

Messages

[message]
[message]
[message]

----------------
Type a message...
```

The architecture should support future functionality such as:

* Group conversations
* Book sharing
* User profiles
* Reading recommendations

---

# 20. Discover / Search

The third tab should be the discovery engine of Circle.

Users should be able to search for:

* Books
* Clubs
* People
* Articles
* Blogs

The screen should begin with a prominent search field.

Example:

**Search Circle**

Placeholder:

**Books, readers, clubs & stories**

---

# 21. Discover Categories

Below search, show discovery sections.

### Explore Clubs

Upcoming and active Circles.

### Discover Books

Popular books and books currently being discussed.

### Readers

Suggested readers based on interests.

### Circle Journal

Blogs, articles and editorial content.

### Trending

Books or discussions currently gaining attention.

---

# 22. Blog / Editorial Section

Circle should have an editorial content area.

Articles can cover:

* Book recommendations
* Author stories
* Reading guides
* Literary discussions
* Book reviews
* Reading habits
* Interviews
* Circle announcements
* Community stories

Design this section like a **premium digital magazine**, not a generic blog listing.

Use strong typography and book photography.

---

# 23. My Books

The fourth tab is:

**My Books**

This represents the user's personal reading library.

Users can add books they have read.

Organize books into states such as:

### Currently Reading

### Read

### Want to Read

These categories should be visually clear.

---

# 24. Book Collection

Each book should display:

* Cover
* Title
* Author
* Reading status
* Date completed
* Personal rating, if applicable

Allow users to:

**+ Add Book**

Book addition should support:

* Search
* Scan/search by ISBN in a future version
* Goodreads import in a future version

---

# 25. Book Detail

Book detail screen should include:

* Large book cover
* Title
* Author
* Description
* Genre
* Reading status
* Personal notes
* Rating
* Reading dates
* Related Circle

Actions:

**Currently Reading**

**Mark as Read**

**Add to Want to Read**

---

# 26. Profile

The fifth tab is the user's personal reader profile.

This should be one of the most visually interesting screens in the application.

The profile should feel like a **personal reading dashboard**.

Structure:

```text
Profile Photo

Name
@username

Short bio

↓

Reading Statistics

Books Read
Pages Read
Current Streak
Reading Goal

↓

Currently Reading

Book cards

↓

Reading Activity

↓

My Books

↓

Favorite Genres

↓

Reading History
```

---

# 27. Reading Dashboard

Make the statistics highly visual.

Possible metrics:

### Books Read

Number of books completed.

### Reading Streak

Example:

**18 days**

### Books This Year

Example:

**24 books**

### Pages Read

Example:

**7,420 pages**

### Current Book

Display current book with progress.

### Reading Goal

Example:

**24 / 40 books**

Use subtle progress visualizations.

Do not make it feel like a fitness tracker.

It should feel like a **literary reading journal**.

---

# 28. Reading Streak

Create a visual reading streak component.

Example:

```text
🔥

18
DAY STREAK

Mon Tue Wed Thu Fri Sat Sun
 ●   ●   ●   ●   ●   ●   ●
```

Use a calendar-style reading activity visualization.

---

# 29. User Profile / Social Identity

Users should have public-facing profiles.

A profile can contain:

* Profile image
* Name
* Username
* Bio
* Favorite genres
* Currently reading
* Books read
* Reading streak
* Reading statistics
* Clubs joined

Other users should be able to view a person's profile.

Future functionality can include:

* Follow
* Message
* Recommend book

---

# 30. Notifications

Create a notification center accessible from the Home header.

Notifications can include:

* New Circle activity
* Someone commented on your post
* Someone liked your post
* New group-chat message
* Circle reminder
* Reading milestone
* New article
* New club announcement

Use notification grouping to avoid clutter.

---

# 31. Interaction Principles

The app should feel fluid and responsive.

Use:

* Smooth transitions
* Bottom sheets
* Modal overlays
* Horizontal carousels
* Swipe interactions where appropriate
* Micro-interactions
* Subtle haptic-friendly interactions
* Skeleton loading states
* Empty states
* Error states

Avoid excessive animation.

Animations should communicate hierarchy and state changes rather than exist purely for decoration.

---

# 32. Loading States

Create proper loading states.

For example:

Home:

```text
[avatar skeleton]
[image skeleton]
[text skeleton]
```

Books:

```text
[book cover skeleton]
[text skeleton]
```

Profile:

```text
[avatar skeleton]
[statistics skeleton]
```

Do not rely only on a generic loading spinner.

---

# 33. Empty States

Create meaningful empty states.

Examples:

### No Clubs

**Your next reading adventure starts here.**

[Discover Clubs]

### No Books

**Your bookshelf is waiting.**

[Add Your First Book]

### No Posts

**Nothing on the reading shelf yet.**

**Be the first to share what you're reading.**

[Create Post]

---

# 34. Design System

Create a reusable design system.

Define:

### Typography

Use a modern, highly legible typeface.

The typography hierarchy should distinguish:

* Display
* H1
* H2
* H3
* Body
* Caption
* Metadata
* Buttons

Book titles should have slightly more editorial character than UI labels.

### Spacing

Use a consistent spacing system.

### Radius

Use moderate corner radii.

Avoid overly rounded “toy-like” UI.

### Icons

Use a consistent icon library.

Icons should be simple, minimal and recognizable.

### Buttons

Create reusable:

* Primary
* Secondary
* Ghost
* Icon buttons
* Destructive

components.

---

# 35. Color System

Create a premium neutral base.

Use:

* Warm off-white / cream backgrounds
* Deep charcoal text
* Muted secondary text
* One strong Circle accent color
* Subtle borders
* Soft surfaces

The application should work beautifully in both **light and dark mode** if practical, but prioritize the light theme for the initial version.

Do not use a rainbow color system.

Color should primarily be used for:

* Actions
* Active states
* Progress
* Notifications
* Important information

---

# 36. Navigation Behavior

The bottom navigation should remain persistent in the authenticated portion of the application.

Example:

```text
Home | Clubs | Discover | Books | Profile
```

The selected tab should have a clear active state.

Navigation should preserve scroll position when switching between tabs where appropriate.

---

# 37. Mobile UX Requirements

Optimize all interactions for touch.

Minimum comfortable touch target:

**44 × 44 px**

Use:

* Large tap areas
* Bottom sheets instead of desktop-style dialogs
* Thumb-friendly primary actions
* Swipeable components
* Native-feeling keyboard behavior
* Safe-area support

Ensure the UI works on:

* Small phones
* Standard phones
* Large phones
* Tablets

---

# 38. Backend Architecture

Create a scalable architecture.

The initial database structure should conceptually support:

### Users

```text
id
name
email
phone
profile_image
bio
city
created_at
```

### User Preferences

```text
user_id
genres
reading_frequency
reading_goals
interests
onboarding_answers
```

### Books

```text
id
title
author
cover
description
isbn
genres
publication_date
```

### User Books

```text
user_id
book_id
status
rating
started_at
completed_at
notes
progress
```

### Clubs

```text
id
name
description
book_id
cover
start_date
end_date
status
```

### Club Members

```text
club_id
user_id
joined_at
role
```

### Posts

```text
id
user_id
book_id
club_id
media
caption
created_at
```

### Comments

```text
id
post_id
user_id
content
created_at
```

### Messages

```text
id
sender_id
receiver_id
content
created_at
```

### Group Messages

```text
id
club_id
user_id
content
created_at
```

### Notifications

```text
id
user_id
type
reference_id
read
created_at
```

This is an initial conceptual schema and should be refined as development progresses.

---

# 39. Authentication & Security

Implement proper authentication architecture.

Support:

* Google authentication
* Email/password authentication

Goodreads should initially be treated as an integration placeholder unless an actual supported authentication/API mechanism is available.

Never expose:

* API keys
* Service credentials
* Database credentials
* Authentication secrets

in client-side code.

Use environment variables for secrets.

---

# 40. Data Persistence

User data should persist between sessions.

Persist:

* Authentication state
* Profile
* Onboarding answers
* Books
* Clubs
* Reading progress
* Posts
* Messages
* Preferences

A user should not have to repeat onboarding after logging in again.

---

# 41. Seed Data

Populate the application with realistic sample data so the UI does not look empty.

Create approximately:

* 10–20 books
* 5–8 clubs
* 10–15 users
* 15–30 community posts
* Several comments
* Several conversations
* Several notifications
* Reading statistics

Use real-looking but clearly non-production/sample data.

Use high-quality book cover placeholders or publicly available image URLs where appropriate.

---

# 42. Core Functional Prototype

The first generated version should prioritize these flows:

### Flow A

```text
Splash
→ Login
→ Google/Email
→ User Information
→ Five Questions
→ Home
```

### Flow B

```text
Home
→ Open Post
→ Like
→ Comment
→ Create Post
```

### Flow C

```text
My Clubs
→ Open Club
→ View Book
→ Open Discussion
→ Group Chat
```

### Flow D

```text
Discover
→ Search
→ Book
→ Club
→ Article
```

### Flow E

```text
My Books
→ Add Book
→ Book Detail
→ Mark as Read
```

### Flow F

```text
Profile
→ Reading Dashboard
→ Reading Statistics
→ Currently Reading
→ Reading History
```

### Flow G

```text
Profile
→ Another User
→ View Their Books
→ View Their Reading Activity
→ Message
```

---

# 43. Important Product Constraint

Do not attempt to build every future feature in full detail.

This is the **first product foundation**.

Build the application so that it can be expanded later.

Prioritize:

1. Information architecture
2. Navigation
3. Visual design
4. Authentication flow
5. Onboarding
6. Home feed
7. Club structure
8. Books
9. Profile
10. Messaging architecture

Features such as advanced recommendations, AI, gamification, payments, subscriptions, detailed event management, sophisticated Goodreads synchronization, moderation systems and advanced analytics can be added later.

---

# 44. UX Philosophy

Circle should answer three questions immediately whenever a user opens the app:

### What am I reading?

### Who am I reading with?

### What should I read next?

The application should continuously reinforce these three ideas.

The user should feel that Circle is **their personal reading space**, not simply another social media application.

---

# 45. Final Quality Bar

Before considering the first version complete, verify:

* Mobile layout works correctly.
* Bottom navigation works.
* Authentication flow works.
* Onboarding flow works.
* User information persists.
* Five-question onboarding works.
* Home feed renders correctly.
* Posts can be created in the prototype.
* Clubs can be opened.
* Club discussions can be accessed.
* Group-chat UI works.
* Direct-message UI works.
* Search UI works.
* Books can be added.
* User book statuses can be changed.
* Profile statistics render dynamically from user data.
* Reading streak UI works with sample data.
* Empty states exist.
* Loading states exist.
* Error states exist.
* Back navigation works correctly.
* Keyboard does not obscure important inputs.
* UI respects mobile safe areas.
* Tablet layout does not break.
* Components are reusable.
* No unnecessary desktop UI patterns are used.

---

# 46. Development Approach

Do not treat this as a static mockup.

Create a **functional application prototype with a real component architecture and persistent data model**.

Use reusable components throughout the application.

Create separate components for:

* Bottom navigation
* Book cards
* Club cards
* User cards
* Post cards
* Profile header
* Reading statistics
* Progress indicators
* Chat bubbles
* Search results
* Empty states
* Loading states
* Modals
* Bottom sheets

Keep the code modular and easy to extend.

---

# 47. First Build Priority

For the first generation, create these screens first:

1. Splash
2. Login
3. Email authentication
4. Basic profile information
5. Five-question onboarding
6. Home
7. Post detail
8. Create post
9. My Clubs
10. Club detail
11. Group discussion/chat
12. Discover/Search
13. Book results
14. My Books
15. Book detail
16. Profile
17. Reading dashboard
18. Direct Messages
19. Chat
20. Notifications

Make all major screens visually consistent and connected through working navigation.

---

# 48. Most Important Instruction

**Do not make Circle look like a generic social-media clone.**

The product's identity should come from:

**Books + Reading + People + Conversation + Shared Experiences.**

Every major design decision should reinforce those five elements.

The app should feel like entering a beautiful, intimate digital reading room where people happen to be connected through books.

Start by building the complete mobile information architecture, design system, navigation and core screens described above. Use realistic sample content to demonstrate how the application will feel when populated with real readers and books.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://circle-of-readers.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/332ffe59-bb97-4ffb-a12a-9f67c70570ca).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
