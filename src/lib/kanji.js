// Kanji cards (topic "kanji") — parsing, semantic categories, quiz builders.
//
// CSV format for a kanji card:
//   romaji   = pronunciations          "yama / san"
//   kana     = the kanji               "山"
//   italiano = meaning                 "montagna"
//   hiragana = readings — keywords     "やま・さん — 富士山(ふじさん)"
//
// On'yomi vs kun'yomi: katakana readings are on'yomi (dictionary convention);
// "on:"/"kun:" (or 音/訓) prefixes are honoured. For all-hiragana readings we
// look at the keywords: a reading used inside a multi-kanji compound is on'yomi,
// one used by the kanji alone or with okurigana is kun'yomi.

const KANJI_RE = /[一-鿿㐀-䶿]/
const KATAKANA_RE = /[ァ-ヶ]/

const isKanji = (ch) => KANJI_RE.test(ch)

function splitReadingsAndKeywords(raw) {
  const [readings = '', ...rest] = String(raw || '').split(/\s[—–-]\s|—|–/)
  return { readingsPart: readings.trim(), keywordsPart: rest.join(' ').trim() }
}

function parseKeywords(part) {
  const out = []
  const re = /([^\s、,，;；・()（）]+)\s*[(（]([^)）]+)[)）]/g
  let m
  while ((m = re.exec(part))) out.push({ word: m[1], reading: m[2].trim() })
  return out
}

function classify(reading, kanji, keywords) {
  if (KATAKANA_RE.test(reading)) return 'on'
  if (/[.\-]/.test(reading)) return 'kun'
  const plain = reading.replace(/[.\-]/g, '')
  let on = false
  let kun = false
  for (const k of keywords) {
    if (!k.word.includes(kanji)) continue
    const kanjiCount = [...k.word].filter(isKanji).length
    if (kanjiCount >= 2 && k.reading.includes(plain)) on = true
    if (kanjiCount === 1 && k.reading.startsWith(plain)) kun = true
  }
  if (on && !kun) return 'on'
  if (kun && !on) return 'kun'
  return null
}

export function parseKanjiCard(card) {
  const kanji = (card.kana || '').trim()
  const { readingsPart, keywordsPart } = splitReadingsAndKeywords(card.hiragana)
  const keywords = parseKeywords(keywordsPart)

  let on = []
  let kun = []
  let other = []

  const marked = [...readingsPart.matchAll(/(on|音|kun|訓)\s*[:：]\s*([^|/;]+)/gi)]
  if (marked.length) {
    for (const [, tag, list] of marked) {
      const items = list.split(/[・、,，\s]+/).filter(Boolean)
      if (/^(on|音)$/i.test(tag)) on.push(...items)
      else kun.push(...items)
    }
  } else {
    const readings = readingsPart.split(/[・、,，/／]+/).map((r) => r.trim()).filter(Boolean)
    if (readings.some((r) => KATAKANA_RE.test(r))) {
      // Explicit convention in use: katakana = on'yomi, hiragana = kun'yomi.
      on = readings.filter((r) => KATAKANA_RE.test(r))
      kun = readings.filter((r) => !KATAKANA_RE.test(r))
      readings.length = 0
    }
    for (const r of readings) {
      const c = classify(r, kanji, keywords)
      if (c === 'on') on.push(r)
      else if (c === 'kun') kun.push(r)
      else other.push(r)
    }
    // A kanji card lists both kinds: if one side is known, the rest is the other.
    if (other.length && on.length && !kun.length) [kun, other] = [other, []]
    else if (other.length && kun.length && !on.length) [on, other] = [other, []]
  }

  return {
    kanji,
    meaning: card.italiano || '',
    romaji: card.romaji || '',
    on,
    kun,
    other,
    keywords,
    primary: kun[0] || other[0] || on[0] || '',
  }
}

// ---- semantic categories -------------------------------------------------

export const KANJI_CATEGORIES = [
  { id: 'natura', label: 'Natura', icon: '🌿' },
  { id: 'corpo', label: 'Corpo', icon: '✋' },
  { id: 'azioni', label: 'Azioni', icon: '🏃' },
  { id: 'persone', label: 'Persone', icon: '👤' },
  { id: 'tempo', label: 'Tempo', icon: '⏰' },
  { id: 'luoghi', label: 'Studio e luoghi', icon: '🏫' },
  { id: 'numeri', label: 'Numeri', icon: '🔢' },
  { id: 'altro', label: 'Altro', icon: '✳️' },
]

const BY_KANJI = {
  natura: '山川木林森水火土金石雨天空花草竹雪風海池田気星犬猫魚鳥牛馬虫晴雲',
  corpo: '目耳口手足体頭顔心力歯首毛声',
  azioni: '行来見聞食飲書読話言出入休立帰買売会知思作使持待歩走起寝住泳遊開閉教習勉',
  persone: '人男女子父母兄弟姉妹友名私彼王様君族家',
  tempo: '日月年時分半週今午前後毎朝昼夜夕曜春夏秋冬早間',
  luoghi: '学校生先本字文語国店駅道社室院町村市京東西南北上下中外左右車電門',
  numeri: '一二三四五六七八九十百千万円',
}

