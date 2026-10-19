/** Logo « ject » suivi d'un point corail (décision 11 ; esquisse typographique). */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <span className="logo" style={{ fontSize: size }} aria-label="Ject">
      ject<span className="logo-dot" aria-hidden="true">.</span>
    </span>
  );
}
