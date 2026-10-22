// Furigana display modes + Japanese text helpers.

export const FURIGANA_MODES = ['furigana', 'kana', 'romaji']

export const FURIGANA_LABELS = {
  furigana: '漢字＋ふりがな',
  kana: 'ひらがな',
  romaji: 'Romaji',
}

export function nextFuriganaMode(mode) {
  const i = FURIGANA_MODES.indexOf(mode)
  return FURIGANA_MODES[(i + 1) % FURIGANA_MODES.length]
}

// Character class tests (per Unicode block).
const KANJI_RE = /[一-鿿㐀-䶿]/

export function hasKanji(text) {
  return KANJI_RE.test(text || '')
}

function isKanjiChar(ch) {
  return KANJI_RE.test(ch)
}

// Katakana -> hiragana (length-preserving) so kana written in either script
// can be matched against the all-hiragana reading.
function kataToHira(text) {
  let out = ''
  for (const ch of text) {
    const code = ch.codePointAt(0)
    if (code >= 0x30a1 && code <= 0x30f6) out += String.fromCodePoint(code - 0x60)
    else out += ch
  }
  return out
}

// Split a word into alternating runs of kanji / non-kanji.
function tokenizeRuns(word) {
  const runs = []
  for (const ch of word) {
    const kanji = isKanjiChar(ch)
    const last = runs[runs.length - 1]
    if (last && last.kanji === kanji) last.text += ch
    else runs.push({ kanji, text: ch })
  }
  return runs
}

// Produce furigana segments for a word.
//   kana    = the word as written (kanji / hiragana / katakana mix)
//   reading = full hiragana reading of the word
// Returns: [{ text }]  for plain runs
//          [{ text, rt }] for kanji runs that carry a reading
//
// Furigana is attached ONLY to kanji runs. Hiragana/katakana render plain.
// Per-kanji readings are derived by aligning the kana field against the
// reading and assigning, to each kanji run, the slice of the reading that
// sits between the surrounding kana runs.
export function segmentFurigana(kana, reading) {
  const runs = tokenizeRuns(kana || '')
  if (!reading) {
    // No reading available: still avoid annotating non-kanji; annotate nothing.
    return runs.map((r) => ({ text: r.text }))
  }

  const nreading = kataToHira(reading)
  let p = 0
  const segs = []

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i]
    if (!run.kanji) {
      // Plain kana run: consume the matching part of the reading.
      const norm = kataToHira(run.text)
      if (nreading.startsWith(norm, p)) p += norm.length
      else {
        const found = nreading.indexOf(norm, p)
        if (found !== -1) p = found + norm.length
      }
      segs.push({ text: run.text })
      continue
    }

    // Kanji run: reading = slice up to where the next kana run begins.
    const next = runs[i + 1]
    let rt
    if (next) {
      const nextNorm = kataToHira(next.text)
      const q = nreading.indexOf(nextNorm, p)
      if (q !== -1) {
        rt = reading.slice(p, q)
        p = q
      } else {
        rt = reading.slice(p)
        p = reading.length
      }
    } else {
      rt = reading.slice(p)
      p = reading.length
    }
    segs.push({ text: run.text, rt: rt || undefined })
  }

  return segs
}
