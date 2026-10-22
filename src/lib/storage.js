// Thin localStorage wrapper with JSON + safe fallback.

export const KEYS = {
  lessons: 'mayu_lessons',
  cards: 'mayu_cards',
  stats: 'mayu_stats',
  darkmode: 'mayu_darkmode',
  verbPrefs: 'mayu_verbi_prefs',
  verbs: 'mayu_verbi', // verbi_studiati.json from the last GitHub sync
}

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full / unavailable — fail silently, app still works in-memory
  }
}
