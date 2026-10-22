// Study statistics, persisted in localStorage (KEYS.stats).
//
// Shape (all fields optional in older saves — always read via normalizeStats):
//   studiedDates  { 'YYYY-MM-DD': answers that day }
//   correctDates  { 'YYYY-MM-DD': correct answers that day }
//   seen, correct  lifetime totals
//   sessions       study sessions (a new one starts after 30 min idle)
//   lastStudyAt    ms timestamp of the last answer
//   topicSeen, topicErrors  { topic: count }

export const STREAK_MIN = 10 // cards per day needed to keep the streak
const SESSION_GAP_MS = 30 * 60 * 1000

export const EMPTY_STATS = {
  studiedDates: {},
  correctDates: {},
  seen: 0,
  correct: 0,
  sessions: 0,
  lastStudyAt: 0,
  topicSeen: {},
  topicErrors: {},
}

export function normalizeStats(s) {
  return { ...EMPTY_STATS, ...(s || {}) }
}

// Local calendar day (not UTC: studying at 00:30 in Italy counts for today).
export function dayKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const bump = (obj, key, by = 1) => ({ ...obj, [key]: (obj[key] || 0) + by })

export function recordStudy(prev, { correct, topic = 'altro' }, now = Date.now()) {
  const s = normalizeStats(prev)
  const today = dayKey(new Date(now))
  return {
    ...s,
    studiedDates: bump(s.studiedDates, today),
    correctDates: correct ? bump(s.correctDates, today) : s.correctDates,
    seen: s.seen + 1,
    correct: s.correct + (correct ? 1 : 0),
    sessions: s.sessions + (now - s.lastStudyAt > SESSION_GAP_MS ? 1 : 0),
    lastStudyAt: now,
    topicSeen: bump(s.topicSeen, topic),
    topicErrors: correct ? s.topicErrors : bump(s.topicErrors, topic),
  }
}

// Consecutive days with at least STREAK_MIN answers, ending today (or
// yesterday, so the streak survives until today's goal is reached).
export function computeStreak(studiedDates = {}, min = STREAK_MIN) {
  const d = new Date()
  if ((studiedDates[dayKey(d)] || 0) < min) d.setDate(d.getDate() - 1)
  let streak = 0
  while ((studiedDates[dayKey(d)] || 0) >= min) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function pct(part, total) {
  return total ? Math.round((part / total) * 100) : 0
}

export function todaySummary(stats) {
  const s = normalizeStats(stats)
  const key = dayKey()
  const seen = s.studiedDates[key] || 0
  const correct = s.correctDates[key] || 0
  return { seen, correct, rate: pct(correct, seen), streak: computeStreak(s.studiedDates) }
}

// Last 7 days (oldest -> today) of study counts.
export function last7(studiedDates = {}) {
  const out = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = dayKey(d)
    out.push({
      key,
      label: d.toLocaleDateString('it-IT', { weekday: 'short' }).slice(0, 2),
      count: studiedDates[key] || 0,
    })
  }
  return out
}
