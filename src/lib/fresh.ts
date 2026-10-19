/** Dernière carte ajoutée : elle apparaît avec un ressort, et le point du logo saute (décision 15). */
let last: { id: string; at: number } | null = null;

export function markAdded(id: string) {
  last = { id, at: Date.now() };
  window.dispatchEvent(new CustomEvent('ject:new-card'));
}

export const isFresh = (id: string) => !!last && last.id === id && Date.now() - last.at < 1500;
