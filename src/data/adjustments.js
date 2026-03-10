/**
 * Valuation adjustment categories with display labels and guidance hints.
 */
export const ADJUSTMENTS = [
  { k: "engineProgram", l: "Engine Program",   h: "+0.5–1.5 MSP/ESP/JSSI · –1–2 none" },
  { k: "inspection",    l: "Major Inspection", h: "+0.3–0.8 recent · –0.5–1 due soon" },
  { k: "avionics",      l: "Avionics / WiFi",  h: "+0.3–0.8 AVANCE L5 · –0.5 outdated" },
  { k: "interior",      l: "Interior",         h: "+0.3–1 fresh · –0.5–2 worn" },
  { k: "exterior",      l: "Paint / Exterior",  h: "+0.1–0.3 fresh · –0.3 worn" },
  { k: "damage",        l: "Damage / STC",     h: "–1–5 accident/STC" },
  { k: "pedigree",      l: "Pedigree",         h: "+0.3–0.8 corp · –0.5–2 frac/charter" },
]

/** Default adjustment values (all zero). */
export const DEFAULT_ADJS = {
  engineProgram: 0,
  inspection: 0,
  avionics: 0,
  interior: 0,
  exterior: 0,
  damage: 0,
  pedigree: 0,
}
