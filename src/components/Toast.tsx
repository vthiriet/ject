import { useEffect, useState } from 'react';

export interface ToastMsg {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

let push: (t: Omit<ToastMsg, 'id'>) => void = () => {};

/** Affiche un message temporaire en bas de l'écran (avec une action « Annuler » éventuelle). */
export function toast(text: string, action?: ToastMsg['action']) {
  push({ text, action });
}

export function Toaster() {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  useEffect(() => {
    push = (t) => setMsg({ ...t, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4500);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <div className="toast" role="status" key={msg.id}>
      <span>{msg.text}</span>
      {msg.action && (
        <button type="button" onClick={() => { msg.action!.run(); setMsg(null); }}>
          {msg.action.label}
        </button>
      )}
    </div>
  );
}
