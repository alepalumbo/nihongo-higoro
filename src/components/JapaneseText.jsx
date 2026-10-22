import { hasKanji, segmentFurigana } from '../lib/japanese.js'
import { parseKanjiCard } from '../lib/kanji.js'

// Renders a word's Japanese form according to the furigana mode.
//  - furigana: furigana sits ONLY above kanji runs; hiragana/katakana render
//              plain (never annotated). Reading source = hiragana field.
//  - kana:     "Solo Hiragana" — show the hiragana reading directly (no ruby).
//              Falls back to the kana field when no hiragana column was given.
//  - romaji:   romaji only, no Japanese characters.
// Kanji cards (topic "kanji") keep readings + keywords in `hiragana`, so they
// never get furigana (it would give the answer away): kanji, readings or romaji.
export default function JapaneseText({ card, mode, className = '' }) {
  const { kana, romaji, hiragana } = card

  if (card.topic === 'kanji') {
    const k = parseKanjiCard(card)
    if (mode === 'romaji') return <span className={className}>{k.romaji || romaji}</span>
    if (mode === 'kana') {
      const readings = [...k.kun, ...k.on, ...k.other].join('・')
      return <span className={`font-jp ${className}`}>{readings || k.kanji}</span>
    }
    return <span className={`font-jp ${className}`}>{k.kanji}</span>
  }

  if (mode === 'romaji') {
    return <span className={className}>{romaji}</span>
  }

  if (mode === 'kana') {
    return <span className={`font-jp ${className}`}>{hiragana || kana || romaji}</span>
  }

  // furigana mode
  if (!hasKanji(kana)) {
    return <span className={`font-jp ${className}`}>{kana || romaji}</span>
  }

  // Prefer the hiragana reading; fall back to whole-word romaji if absent.
  const reading = hiragana || romaji
  const segs = segmentFurigana(kana, reading)

  return (
    <span className={`font-jp ${className}`}>
      {segs.map((s, i) =>
        s.rt ? (
          <ruby key={i}>
            {s.text}
            <rt>{s.rt}</rt>
          </ruby>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </span>
  )
}
