import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Clock, Share2, Bookmark } from "lucide-react";
import { getArticle } from "@/lib/seed";
import { useState } from "react";

export function ArticleScreen() {
  const { slug } = useParams({ from: "/_authenticated/journal/$slug" });
  const article = getArticle(slug);
  const [saved, setSaved] = useState(false);

  if (!article) {
    return (
      <div className="phone-shell flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-muted-foreground">Article not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/discover">
          <ArrowLeft size={22} className="text-ink" />
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={() => setSaved((v) => !v)} className={`p-2 ${saved ? "text-primary" : "text-ink"}`}>
            <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
          </button>
          <button className="p-2 text-ink">
            <Share2 size={20} />
          </button>
        </div>
      </header>

      <article className="px-4 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Circle Journal</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight text-ink" style={{ fontFamily: "var(--font-heading)" }}>{article.title}</h1>
        <p className="mt-2 text-base text-muted-foreground">{article.subtitle}</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{article.author}</span>
          <span>•</span>
          <span>{article.date}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {article.readTime}</span>
        </div>

        <img src={article.image} alt={article.title} className="mt-5 w-full rounded-2xl object-cover" />

        <div className="prose prose-sm mt-6 max-w-none text-ink">
          {article.body.split("\n\n").map((paragraph, i) => (
            <p key={i} className="mb-4 leading-relaxed">{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