const BY_MEANING = [
  ['natura', /montagn|fium|albero|bosc|foresta|acqua|fuoco|terra|pietra|pioggia|cielo|fiore|erba|neve|vento|mare|lago|risaia|campo|stella|animale|cane|gatto|pesce|uccell|sole sereno|nuvol/],
  ['corpo', /occhi|orecchi|bocca|mano|piede|gamba|corpo|testa|viso|faccia|cuore|forza|dent|collo|capell|voce/],
  ['persone', /persona|uomo|donna|bambin|figli|padre|madre|fratell|sorell|amic|nome|famiglia|io\b|lui|lei/],
  ['tempo', /giorno|mese|anno|ora\b|minut|mezz|settiman|adesso|ora,|mattin|pomerigg|sera|notte|primavera|estate|autunno|inverno|prima|dopo|presto|tempo/],
  ['luoghi', /scuola|studi|libro|carattere|lingua|paese|negozio|stazione|strada|citt|paese|nord|sud|est|ovest|sopra|sotto|dentro|fuori|sinistra|destra|auto|treno|elettric|porta|lettera/],
  ['numeri', /^\d|uno|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|cento|mille|diecimila|yen/],
  ['azioni', /^(andare|venire|vedere|guardare|ascoltare|mangiare|bere|scrivere|leggere|parlare|dire|uscire|entrare|riposare|alzarsi|tornare|comprare|vendere|incontrare|sapere|pensare|fare|usare|tenere|aspettare|camminare|correre|dormire|abitare|nuotare|giocare|aprire|chiudere|insegnare|imparare)/],
]

export function kanjiCategory(kanji, meaning = '') {
  for (const [cat, chars] of Object.entries(BY_KANJI)) if (chars.includes(kanji)) return cat
  const m = meaning.toLowerCase()
  for (const [cat, re] of BY_MEANING) if (re.test(m)) return cat
  return 'altro'
}

// ---- quiz builders -------------------------------------------------------

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Pick `n` distinct items from pool (excluding `exclude`), preferring `prefer`.
function distractors(pool, exclude, n, prefer = () => false) {
  const rest = pool.filter((x) => x !== exclude)
  const preferred = shuffle(rest.filter(prefer))
  const others = shuffle(rest.filter((x) => !prefer(x)))
  return [...preferred, ...others].slice(0, n)
}

// Kanji → meaning, 4 options. Meanings are deduplicated.
export function buildMeaningQuestion(items, prev) {
  if (items.length < 4) return null
  const pool = items.filter((k) => k !== prev)
  const target = pool[Math.floor(Math.random() * pool.length)]
  const seen = new Set([target.meaning])
  const wrong = []
  for (const k of distractors(items, target, items.length, (x) => x.category === target.category)) {
    if (wrong.length === 3) break
    if (seen.has(k.meaning)) continue
    seen.add(k.meaning)
    wrong.push(k)
  }
  if (wrong.length < 3) return null
  return { target, options: shuffle([target, ...wrong]).map((k) => k.meaning), answer: target.meaning }
}

// Sentences (topic "frase") containing kanji that also have a kanji card.
export function phraseCandidates(phrases, kanjiItems) {
  const known = new Map(kanjiItems.map((k) => [k.kanji, k]))
  const out = []
  for (const p of phrases) {
    const chars = [...new Set([...(p.kana || '')].filter((ch) => known.has(ch)))]
    if (chars.length) out.push({ phrase: p, chars })
  }
  return out
}

// One sentence with a known kanji blanked out, 4 kanji options.
export function buildPhraseQuestion(candidates, kanjiItems, prev) {
  if (!candidates.length || kanjiItems.length < 4) return null
  const pool = candidates.length > 1 ? candidates.filter((c) => c.phrase !== prev) : candidates
  const { phrase, chars } = pool[Math.floor(Math.random() * pool.length)]
  const answer = chars[Math.floor(Math.random() * chars.length)]
  const target = kanjiItems.find((k) => k.kanji === answer)
  // Never offer another kanji of the same sentence as a "wrong" option.
  const pool2 = kanjiItems.filter((k) => !chars.includes(k.kanji))
  const wrong = distractors(pool2, null, 3, (k) => k.category === target.category)
  if (wrong.length < 3) return null
  const idx = phrase.kana.indexOf(answer)
  return {
    phrase,
    answer,
    before: phrase.kana.slice(0, idx),
    after: phrase.kana.slice(idx + answer.length),
    options: shuffle([answer, ...wrong.map((k) => k.kanji)]),
  }
}

// Kanji cards from the deck, parsed and categorised (deduplicated by kanji).
export function kanjiItemsFromDeck(deck) {
  const map = new Map()
  for (const c of deck) {
    if (c.topic !== 'kanji' || !c.kana) continue
    const k = parseKanjiCard(c)
    if (!map.has(k.kanji)) map.set(k.kanji, { ...k, card: c, category: kanjiCategory(k.kanji, k.meaning) })
  }
  return [...map.values()]
}
