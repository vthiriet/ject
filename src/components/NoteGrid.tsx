import {
  closestCenter, DndContext, DragOverlay, MouseSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, type ReactNode } from 'react';
import { moveNote } from '../lib/store';
import type { Note } from '../lib/types';

interface Props {
  notes: Note[];
  layout: 'grid' | 'list';
  sortable: boolean;
  render: (note: Note) => ReactNode;
}

/** Grille (ou liste) de notes, réordonnables par glisser-déposer. */
export function NoteGrid({ notes, layout, sortable, render }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
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
    navigator.vibrate?.(20);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const to = notes.findIndex((n) => n.id === over.id);
    const rest = notes.filter((n) => n.id !== active.id);
    // Après retrait, la note prend la place `to` : ses voisins sont rest[to-1] et rest[to].
    void moveNote(String(active.id), rest[to - 1], rest[to]);
  };

  const active = notes.find((n) => n.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={notes.map((n) => n.id)} strategy={rectSortingStrategy}>
        <div className={`note-grid ${layout}`}>
          {notes.map((n) => (
            <SortableItem key={n.id} id={n.id}>{render(n)}</SortableItem>
          ))}
        </div>
      </SortableContext>
      <DragOverlay>{active ? <div className="dragging">{render(active)}</div> : null}</DragOverlay>
    </DndContext>
  );
}

function SortableItem({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const { role: _role, tabIndex: _tab, ...attrs } = attributes;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      {...attrs}
      {...listeners}
    >
      {children}
    </div>
  );
}
