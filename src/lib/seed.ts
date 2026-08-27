export type Book = {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  pages: number;
  genre: string;
  summary: string;
  publishedYear: number;
};

export type Club = {
  id: string;
  name: string;
  handle: string;
  members: number;
  avatar: string;
  isPrivate: boolean;
  description: string;
  activeBookId: string;
  category: string;
};

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  clubId?: string;
  clubName?: string;
  content: string;
  bookId?: string;
  rating?: number;
  likes: number;
  comments: number;
  createdAt: string;
  image?: string;
};

export type Reader = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  booksRead: number;
  currentlyReading: string;
  followers: number;
  following: number;
};

export type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  readerId: string;
  readerName: string;
  readerAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
};

export type Article = {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  date: string;
  readTime: string;
  body: string;
  image: string;
};

export const BOOKS: Book[] = [
  {
    id: "b1",
    title: "The Paper War",
    author: "Elena Marsh",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
    rating: 4.7,
    pages: 342,
    genre: "Historical Fiction",
    summary:
      "In 1940s Lisbon, a young journalist risks everything to publish underground dispatches that could change the course of the war.",
    publishedYear: 2024,
  },
  {
    id: "b2",
    title: "Quiet Currency",
    author: "James O. Reed",
    cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=600&fit=crop",
    rating: 4.5,
    pages: 288,
    genre: "Business",
    summary:
      "A modern rethink of value, work, and attention: how the best investments are not financial, but relational.",
    publishedYear: 2023,
  },
  {
    id: "b3",
    title: "Atlas of Lost Places",
    author: "Mira Chaudhary",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
    rating: 4.8,
    pages: 416,
    genre: "Travel & Memoir",
    summary:
      "A cartographer's daughter traces the routes erased by borders, conflict, and time in this lyrical memoir.",
    publishedYear: 2024,
  },
  {
    id: "b4",
    title: "Signal Hill",
    author: "Darren Liu",
    cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",
    rating: 4.3,
    pages: 304,
    genre: "Mystery",
    summary:
      "A retired radio astronomer is drawn back to her coastal hometown when a hidden signal appears on old tapes.",
    publishedYear: 2022,
  },
  {
    id: "b5",
    title: "The Burn Season",
    author: "Nora Ikeda",
    cover: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop",
    rating: 4.6,
    pages: 368,
    genre: "Literary Fiction",
    summary:
      "Three siblings return to the family orchard during fire season and confront the inheritance they never asked for.",
    publishedYear: 2024,
  },
  {
    id: "b6",
    title: "Loop Logic",
    author: "Theo Banks",
    cover: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=600&fit=crop",
    rating: 4.2,
    pages: 256,
    genre: "Science",
    summary:
      "How feedback loops shape ecosystems, economies, and everyday habits — and how to find the levers that matter.",
    publishedYear: 2023,
  },
];

export const CLUBS: Club[] = [
  {
    id: "c1",
    name: "The Common Room",
    handle: "commonroom",
    members: 1284,
    avatar: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=200&h=200&fit=crop",
    isPrivate: false,
    description: "A cozy, genre-agnostic circle for readers who love long conversations about short chapters.",
    activeBookId: "b1",
    category: "General Fiction",
  },
  {
    id: "c2",
    name: "Design & Pages",
    handle: "designpages",
    members: 621,
    avatar: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=200&h=200&fit=crop",
    isPrivate: false,
    description: "Where typography, architecture, and product design meet the books that shaped them.",
    activeBookId: "b2",
    category: "Design & Non-fiction",
  },
  {
    id: "c3",
    name: "Saturdays in Lisbon",
    handle: "lisbonreads",
    members: 432,
    avatar: "https://images.unsplash.com/photo-1555881400-74d7acaacd81?w=200&h=200&fit=crop",
    isPrivate: true,
    description: "Travel reads, place-based fiction, and memoirs that make you want to book a flight.",
    activeBookId: "b3",
    category: "Travel",
  },
  {
    id: "c4",
    name: "Coastal Noir",
    handle: "coastnoir",
    members: 198,
    avatar: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=200&h=200&fit=crop",
    isPrivate: true,
    description: "Mystery and crime fiction with a salty breeze. Spoilers strictly moderated.",
    activeBookId: "b4",
    category: "Mystery",
  },
  {
    id: "c5",
    name: "Future Farmers",
    handle: "futurefarmers",
    members: 356,
    avatar: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=200&h=200&fit=crop",
    isPrivate: false,
    description: "Reading about food systems, regenerative agriculture, and the future of the table.",
    activeBookId: "b5",
    category: "Science & Food",
  },
];

export const POSTS: Post[] = [
  {
    id: "p1",
    authorId: "u2",
    authorName: "Maya Okonkwo",
    authorHandle: "maya_reads",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    clubId: "c1",
    clubName: "The Common Room",
    content:
      "Just finished chapter 12 of The Paper War and I genuinely had to put the phone down. The Lisbon post office scene — devastating. No spoilers, but who else is reading this month?",
    bookId: "b1",
    likes: 84,
    comments: 17,
    createdAt: "2h ago",
  },
  {
    id: "p2",
    authorId: "u3",
    authorName: "Samir Hossain",
    authorHandle: "samirpages",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    content:
      "Started Quiet Currency this morning. The chapter on 'relational capital' reframed how I think about networking. Highly recommend for anyone building community.",
    bookId: "b2",
    rating: 4,
    likes: 42,
    comments: 6,
    createdAt: "4h ago",
  },
  {
    id: "p3",
    authorId: "u4",
    authorName: "Linnea Berg",
    authorHandle: "linneabooks",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    clubId: "c3",
    clubName: "Saturdays in Lisbon",
    content:
      "Photo from my walk today — exactly the kind of light Mira Chaudhary describes in Atlas of Lost Places. Reading her made me notice the city differently.",
    bookId: "b3",
    likes: 156,
    comments: 23,
    createdAt: "6h ago",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=500&fit=crop",
  },
  {
    id: "p4",
    authorId: "u5",
    authorName: "Daniel Rivera",
    authorHandle: "danreads_",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    content:
      "Hot take: Signal Hill is better on a re-read. The first time it felt slow; the second time every quiet moment landed like a warning.",
    bookId: "b4",
    rating: 5,
    likes: 67,
    comments: 9,
    createdAt: "8h ago",
  },
];

