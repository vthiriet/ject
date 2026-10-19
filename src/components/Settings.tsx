import { useEffect, useRef, useState } from 'react';
import { db } from '../lib/db';
import { errorLog, runDiagnostics } from '../lib/diagnostics';
import { downloadFile } from '../lib/download';
import { useSyncStatus, type ThemePref } from '../lib/hooks';
import { importBackup } from '../lib/store';
import { supabase } from '../lib/supabase';
import { syncNow, syncState } from '../lib/sync';
import { noteToMarkdown } from '../lib/text';
import type { Label, Note } from '../lib/types';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { toast } from './Toast';

interface Props {
  onClose: () => void;
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  /** Section à montrer en ouvrant (ex. le journal des erreurs). */
  focus?: 'diagnostic';
}

const STATUS_TEXT = {
  local: 'Non connecté : les cartes restent sur cet appareil.',
  syncing: 'Synchronisation en cours…',
  synced: 'À jour sur tous tes appareils.',
  offline: 'Hors ligne : la synchronisation reprendra au retour du réseau.',
  error: 'La synchronisation a échoué.',
};

export function Settings({ onClose, theme, setTheme, focus }: Props) {
  const status = useSyncStatus();
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [diag, setDiag] = useState('');
  const [diagRunning, setDiagRunning] = useState(false);
  const errors = errorLog();
  const diagRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (focus === 'diagnostic') diagRef.current?.scrollIntoView({ block: 'start' });
  }, [focus]);
  const runDiag = async () => {
    setDiagRunning(true);
    setDiag(await runDiagnostics());
    setDiagRunning(false);
  };

  useEffect(() => {
    void supabase?.auth.getSession().then(({ data }) => setUserEmail(data.session?.user.email ?? null));
  }, [status]);

  const sendLink = async () => {
    if (!supabase || !email.trim()) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: location.origin },
    });
    setBusy(false);
    if (error) toast('L’envoi du lien n’a pas marché. Vérifie l’adresse et réessaie.');
    else setSent(true);
  };

  const logout = async () => {
    await supabase?.auth.signOut();
    setUserEmail(null);
    toast('Déconnecté. Les cartes restent sur cet appareil.');
  };

  const exportJson = async () => {
    const data = {
      app: 'ject',
      exportedAt: new Date().toISOString(),
      notes: await db.notes.filter((n) => !n.deleted).toArray(),
      labels: await db.labels.filter((l) => !l.deleted).toArray(),
      backgrounds: await db.backgrounds.filter((b) => !b.deleted).toArray(),
    };
    downloadFile(`ject-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
  };

  const exportMarkdown = async () => {
    const notes: Note[] = await db.notes.filter((n) => !n.deleted && n.trashedAt === null).toArray();
    const labels: Label[] = await db.labels.filter((l) => !l.deleted).toArray();
    notes.sort((a, b) => Number(a.archived) - Number(b.archived) || b.position - a.position);
    const md = ['# Ject — export', '', ...notes.map((n) => noteToMarkdown(n, labels) + (n.archived ? '\n\n*(archivée)*' : '') + '\n')].join('\n');
    downloadFile(`ject-cartes-${new Date().toISOString().slice(0, 10)}.md`, md, 'text/markdown');
  };

  const importJson = async (file?: File) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      // La sauvegarde s'ajoute à l'existant, sans confirmation (décision 54).
      const count = await importBackup(data);
      toast(`${count} carte${count > 1 ? 's' : ''} ajoutée${count > 1 ? 's' : ''}`);
    } catch {
      toast('Fichier de sauvegarde illisible');
    }
  };

  return (
    <Dialog title="Réglages" onClose={onClose}>
      <section className="settings-section">
        <h3>Apparence</h3>
        <div className="segmented" role="radiogroup" aria-label="Thème">
          {([['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']] as const).map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={theme === v} className={theme === v ? 'on' : ''} onClick={() => setTheme(v)}>{l}</button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h3>Compte et synchronisation</h3>
        <p className={`sync-line ${status}`}><span className="dot" /> {STATUS_TEXT[status]} {status === 'error' && syncState.error()}</p>
        {!supabase ? (
          <p className="hint">La synchronisation n’est pas encore configurée (variables Supabase manquantes).</p>
        ) : userEmail ? (
          <>
            <p>Connecté en tant que <strong>{userEmail}</strong></p>
            <div className="row">
              <button type="button" className="btn" onClick={() => void syncNow()}><Icon name="sync" size={18} /> Synchroniser</button>
              <button type="button" className="btn" onClick={() => void logout()}><Icon name="logout" size={18} /> Se déconnecter</button>
            </div>
          </>
        ) : sent ? (
          <p><Icon name="send" size={18} /> E-mail envoyé à <strong>{email}</strong>. Ouvre-le <strong>sur cet appareil</strong> et touche le lien : tu seras connecté.</p>
        ) : (
          <form className="row" onSubmit={(e) => { e.preventDefault(); void sendLink(); }}>
            <input className="text-input" type="email" required value={email} placeholder="ton@email.fr" onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <button type="submit" className="btn primary" disabled={busy}>Recevoir le lien</button>
          </form>
        )}
      </section>

      <section className="settings-section">
        <h3>Mes données</h3>
        <div className="row wrap">
          <button type="button" className="btn" onClick={() => void exportJson()}><Icon name="download" size={18} /> Sauvegarde (JSON)</button>
          <button type="button" className="btn" onClick={() => void exportMarkdown()}><Icon name="download" size={18} /> Export Markdown</button>
          <label className="btn">
            <Icon name="upload" size={18} /> Restaurer une sauvegarde
            <input type="file" accept="application/json,.json" hidden onChange={(e) => void importJson(e.target.files?.[0])} />
          </label>
        </div>
      </section>
      <section className="settings-section" ref={diagRef}>
        <h3>Diagnostic</h3>
        {errors.length > 0 ? (
          <>
            <p className="hint">Dernières erreurs :</p>
            <pre className="diagnostic">{errors.join('\n')}</pre>
          </>
        ) : (
          <p className="hint">Aucune erreur récente.</p>
        )}
        <p className="hint">En cas de problème : lance le diagnostic, puis fais une capture d’écran ou copie le résultat.</p>
        <div className="row wrap">
          <button type="button" className="btn" disabled={diagRunning} onClick={() => void runDiag()}>
            <Icon name="sync" size={18} /> {diagRunning ? 'Diagnostic…' : 'Lancer le diagnostic'}
          </button>
          {diag && (
            <button type="button" className="btn" onClick={() => void navigator.clipboard.writeText(diag).then(() => toast('Diagnostic copié'))}>
              <Icon name="copy" size={18} /> Copier
            </button>
          )}
        </div>
        {diag && <pre className="diagnostic">{diag}</pre>}
      </section>
      <p className="hint about">Ject · version 0.1</p>
    </Dialog>
  );
}
