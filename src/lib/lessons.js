// Assign each flashcard to the lesson it belongs to.
//
// The CSV has no lesson column by default, but its rows were appended lesson
// by lesson, so the lesson sequence along the file is non-decreasing. We use
// two signals:
//   1. an optional explicit 6th CSV column ("L3", "3", "Lezione 3") — wins;
//   2. otherwise, whether the card's word appears in a lesson's markdown.
// A small dynamic program then picks the non-decreasing lesson sequence that
// matches the most cards. Unmatched cards inherit their neighbours' lesson,
// and ties lean towards the earlier lesson.
//
// Each returned card also gets `uid` (its row index) — a stable identity even
// when two cards share the same romaji (e.g. kimasu = 来ます / 着ます).

import { lessonNumber } from './merge.js'

export const NO_LESSON = 'Senza lezione'

export function parseLessonRef(value) {
  const m = /(\d+)/.exec(value || '')
  return m ? parseInt(m[1], 10) : null
}

function normLatin(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Japanese strings + romaji regexes that identify a card inside lesson text.
function cardMatchers(card) {
  const jp = []
  const kana = (card.kana || '').trim()
  if (kana) jp.push(kana)
  // Kanji cards keep keywords after "—"; only the readings part is useful.
  const reading = (card.hiragana || '').split('—')[0].trim()
  if (reading && reading !== kana && !reading.includes('・')) jp.push(reading)

  const latin = (card.romaji || '')
    .split('/')
    .map((s) => normLatin(s).replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 3)
    .map((s) => new RegExp(`(^|[^a-z])${escapeRe(s)}($|[^a-z])`))

  return { jp, latin }
}

export function assignLessons(cards, lessons) {
  // Lesson universe: numbered MD lessons + any explicit refs not in the MD.
  const byNum = new Map()
  for (const l of lessons) {
    const num = lessonNumber(l.title)
    if (Number.isFinite(num) && !byNum.has(num)) {
      byNum.set(num, { num, title: l.title, jp: l.content || '', latin: normLatin(l.content || '') })
    }
  }
  for (const c of cards) {
    if (c.lessonRef != null && !byNum.has(c.lessonRef)) {
      byNum.set(c.lessonRef, { num: c.lessonRef, title: `Lezione ${c.lessonRef}`, jp: '', latin: '' })
    }
  }
  const universe = [...byNum.values()].sort((a, b) => a.num - b.num)
  if (!universe.length) return cards.map((c, i) => ({ ...c, uid: i, lesson: NO_LESSON }))

  const n = cards.length
  const L = universe.length
  const NEG = -1e9
  const EPS = 1e-6

  const score = (card, m, l) => {
    if (card.lessonRef != null) return universe[l].num === card.lessonRef ? 0 : NEG
    const lesson = universe[l]
    const hit = m.jp.some((t) => lesson.jp.includes(t)) || m.latin.some((re) => re.test(lesson.latin))
    return (hit ? 1 : 0) - l * EPS
  }

  const parent = new Int32Array(n * L)
  let prev = new Float64Array(L)
  let cur = new Float64Array(L)

  for (let i = 0; i < n; i++) {
    const card = cards[i]
    const m = card.lessonRef != null ? null : cardMatchers(card)
    let bestPrev = NEG
    let bestK = 0
    for (let l = 0; l < L; l++) {
      if (i > 0 && prev[l] > bestPrev) {
        bestPrev = prev[l]
        bestK = l
      }
      cur[l] = score(card, m, l) + (i > 0 ? bestPrev : 0)
      parent[i * L + l] = bestK
    }
    ;[prev, cur] = [cur, prev]
  }

  let l = 0
  for (let k = 1; k < L; k++) if (prev[k] > prev[l]) l = k
  const assigned = new Array(n)
  for (let i = n - 1; i >= 0; i--) {
    assigned[i] = l
    l = parent[i * L + l]
  }

  return cards.map((c, i) => ({ ...c, uid: i, lesson: universe[assigned[i]].title }))
}
