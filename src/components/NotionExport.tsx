import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { exportToNotion, searchNotionPages, type NotionPage } from '../lib/api';
import { db, getMeta, setMeta } from '../lib/db';
import { openSettings } from '../lib/diagnostics';
import { markExported } from '../lib/store';
import { getSession, supabase } from '../lib/supabase';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { toast } from './Toast';

interface Props {
  noteId: string;
  onClose: () => void;
  /** Appelé quand la note entière a été exportée (elle est alors archivée). */
  onDone: () => void;
}

/** Envoi d'une liste (entière ou certains éléments) ou d'une note vers une page Notion. */
export function NotionExport({ noteId, onClose, onDone }: Props) {
  const note = useLiveQuery(() => db.notes.get(noteId), [noteId]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [query, setQuery] = useState('');
  const [pages, setPages] = useState<NotionPage[] | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState<NotionPage | null>(null);
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [withTitle, setWithTitle] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void getSession().then((s) => setConnected(!!s));
    void getMeta<NotionPage | null>('notionLastPage', null).then((p) => p && setPage((cur) => cur ?? p));
  }, []);

  useEffect(() => {
    if (!connected) return;
    const t = setTimeout(() => {
      setError('');
      searchNotionPages(query).then(setPages).catch((e: Error) => setError(e.message));
    }, 300);
    return () => clearTimeout(t);
  }, [query, connected]);

  const exportable = note?.items.filter((i) => !i.exported && i.text.trim()) ?? [];
  useEffect(() => {
    if (note && selected === null) setSelected(new Set(exportable.map((i) => i.id)));
  }, [note]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!note) return null;
  const isList = note.type === 'list';

  if (connected === false) {
    return (
      <Dialog title="Exporter vers Notion" onClose={onClose}>
        <p>
          {supabase
            ? 'Pour exporter vers Notion, connecte-toi d’abord à ton compte.'
            : 'La connexion n’est pas encore configurée (Supabase). Voir le guide d’installation.'}
        </p>
        {supabase && (
          <button type="button" className="btn primary" onClick={() => openSettings()}>
            Se connecter
          </button>
        )}
      </Dialog>
    );
  }

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const chosen = exportable.filter((i) => selected?.has(i.id));
  const whole = !isList || chosen.length === exportable.length;
  const canSend = !!page && !sending && (isList ? chosen.length > 0 : !!(note.title.trim() || note.content.trim()));

  const send = async () => {
    if (!page) return;
    setSending(true);
    setError('');
    try {
      const heading = withTitle ? note.title.trim() : '';
      if (isList) {
        await exportToNotion({ pageId: page.id, heading, todos: chosen.map((i) => ({ text: i.text, checked: i.checked })) });
      } else {
        const paragraphs = note.content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
        await exportToNotion({ pageId: page.id, heading: heading || undefined, paragraphs });
      }
      await setMeta('notionLastPage', page);
      const mention = { at: Date.now(), pageTitle: page.title, pageUrl: page.url };
      await markExported(note.id, whole ? 'all' : chosen.map((i) => i.id), mention);
      toast(whole ? `Exportée vers « ${page.title} » et archivée` : `${chosen.length} élément${chosen.length > 1 ? 's' : ''} exporté${chosen.length > 1 ? 's' : ''} vers « ${page.title} »`);
      onClose();
      if (whole) onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de l’export');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      title="Exporter vers Notion"
      onClose={onClose}
      className="notion-dialog"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Annuler</button>
          <button type="button" className="btn primary" disabled={!canSend} onClick={() => void send()}>
            {sending ? 'Envoi…' : whole ? 'Tout exporter' : `Exporter ${chosen.length} élément${chosen.length > 1 ? 's' : ''}`}
          </button>
        </>
      }
    >
      <p className="section-label">Page de destination</p>
      {page ? (
        <button type="button" className="page-choice selected" onClick={() => setPage(null)}>
          <span>{page.icon ?? <Icon name="notes" size={18} />} {page.title}</span>
          <small>Changer</small>
        </button>
      ) : (
        <>
          <input className="text-input" value={query} placeholder="Chercher une page Notion" onChange={(e) => setQuery(e.target.value)} autoFocus />
          <ul className="page-list">
            {pages === null && !error && <li className="hint">Chargement des pages…</li>}
            {pages?.length === 0 && (
              <li className="hint">Aucune page trouvée. Dans Notion, ouvre la page › ••• › Connexions › ajoute l’intégration Ject.</li>
            )}
            {pages?.map((p) => (
              <li key={p.id}>
                <button type="button" className="page-choice" onClick={() => setPage(p)}>
                  <span>{p.icon ?? <Icon name="notes" size={18} />} {p.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {note.title.trim() && (
        <label className="switch-row">
          <input type="checkbox" checked={withTitle} onChange={(e) => setWithTitle(e.target.checked)} />
          Ajouter « {note.title.trim()} » comme intertitre
        </label>
      )}

      {isList && (
        <>
          <div className="section-row">
            <p className="section-label">Éléments à exporter</p>
            <button
              type="button"
              className="link-btn"
              onClick={() => setSelected(chosen.length === exportable.length ? new Set() : new Set(exportable.map((i) => i.id)))}
            >
              {chosen.length === exportable.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>
          <ul className="label-options">
            {exportable.map((i) => (
              <li key={i.id}>
                <button type="button" onClick={() => toggle(i.id)}>
                  <Icon name={selected?.has(i.id) ? 'checked' : 'unchecked'} size={20} />
                  <span className={i.checked ? 'struck' : ''}>{i.text}</span>
                </button>
              </li>
            ))}
            {!exportable.length && <li className="hint">Tous les éléments ont déjà été exportés.</li>}
          </ul>
          <p className="hint">
            {whole
              ? 'La liste entière sera envoyée, puis archivée dans Ject avec une mention.'
              : 'Les éléments envoyés passeront dans la section « Exportés vers Notion » de la liste.'}
          </p>
        </>
      )}
      {!isList && <p className="hint">La carte sera envoyée, puis archivée dans Ject avec une mention.</p>}
      {error && <p className="error">{error}</p>}
    </Dialog>
  );
}
