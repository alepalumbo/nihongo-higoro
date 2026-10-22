// CSV format (v4): topic;romaji;kana;italiano;hiragana[;lezione]
//   - columns 1-4 required, column 5 (hiragana) optional
//   - kana   = the word as written (may contain kanji/katakana)
//   - hiragana = full hiragana reading of the word (used by "Solo Hiragana");
//     for topic "kanji" it holds readings + keywords ("やま・さん — 富士山(ふじさん)")
//   - lezione (optional 6th column) = explicit lesson ("L3", "3", "Lezione 3");
//     when absent the lesson is inferred (see lessons.js)
// Back-compat:
//   - 4 columns  -> hiragana defaults to "" (falls back to kana at render time)
//   - 3 columns  (romaji;kana;italiano) -> topic defaults to "altro"
// Returns: [{ topic, romaji, kana, furigana, hiragana, italiano, lessonRef? }]

import { parseLessonRef } from './lessons.js'

const KNOWN_TOPICS = new Set([
  'sostantivo', 'aggettivo', 'verbo', 'frase', 'espressione',
  'ora', 'mese', 'giorno', 'colore', 'numero', 'saluto', 'altro', 'kanji',
])

export function parseCsv(text) {
  const out = []
  const lines = text.split(/\r?\n/)

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const parts = (line.includes(';') ? line.split(';') : line.split(',')).map(
      (p) => (p ?? '').trim(),
    )

    let topic, romaji, kana, italiano, hiragana, lessonCol
    if (parts.length >= 5) {
      ;[topic, romaji, kana, italiano, hiragana, lessonCol] = parts
    } else if (parts.length === 4) {
      ;[topic, romaji, kana, italiano] = parts
      hiragana = ''
    } else {
      // old 3-column form
      ;[romaji, kana, italiano] = parts
      topic = 'altro'
      hiragana = ''
    }

    // Skip an obvious header row.
    const lc = `${topic} ${romaji} ${italiano}`.toLowerCase()
    if (lc.includes('romaji') && lc.includes('italiano')) continue

    if (!romaji) continue

    const t = (topic || 'altro').toLowerCase()
    const card = {
      topic: KNOWN_TOPICS.has(t) ? t : 'altro',
      romaji,
      kana: kana || '',
      furigana: kana || '',
      hiragana: hiragana || '',
      italiano: italiano || '',
    }
    const ref = parseLessonRef(lessonCol)
    if (ref != null) card.lessonRef = ref
    out.push(card)
  }

  return out
}
