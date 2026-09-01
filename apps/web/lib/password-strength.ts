/**
 * A lightweight, dependency-free password strength heuristic for the signup
 * form. It isn't a substitute for server-side policy — just a hint that
 * gives the user something to act on before they submit.
 */

export type PasswordStrength = {
  /** 0 (empty) through 4 (very strong). */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** CSS custom property to drive the meter's color. */
  color: string;
};

const LABELS = ["Too short", "Weak", "Fair", "Strong", "Very strong"] as const;
const COLORS = [
  "var(--bone-300)",
  "var(--err)",
  "var(--warn)",
  "var(--ok)",
  "var(--ok)",
] as const;

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) {
    return { score: 0, label: LABELS[0], color: COLORS[0] };
  }

  let score = 1;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) score++;

  const clamped = Math.min(score, 4) as 1 | 2 | 3 | 4;
  return { score: clamped, label: LABELS[clamped], color: COLORS[clamped] };
}
