import { useEffect, useRef } from 'react';

/**
 * Bouton « précédent » du téléphone (historique du navigateur).
 * - Chaque changement d'onglet ajoute une étape : « précédent » revient à l'onglet d'avant.
 * - Chaque fenêtre ouverte (carte, menu, paramètres…) ajoute une étape :
 *   « précédent » la referme au lieu de quitter l'app.
 */

export interface ViewState {
  section: string;
  labelId: string | null;
}

interface Overlay {
  id: number;
  onBack: () => void;
}

const overlays: Overlay[] = [];
let nextId = 1;
/** Retours en arrière demandés par l'app elle-même (fenêtre fermée par un bouton). */
let pendingBack = 0;
/** Événements « popstate » provoqués par l'app, à ne pas traiter. */
let ignorePop = 0;
let currentView: ViewState = { section: 'inbox', labelId: null };
let onView: (v: ViewState) => void = () => {};
let started = false;

function start() {
  if (started || typeof window === 'undefined') return;
  started = true;
  // Retire aussi les paramètres d'adresse (raccourcis, partage) une fois lus.
  history.replaceState({ ject: true, ...currentView }, '', '/');
  window.addEventListener('popstate', (e) => {
    if (ignorePop > 0) {
      ignorePop--;
      return;
    }
    const top = overlays.pop();
    if (top) {
      top.onBack();
      return;
    }
    const state = e.state as (ViewState & { ject?: boolean }) | null;
    if (state?.ject) {
      currentView = { section: state.section, labelId: state.labelId };
      onView(currentView);
    }
  });
}

/** Ajoute une étape à l'historique (en réutilisant une étape tout juste libérée). */
function push() {
  const state = { ject: true, ...currentView };
  if (pendingBack > 0) {
    pendingBack--;
    history.replaceState(state, '');
  } else {
    history.pushState(state, '');
  }
}

/** Retire une étape (plusieurs demandes dans le même instant sont regroupées). */
function back() {
  if (pendingBack++ > 0) return;
  setTimeout(() => {
    const n = pendingBack;
    pendingBack = 0;
    if (n > 0) {
      ignorePop++;
      history.go(-n);
    }
  }, 0);
}

/** À appeler au démarrage : reçoit l'onglet à afficher quand on revient en arrière. */
export function initHistory(view: ViewState, handler: (v: ViewState) => void) {
  currentView = view;
  onView = handler;
  start();
}

/** Nouvel onglet affiché par l'utilisateur. */
export function pushView(view: ViewState) {
  if (view.section === currentView.section && view.labelId === currentView.labelId) return;
  currentView = view;
  start();
  // Un instant plus tard : si un menu se ferme en même temps, son étape est réutilisée.
  setTimeout(push, 0);
}

/** Tant que `open` est vrai, « précédent » appelle `close` au lieu de changer d'écran. */
export function useBackClose(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    start();
    const overlay: Overlay = { id: nextId++, onBack: () => closeRef.current() };
    overlays.push(overlay);
    push();
    return () => {
      // Fermée par un bouton de l'app : on retire son étape de l'historique.
      const i = overlays.indexOf(overlay);
      if (i !== -1) {
        overlays.splice(i, 1);
        back();
      }
    };
  }, [open]);
}
