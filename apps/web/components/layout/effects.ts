// ON/OFF SWITCH — embers and burning ash drifting over every public page,
// login and signup included (components/home/ash-embers.tsx). Set to false to
// turn them off: nothing is rendered and no animation runs. Visitors who ask
// for reduced motion never see them either way.
//
// The low fire under each page's title is PageHead's FireCanvas; the landing
// hero's fire is part of the hero.
export const ASH_EMBERS = true;

// Card grids ask the embers for quiet: spread QUIET_AIR onto the element and
// the ash thins right out over it, and the pointer stops stirring it up there
// — drifting across cards people are reading, it gets irritating. The sparks a
// burning card throws still show in full.
export const QUIET_AIR = { "data-embers-hush": "" } as const;
