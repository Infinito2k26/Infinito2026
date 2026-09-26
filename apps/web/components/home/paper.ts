/**
 * Shared bits of the parchment look for the sport "fight bills": the paper's
 * grain, its deckled outline, and its colour. Used both by the CSS (the paper
 * as rendered before hydration, and on touch devices) and by PaperBurn, which
 * paints the same paper into a canvas so it can burn.
 */

export const PAPER_COLOR = "#e6d8bd";

// Fibre and speckle: brown fractal noise at low alpha, tiled.
export const PAPER_GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .38 0 0 0 0 .26 0 0 0 0 .15 0 0 0 .28 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

// A deckled (hand-torn) outline, as a clip-path polygon. Deterministic, so
// server and client agree.
function deckle() {
  const rand = (i: number) => {
    const x = Math.sin(i * 91.345) * 47453.5453;
    return x - Math.floor(x);
  };
  const steps = 18;
  const pts: string[] = [];
  const j = (i: number) => (rand(i) * 1.1).toFixed(2);
  for (let i = 0; i < steps; i++) pts.push(`${((i / steps) * 100).toFixed(2)}% ${j(i)}%`);
  for (let i = 0; i < steps; i++) pts.push(`${(100 - +j(i + 40)).toFixed(2)}% ${((i / steps) * 100).toFixed(2)}%`);
  for (let i = 0; i < steps; i++) pts.push(`${(100 - (i / steps) * 100).toFixed(2)}% ${(100 - +j(i + 80)).toFixed(2)}%`);
  for (let i = 0; i < steps; i++) pts.push(`${j(i + 120)}% ${(100 - (i / steps) * 100).toFixed(2)}%`);
  return `polygon(${pts.join(", ")})`;
}

export const PAPER_DECKLE = deckle();
