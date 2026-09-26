/**
 * Soft radial sprites for canvas fire, one per colour a flame cools through:
 * glow → ember → burnt orange → crimson → ash-red. Pre-rendered once so each
 * frame is only drawImage calls. Browser-only (uses document).
 */

export const FLAME_STAGES: [number, number, number][] = [
  [255, 222, 180],
  [240, 150, 90],
  [212, 98, 47],
  [163, 39, 42],
  [94, 15, 17],
];

function sprite([r, g, b]: [number, number, number]) {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},0.45)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);
  return c;
}

export function flameSprites() {
  return FLAME_STAGES.map(sprite);
}
