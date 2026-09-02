/**
 * The sport catalogue for the public pages.
 *
 * This is the marketing-side source of truth: it drives the landing teaser, the
 * /sports grid and its filters, and the sport icons. Live events, fees and slot
 * counts still come from the events API — this only describes what the fest is
 * offering and which poster belongs to it.
 *
 * `poster` is the slug of the artwork in /public (`event-<poster>.jpg`).
 * Category variants deliberately share one poster: the supplied art has no
 * per-category versions, so Volleyball Boys and Volleyball Women both point at
 * `event-volleyball.jpg`.
 *
 * NOTE: the teaser site advertises 17 sports. Twelve posters were supplied, and
 * the entries below are the ones those posters cover. The remaining sports need
 * confirming with the RSP team, and each will need either its own artwork or the
 * fallback treatment before it can be listed here.
 */

export type SportCategory = "Boys" | "Girls" | "Open";
export type SportType = "team" | "individual";

export type Sport = {
  /** Stable id used in URLs and as the React key. */
  id: string;
  name: string;
  category: SportCategory;
  type: SportType;
  /** Short description of the playing format. */
  format: string;
  /** Poster slug in /public — also the sport-icon key. */
  poster: string;
};

export const SPORTS: Sport[] = [
  {
    id: "football",
    name: "Football",
    category: "Open",
    type: "team",
    format: "Team · 11-a-side",
    poster: "football",
  },
  {
    id: "cricket",
    name: "Cricket",
    category: "Open",
    type: "team",
    format: "Team · T20",
    poster: "cricket",
  },
  {
    id: "basketball",
    name: "Basketball",
    category: "Open",
    type: "team",
    format: "Team · 5-a-side",
    poster: "basketball",
  },
  {
    id: "kabaddi",
    name: "Kabaddi",
    category: "Boys",
    type: "team",
    format: "Team · 7-a-side",
    poster: "kabaddi",
  },
  {
    id: "volleyball-boys",
    name: "Volleyball",
    category: "Boys",
    type: "team",
    format: "Team · 6-a-side",
    poster: "volleyball",
  },
  {
    id: "volleyball-girls",
    name: "Volleyball",
    category: "Girls",
    type: "team",
    format: "Team · 6-a-side",
    poster: "volleyball",
  },
  {
    id: "athletics",
    name: "Athletics",
    category: "Open",
    type: "individual",
    format: "Track and field",
    poster: "athletics",
  },
  {
    id: "badminton",
    name: "Badminton",
    category: "Open",
    type: "individual",
    format: "Singles and doubles",
    poster: "badminton",
  },
  {
    id: "tabletennis",
    name: "Table Tennis",
    category: "Open",
    type: "individual",
    format: "Singles and doubles",
    poster: "tabletennis",
  },
  {
    id: "lawntennis",
    name: "Lawn Tennis",
    category: "Open",
    type: "individual",
    format: "Singles and doubles",
    poster: "lawntennis",
  },
  {
    id: "squash",
    name: "Squash",
    category: "Open",
    type: "individual",
    format: "Singles",
    poster: "squash",
  },
  {
    id: "chess",
    name: "Chess",
    category: "Open",
    type: "individual",
    format: "Individual · Swiss format",
    poster: "chess",
  },
  {
    id: "powerlifting",
    name: "Powerlifting",
    category: "Open",
    type: "individual",
    format: "Individual · by weight class",
    poster: "powerlifting",
  },
];

/** The six shown on the landing page before the reader reaches /sports. */
export const FEATURED_SPORT_IDS = [
  "football",
  "cricket",
  "kabaddi",
  "basketball",
  "chess",
  "athletics",
];

export const FEATURED_SPORTS = FEATURED_SPORT_IDS.map(
  (id) => SPORTS.find((s) => s.id === id)!,
).filter(Boolean);

/**
 * Matches a live event's name against the sport catalogue to find its poster.
 * Live events come from the API as free-text names ("Table Tennis", "Football
 * (Open)"); the catalogue's `poster` slug is what the artwork in /public is
 * keyed by. Normalising both to bare letters is enough to match "Table Tennis"
 * to `event-tabletennis.jpg` without a second hand-maintained mapping.
 */
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

export function findSportForEventName(name: string): Sport | undefined {
  const target = normalize(name);
  // Substring, not exact match: real event names carry a year/gender suffix
  // ("Cricket 2K26", "Kabaddi Boys 2K26") that never equals the catalogue's
  // bare "Cricket"/"Kabaddi" — but does contain it.
  return SPORTS.find(
    (s) => target.includes(normalize(s.name)) || target.includes(normalize(s.id)),
  );
}

export const FEST_DATES = {
  start: "2026-10-09T09:00:00+05:30",
  label: "9–11 October 2026",
  shortLabel: "9 — 11 Oct",
} as const;
