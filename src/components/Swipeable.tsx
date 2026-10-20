import { useRef, useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Texte et icône révélés derrière la carte pendant le glisser. */
  reveal: ReactNode;
  /** Appelé quand le doigt est relâché au-delà du seuil. */
  onSwipe: () => void;
}

/**
 * Glisser une carte vers la gauche au doigt (Actions : rendre prioritaire). Seulement au toucher :
 * à la souris, le glisser-déposer des cartes garde la main. La carte revient en place
 * avant que l'action ne s'applique, pour qu'elle ne bouge jamais sous le doigt.
 */
export function Swipeable({ children, reveal, onSwipe }: Props) {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number; id: number; swiping: boolean } | null>(null);
  const skipClick = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch' || (e.target as HTMLElement).closest('button, a')) return;
    skipClick.current = false;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId, swiping: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!s.swiping) {
      if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
      // Seulement un glisser franchement horizontal vers la gauche ; sinon on laisse défiler.
      if (mx > 0 || Math.abs(mx) < Math.abs(my) * 1.5) {
        start.current = null;
        return;
      }
      s.swiping = true;
    }
    setDx(Math.min(0, mx));
  };

  const onPointerUp = () => {
    const s = start.current;
    start.current = null;
    if (!s?.swiping) return;
    skipClick.current = true;
    const width = ref.current?.offsetWidth ?? 160;
    const done = -dx > width * 0.35;
    setDx(0);
    if (done) setTimeout(onSwipe, 200);
  };

  return (
    <div
      ref={ref}
      className={`swipe ${dx ? 'swiping' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        start.current = null;
        setDx(0);
      }}
      onClickCapture={(e) => {
        if (!skipClick.current) return;
        skipClick.current = false;
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div className="swipe-reveal" aria-hidden="true">{reveal}</div>
      <div className="swipe-body" style={dx ? { transform: `translateX(${dx}px)`, transition: 'none' } : undefined}>
        {children}
      </div>
    </div>
  );
}
