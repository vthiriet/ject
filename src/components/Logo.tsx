import { useEffect, useState } from 'react';

/** Logo « ject » suivi d'un point corail, qui saute à chaque nouvelle carte (décisions 11, 15). */
export function Logo({ size = 26 }: { size?: number }) {
  const [jump, setJump] = useState(0);
  useEffect(() => {
    const onNew = () => setJump(Date.now());
    window.addEventListener('ject:new-card', onNew);
    return () => window.removeEventListener('ject:new-card', onNew);
  }, []);
  return (
    <span className="logo" style={{ fontSize: size }} role="img" aria-label="Ject">
      ject<span key={jump} className={`logo-dot ${jump ? 'jump' : ''}`} aria-hidden="true">.</span>
    </span>
  );
}
