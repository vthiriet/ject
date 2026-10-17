import {
  closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode, Ref } from 'react';
import { Icon } from './Icon';

export interface RowDrag {
  ref: Ref<HTMLLIElement>;
  style: CSSProperties;
  /** Poignée à tenir pour déplacer l'élément. */
  handle: ReactNode;
}

/** Éléments d'une liste réordonnables par une poignée (le texte reste modifiable). */
export function SortableRows({
  ids, onMove, children,
}: { ids: string[]; onMove: (from: string, to: string) => void; children: (id: string, drag: RowDrag) => ReactNode }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul>{ids.map((id) => <Row key={id} id={id} render={children} />)}</ul>
      </SortableContext>
    </DndContext>
  );
}

function Row({ id, render }: { id: string; render: (id: string, drag: RowDrag) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 2 : undefined,
    background: isDragging ? 'var(--note-bg)' : undefined,
    boxShadow: isDragging ? 'var(--shadow)' : undefined,
  };
  const handle = (
    <button type="button" ref={setActivatorNodeRef} className="drag-handle" aria-label="Déplacer l'élément" {...attributes} {...listeners}>
      <Icon name="drag" size={20} />
    </button>
  );
  return <>{render(id, { ref: setNodeRef, style, handle })}</>;
}
