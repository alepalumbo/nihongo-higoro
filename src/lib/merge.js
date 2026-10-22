// Additive merge helpers — never destructive.

// Cards: dedupe by romaji (lowercased). Incoming cards win on conflict so a
// re-upload can fix a typo, but nothing existing is dropped.
// Returns { merged, added } where added = count of brand-new romaji keys.
export function mergeCards(existing, incoming, lesson) {
  const map = new Map()
  for (const c of existing) map.set(c.romaji.toLowerCase(), c)

  let added = 0
  for (const c of incoming) {
    const key = c.romaji.toLowerCase()
    if (!map.has(key)) added++
    map.set(key, { ...c, lesson: lesson || c.lesson || 'Senza lezione' })
  }
  return { merged: [...map.values()], added }
}

// Extract the lesson number from a title like "Lezione 2 — 15 giugno".
// Returns Infinity when none is found so such lessons sort to the end.
export function lessonNumber(title) {
  const m = /lezione\s+(\d+)/i.exec(title || '')
  return m ? parseInt(m[1], 10) : Infinity
}

// Chronological order: by lesson number ascending (oldest first). Stable for
// ties / number-less titles.
export function sortLessons(lessons) {
  return [...lessons].sort((a, b) => lessonNumber(a.title) - lessonNumber(b.title))
}

// Lessons: dedupe by title (same title updates in place), then ALWAYS sort
// chronologically before storing. MD upload stays additive.
// Returns { merged, added }.
export function mergeLessons(existing, incoming) {
  const byTitle = new Map(existing.map((l) => [l.title, l]))

  let added = 0
  for (const l of incoming) {
    if (byTitle.has(l.title)) byTitle.set(l.title, l) // update in place
    else {
      added++
      byTitle.set(l.title, l)
    }
  }

  return { merged: sortLessons([...byTitle.values()]), added }
}
