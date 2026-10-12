import type { FileDetails } from '../lib/store';
import type { Category, Label } from '../lib/types';
import { FrequencyPicker } from './FrequencyPicker';
import { Segmented } from './Segmented';

export type Details = Omit<FileDetails, 'category'>;

export const EMPTY_DETAILS: Details = { status: 'todo', projectStatus: 'active', frequency: '', labelIds: [] };

/** Précisions facultatives selon le type : état, régularité, aires. */
export function DetailsFields({
  category, value, onChange, labels, title,
}: { category: Category; value: Details; onChange: (d: Details) => void; labels: Label[]; title?: string }) {
  const set = (patch: Partial<Details>) => onChange({ ...value, ...patch });
  const labelIds = value.labelIds ?? [];
  const toggleLabel = (id: string) => set({ labelIds: labelIds.includes(id) ? labelIds.filter((l) => l !== id) : [...labelIds, id] });
  return (
    <>
      {(category !== 'resource' || labels.length > 0) && title && <p className="section-label">{title}</p>}
      {category === 'action' && (
        <Segmented
          value={value.status ?? 'todo'}
          options={[['todo', 'À faire'], ['waiting', 'En attente'], ['someday', 'Un jour']]}
          onChange={(v) => set({ status: v as Details['status'] })}
        />
      )}
      {category === 'project' && (
        <Segmented
          value={value.projectStatus ?? 'active'}
          options={[['active', 'Actif'], ['someday', 'Un jour']]}
          onChange={(v) => set({ projectStatus: v as Details['projectStatus'] })}
        />
      )}
      {category === 'habit' && <FrequencyPicker value={value.frequency ?? ''} onChange={(v) => set({ frequency: v })} />}
      {labels.length > 0 && (
        <div className="chips file-aires" aria-label="Aires">
          {labels.map((l) => (
            <button key={l.id} type="button" className={`chip ${labelIds.includes(l.id) ? 'on' : ''}`} onClick={() => toggleLabel(l.id)}>
              {l.emoji} {l.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
