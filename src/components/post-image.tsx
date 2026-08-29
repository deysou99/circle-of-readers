import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Renders an image stored in the private `post-images` bucket via a signed URL. */
export function PostImage({ path, className }: { path: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    supabase.storage
      .from("post-images")
      .createSignedUrl(path, 60 * 60)
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data?.signedUrl) setFailed(true);
        else setUrl(data.signedUrl);
      });
    return () => {
      active = false;
    };
  }, [path]);

  if (failed) return null;
  if (!url) return <div className={`animate-pulse rounded-xl bg-muted ${className ?? "h-48 w-full"}`} />;
  return <img src={url} alt="Post attachment" loading="lazy" className={className ?? "h-48 w-full rounded-xl object-cover"} />;
}
