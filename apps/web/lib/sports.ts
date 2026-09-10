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
    category: "Boys",
    type: "team",
    format: "Team · 11-a-side",
    poster: "football",
  },
  {
    id: "football-girls",
    name: "Football",
    category: "Girls",
    type: "team",
    format: "Team · 7-a-side",
    poster: "football",
  },
  {
    id: "cricket",
    name: "Cricket",
    category: "Boys",
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
    id: "kabaddi-girls",
    name: "Kabaddi",
    category: "Girls",
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
    id: "badminton",
    name: "Badminton",
    category: "Boys",
    type: "individual",
    format: "Singles and doubles",
    poster: "badminton",
  },
  {
    id: "badminton-girls",
    name: "Badminton",
    category: "Girls",
    type: "individual",
    format: "Singles and doubles",
    poster: "badminton",
  },
  {
    id: "tabletennis",
    name: "Table Tennis",
    category: "Boys",
    type: "individual",
    format: "Singles and doubles",
    poster: "tabletennis",
  },
  {
    id: "tabletennis-girls",
    name: "Table Tennis",
    category: "Girls",
    type: "individual",
    format: "Singles and doubles",
    poster: "tabletennis",
  },
  {
    id: "lawntennis",
    name: "Lawn Tennis",
    category: "Boys",
    type: "individual",
    format: "Singles and doubles",
    poster: "lawntennis",
  },
  {
    id: "lawntennis-girls",
    name: "Lawn Tennis",
    category: "Girls",
    type: "individual",
    format: "Singles and doubles",
    poster: "lawntennis",
  },
  {
    id: "squash",
    name: "Squash",
    category: "Boys",
    type: "individual",
    format: "Singles",
    poster: "squash",
  },
  {
    id: "squash-girls",
    name: "Squash",
    category: "Girls",
    type: "individual",
    format: "Singles",
    poster: "squash",
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

export const GIRLS_POSTER_SLUGS = new Set([
  "football",
  "badminton",
  "kabaddi",
  "volleyball",
  "lawntennis",
  "tabletennis",
  "squash",
]);

export function getSportPosterPath(posterSlug: string, isGirls = false): string {
  const clean = posterSlug.replace(/-girls$/, "").replace(/-boys$/, "").toLowerCase();
  if (isGirls && GIRLS_POSTER_SLUGS.has(clean)) {
    return `/event-${clean}-girls.jpg`;
  }
  return `/event-${clean}.jpg`;
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

export function findSportForEventName(name: string, genderCategory?: string): Sport | undefined {
  const target = normalize(name);
  const isFemale =
    genderCategory?.toUpperCase() === "WOMEN" ||
    target.includes("women") ||
    target.includes("womens") ||
    target.includes("girls") ||
    target.includes("female");

  if (isFemale) {
    const femaleMatch = SPORTS.find(
      (s) =>
        s.category === "Girls" &&
        (target.includes(normalize(s.name)) || target.includes(normalize(s.id))),
    );
    if (femaleMatch) return femaleMatch;
  }

  const nonFemaleMatch = SPORTS.find(
    (s) =>
      s.category !== "Girls" &&
      (target.includes(normalize(s.name)) || target.includes(normalize(s.id))),
  );
  if (nonFemaleMatch) return nonFemaleMatch;

  return SPORTS.find(
    (s) => target.includes(normalize(s.name)) || target.includes(normalize(s.id)),
  );
}

export const FEST_DATES = {
  start: "2026-10-09T09:00:00+05:30",
  label: "9–11 October 2026",
  shortLabel: "9 — 11 Oct",
} as const;