export const READERS: Reader[] = [
  {
    id: "u1",
    name: "You",
    handle: "newreader",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    bio: "Building my reading life one chapter at a time.",
    booksRead: 12,
    currentlyReading: "The Paper War",
    followers: 24,
    following: 18,
  },
  {
    id: "u2",
    name: "Maya Okonkwo",
    handle: "maya_reads",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    bio: "Fiction-first reader. I annotate everything.",
    booksRead: 142,
    currentlyReading: "The Paper War",
    followers: 1204,
    following: 312,
  },
  {
    id: "u3",
    name: "Samir Hossain",
    handle: "samirpages",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    bio: "Design, non-fiction, and the occasional mystery.",
    booksRead: 89,
    currentlyReading: "Quiet Currency",
    followers: 843,
    following: 210,
  },
  {
    id: "u4",
    name: "Linnea Berg",
    handle: "linneabooks",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    bio: "Travel memoirs and novels that feel like places.",
    booksRead: 201,
    currentlyReading: "Atlas of Lost Places",
    followers: 2301,
    following: 156,
  },
  {
    id: "u5",
    name: "Daniel Rivera",
    handle: "danreads_",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    bio: "Re-reader. Cozy crime. Strong opinions about endings.",
    booksRead: 315,
    currentlyReading: "Signal Hill",
    followers: 567,
    following: 89,
  },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: "m1",
    readerId: "u2",
    readerName: "Maya Okonkwo",
    readerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    lastMessage: "That scene in chapter 12 really got to me too.",
    lastMessageAt: "10m ago",
    unread: 2,
  },
  {
    id: "m2",
    readerId: "u3",
    readerName: "Samir Hossain",
    readerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    lastMessage: "Would you recommend Loop Logic after Quiet Currency?",
    lastMessageAt: "2h ago",
    unread: 0,
  },
  {
    id: "m3",
    readerId: "u4",
    readerName: "Linnea Berg",
    readerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    lastMessage: "Let me know when you start Atlas of Lost Places!",
    lastMessageAt: "1d ago",
    unread: 1,
  },
];

export const MESSAGES: Record<string, Message[]> = {
  m1: [
    { id: "msg1", senderId: "u2", text: "Are you reading The Paper War too?", createdAt: "Yesterday" },
    { id: "msg2", senderId: "u1", text: "Yes! Just started it this week.", createdAt: "Yesterday" },
    { id: "msg3", senderId: "u2", text: "That scene in chapter 12 really got to me too.", createdAt: "10m ago" },
  ],
  m2: [
    { id: "msg4", senderId: "u3", text: "Would you recommend Loop Logic after Quiet Currency?", createdAt: "2h ago" },
  ],
  m3: [
    { id: "msg5", senderId: "u4", text: "Atlas of Lost Places is making me want to travel again.", createdAt: "1d ago" },
    { id: "msg6", senderId: "u1", text: "Same. The descriptions of the old maps are beautiful.", createdAt: "1d ago" },
    { id: "msg7", senderId: "u4", text: "Let me know when you start Atlas of Lost Places!", createdAt: "1d ago" },
  ],
};

export const ARTICLES: Article[] = [
  {
    slug: "reading-slumps",
    title: "How to Read Through a Slump",
    subtitle: "Gentle strategies for returning to books when your attention is elsewhere.",
    author: "Circle Editorial",
    date: "Aug 25, 2026",
    readTime: "6 min",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=500&fit=crop",
    body:
      "Reading slumps are not a moral failure. They are usually a signal: your brain needs something different from what it needed last month. Sometimes the fix is a shorter book. Sometimes it is a different format. Sometimes it is permission to abandon a book that isn't working.\n\nStart small. A single chapter. A collection of essays. A book you have read before and loved. The goal is not volume; it is reconnection.\n\nCommunity can help too. Seeing what others are reading — without pressure — often reminds us why we fell in love with books in the first place.",
  },
  {
    slug: "great-first-lines",
    title: "The Power of a Great First Line",
    subtitle: "Why the opening sentence is a contract between writer and reader.",
    author: "Circle Editorial",
    date: "Aug 18, 2026",
    readTime: "4 min",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=500&fit=crop",
    body:
      "A great first line does not need to be loud. It needs to be precise. It sets the temperature of the book. It tells the reader: stay, this will be worth your time.\n\nThink of the calm authority of 'Call me Ishmael.' Or the immediate intimacy of '124 was spiteful.' These lines do not explain; they invite.\n\nThe best openings often create a small mystery that the rest of the novel solves — not a plot mystery, but a tone mystery. Why is the narrator speaking this way? What world am I entering? That curiosity is the engine that pulls readers through the first fifty pages.",
  },
];

export function getBook(id: string): Book | undefined {
  return BOOKS.find((b) => b.id === id);
}

export function getClub(id: string): Club | undefined {
  return CLUBS.find((c) => c.id === id);
}

export function getReader(id: string): Reader | undefined {
  return READERS.find((r) => r.id === id);
}

export function getPost(id: string): Post | undefined {
  return POSTS.find((p) => p.id === id);
}

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
