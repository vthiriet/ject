import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, KeyboardSensor, pointerWithin, rectIntersection,
  useSensor, useSensors, type CollisionDetection, type DragEndEvent, type DragMoveEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, type ReactNode } from 'react';
import { moveNote } from '../lib/store';
import type { Note } from '../lib/types';

interface Props {
  notes: Note[];
  layout: 'grid' | 'list';
  /** Glisser-déposer actif. */
  sortable: boolean;
  /** Lâcher sur un bord : la carte change de place (désactivé dans l'Inbox). */
  reorder?: boolean;
  /** Lâcher au centre d'une autre carte : les deux fusionnent en une liste. */
  onMerge?: (sourceId: string, targetId: string) => void;
  render: (note: Note) => ReactNode;
}

type Hint = { id: string; mode: 'merge' | 'before' | 'after' } | null;

// La carte sous le doigt (ou la souris), sinon celle qui chevauche le plus.
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

/** Position du doigt ou de la souris au début du glissement. */
function startPoint(e: Event | null) {
  if (!e) return null;
  if ('touches' in e && (e as TouchEvent).touches.length) {
    const t = (e as TouchEvent).touches[0];
    return { x: t.clientX, y: t.clientY };
  }
  if ('clientX' in e) return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  return null;
}

/** Grille (ou liste) de cartes : déplacer pour réordonner, ou lâcher sur une carte pour fusionner. */
export function NoteGrid({ notes, layout, sortable, reorder = true, onMerge, render }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  // Le doigt (ou la souris) a vraiment bougé depuis le début du glissement.
  const [moved, setMoved] = useState(false);
  const [hint, setHint] = useState<Hint>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // Sur téléphone : appui long (250 ms) pour déplacer, sinon on fait défiler.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!sortable) {
    return <div className={`note-grid ${layout}`}>{notes.map((n) => <div key={n.id}>{render(n)}</div>)}</div>;
  }

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
    setMoved(false);
    navigator.vibrate?.(20);
  };

  const onDragMove = ({ active, over, activatorEvent, delta }: DragMoveEvent) => {
    if (!moved && (Math.abs(delta.x) > 10 || Math.abs(delta.y) > 10)) setMoved(true);
    if (!over || over.id === active.id) return setHint(null);
    const start = startPoint(activatorEvent);
    const r = over.rect;
    const x = start ? start.x + delta.x : r.left + r.width / 2;
    const y = start ? start.y + delta.y : r.top + r.height / 2;
    const rx = (x - r.left) / r.width;
    const ry = (y - r.top) / r.height;
    // Zone centrale : fusion. Bords : placer avant ou après.
    if (onMerge && rx > 0.2 && rx < 0.8 && ry > 0.2 && ry < 0.8) return setHint({ id: String(over.id), mode: 'merge' });
    if (!reorder) return setHint(null);
    const before = layout === 'list' ? ry < 0.5 : rx < 0.5;
    setHint({ id: String(over.id), mode: before ? 'before' : 'after' });
  };

  const onDragEnd = ({ active }: DragEndEvent) => {
    const h = hint;
    setActiveId(null);
    setHint(null);
    if (!h || h.id === active.id) return;
    const source = String(active.id);
    if (h.mode === 'merge') {
      onMerge?.(source, h.id);
      return;
    }
    const rest = notes.filter((n) => n.id !== source);
    const i = rest.findIndex((n) => n.id === h.id);
    if (i === -1) return;
    // Positions décroissantes de haut en bas : on se place entre deux voisins.
    if (h.mode === 'before') void moveNote(source, rest[i - 1], rest[i]);
    else void moveNote(source, rest[i], rest[i + 1]);
  };

  const active = notes.find((n) => n.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setHint(null);
      }}
    >
      {/* Les cartes ne se décalent pas pendant le glissement : la cible reste sous le doigt. */}
      <SortableContext items={notes.map((n) => n.id)} strategy={() => null}>
        <div className={`note-grid ${layout} ${activeId ? 'dragging-active' : ''}`}>
          {notes.map((n) => (
            <SortableItem key={n.id} id={n.id} lifted={moved} hint={hint?.id === n.id ? hint.mode : undefined}>
              {render(n)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {active ? (
          <div className="dragging">
            {render(active)}
            {hint?.mode === 'merge' && <span className="merge-label">Fusionner en liste</span>}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableItem({ id, hint, lifted, children }: { id: string; hint?: 'merge' | 'before' | 'after'; lifted: boolean; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const { role: _role, tabIndex: _tab, ...attrs } = attributes;
  return (
    <div
      ref={setNodeRef}
      className={`drag-item ${hint ? `drop-${hint}` : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging && lifted ? 0.3 : 1 }}
      {...attrs}
      {...listeners}
    >
      {children}
    </div>
  );
}
