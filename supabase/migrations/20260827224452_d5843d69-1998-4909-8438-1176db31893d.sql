-- Circle first-build schema + seed

-- 1. Profiles
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    username text UNIQUE NOT NULL,
    display_name text,
    bio text,
    avatar_url text,
    reading_goal integer DEFAULT 30,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Books
CREATE TABLE public.books (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    author text NOT NULL,
    cover_url text,
    summary text,
    genre text,
    pages integer,
    published_year integer,
    rating numeric(3,2) DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.books TO anon;
GRANT SELECT ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Books are readable by everyone"
ON public.books
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Service role can manage books"
ON public.books
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Clubs
CREATE TABLE public.clubs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    handle text UNIQUE NOT NULL,
    description text,
    avatar_url text,
    is_private boolean DEFAULT false,
    category text,
    active_book_id uuid REFERENCES public.books(id),
    member_count integer DEFAULT 0,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.clubs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubs TO authenticated;
GRANT ALL ON public.clubs TO service_role;

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clubs are readable by everyone"
ON public.clubs
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can create clubs"
ON public.clubs
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Club creators can update/delete"
ON public.clubs
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- 4. Club memberships
CREATE TABLE public.club_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role text DEFAULT 'member' NOT NULL,
    joined_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (club_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.club_memberships TO authenticated;
GRANT ALL ON public.club_memberships TO service_role;

ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own memberships"
ON public.club_memberships
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Club owners can see members"
ON public.club_memberships
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND created_by = auth.uid())
);

-- 5. Posts
CREATE TABLE public.posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
    club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
    rating integer CHECK (rating >= 0 AND rating <= 5),
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are readable by everyone"
ON public.posts
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can manage own posts"
ON public.posts
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Comments
CREATE TABLE public.comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are readable by everyone"
ON public.comments
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can manage own comments"
ON public.comments
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Seed books
INSERT INTO public.books (title, author, cover_url, summary, genre, pages, published_year, rating) VALUES
('The Paper War', 'Elena Marsh', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop', 'In 1940s Lisbon, a young journalist risks everything to publish underground dispatches that could change the course of the war.', 'Historical Fiction', 342, 2024, 4.70),
('Quiet Currency', 'James O. Reed', 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=600&fit=crop', 'A modern rethink of value, work, and attention: how the best investments are not financial, but relational.', 'Business', 288, 2023, 4.50),
('Atlas of Lost Places', 'Mira Chaudhary', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop', 'A cartographer''s daughter traces the routes erased by borders, conflict, and time in this lyrical memoir.', 'Travel & Memoir', 416, 2024, 4.80),
('Signal Hill', 'Darren Liu', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop', 'A retired radio astronomer is drawn back to her coastal hometown when a hidden signal appears on old tapes.', 'Mystery', 304, 2022, 4.30),
('The Burn Season', 'Nora Ikeda', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop', 'Three siblings return to the family orchard during fire season and confront the inheritance they never asked for.', 'Literary Fiction', 368, 2024, 4.60),
('Loop Logic', 'Theo Banks', 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=600&fit=crop', 'How feedback loops shape ecosystems, economies, and everyday habits — and how to find the levers that matter.', 'Science', 256, 2023, 4.20);

-- Seed clubs
INSERT INTO public.clubs (name, handle, description, avatar_url, is_private, category, member_count) VALUES
('The Common Room', 'commonroom', 'A cozy, genre-agnostic circle for readers who love long conversations about short chapters.', 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=200&h=200&fit=crop', false, 'General Fiction', 1284),
('Design & Pages', 'designpages', 'Where typography, architecture, and product design meet the books that shaped them.', 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=200&h=200&fit=crop', false, 'Design & Non-fiction', 621),
('Saturdays in Lisbon', 'lisbonreads', 'Travel reads, place-based fiction, and memoirs that make you want to book a flight.', 'https://images.unsplash.com/photo-1555881400-74d7acaacd81?w=200&h=200&fit=crop', true, 'Travel', 432),
('Coastal Noir', 'coastnoir', 'Mystery and crime fiction with a salty breeze. Spoilers strictly moderated.', 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=200&h=200&fit=crop', true, 'Mystery', 198),
('Future Farmers', 'futurefarmers', 'Reading about food systems, regenerative agriculture, and the future of the table.', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=200&h=200&fit=crop', false, 'Science & Food', 356);