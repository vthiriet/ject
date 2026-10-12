import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { loadPreview } from '../lib/api';
import { db } from '../lib/db';

/** Carte d'aperçu d'un lien (titre, image, site). */
export function LinkPreviewCard({ url, compact }: { url: string; compact?: boolean }) {
  const preview = useLiveQuery(() => db.previews.get(url), [url]);
  useEffect(() => {
    void loadPreview(url);
  }, [url]);
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  })();
  return (
    <a className={`link-card ${compact ? 'compact' : ''}`} href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
      {preview?.image && <img src={preview.image} alt="" loading="lazy" referrerPolicy="no-referrer" />}
      <span className="link-text">
        <span className="link-title">{preview?.title || host}</span>
        <span className="link-site">{preview?.siteName || host}</span>
      </span>
    </a>
  );
}
