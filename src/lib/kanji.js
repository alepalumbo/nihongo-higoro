// Kanji cards (topic "kanji") — parsing, semantic categories, quiz builders.
//
// CSV format for a kanji card:
//   romaji   = pronunciations          "yama / san"
//   kana     = the kanji               "山"
//   italiano = meaning                 "montagna"
//   hiragana = readings — keywords     "やま・さん — 富士山(ふじさん)"
//
// On'yomi vs kun'yomi: katakana readings are on'yomi (dictionary convention);
// "on:"/"kun:" (or 音/訓) prefixes are honoured; all-hiragana readings are
// split by writing order + compound keywords (see splitOnKun).
// Columns may be swapped (kanji in the romaji column…): see detectFields.

const KANJI_RE = /[一-鿿㐀-䶿]/
const KATAKANA_RE = /[ァ-ヶ]/

const isKanji = (ch) => KANJI_RE.test(ch)

function splitReadingsAndKeywords(raw) {
  const [readings = '', ...rest] = String(raw || '').split(/\s[—–-]\s|—|–/)
  return { readingsPart: readings.trim(), keywordsPart: rest.join(' ').trim() }
}

// Keywords: "富士山(ふじさん)・山にのぼる、食べる" -> [{word, reading}], reading
// optional. Separators inside parentheses are ignored.
function parseKeywords(part) {
  const items = []
  let cur = ''
  let depth = 0
  for (const ch of part) {
    if (ch === '(' || ch === '（') depth++
    if (ch === ')' || ch === '）') depth = Math.max(0, depth - 1)
    if (depth === 0 && /[、,，;；・]/.test(ch)) {
      items.push(cur)
      cur = ''
    } else cur += ch
  }
  items.push(cur)
  return items
    .map((it) => it.trim())
    .filter(Boolean)
    .map((it) => {
      const m = /^(.+?)\s*[(（]([^)）]+)[)）]$/.exec(it)
      return m ? { word: m[1].trim(), reading: m[2].trim() } : { word: it, reading: '' }
    })
}

// A reading attested as on'yomi: it occurs in the reading of a compound
// (2+ kanji) that contains this kanji, e.g. さん in 富士山(ふじさん).
function onEvidence(reading, kanji, keywords) {
  const plain = reading.replace(/[.\-]/g, '')
  return keywords.some(
    (k) => k.reading && k.word.includes(kanji) && [...k.word].filter(isKanji).length >= 2 && k.reading.includes(plain),
  )
}

// Typical on'yomi shape: contracted sound (しゅ, ぎょう), final ん, or two kana
// ending in う/い/く/き/つ/ち (こう, めい, もく…). Okurigana-marked = kun.
function looksOn(reading) {
  if (/[.\-]/.test(reading)) return false
  return /[ゃゅょ]/.test(reading) || /ん$/.test(reading) || (reading.length === 2 && /[ういくきつち]$/.test(reading))
}

// All-hiragana readings carry no script hint, so use the order they are
// written in. The usual order is kun first, then on (やま・さん,
// つき・げつ・がつ): the on block starts at the first attested/on-shaped
// reading after the first one (or at 0 if the first is attested, e.g. 本
// ほん・ぽん). With no clue, the last reading is taken as on (はな・か).
// The reverse order (さん・やま) is recognised when the first reading is
// attested on and the last clearly is not.
function splitOnKun(readings, kanji, keywords) {
  const n = readings.length
  if (!n) return { on: [], kun: [] }
  const ev = readings.map((r) => onEvidence(r, kanji, keywords))
  const isOn = (i) => ev[i] || looksOn(readings[i])
  if (n === 1) return isOn(0) ? { on: [...readings], kun: [] } : { on: [], kun: [...readings] }
  // Compounds can also be read kun+kun (花火 はなび, 明日 あした), so the FIRST
  // reading counts as on only when attested AND on-shaped (本 ほん).
  const firstOn = ev[0] && looksOn(readings[0])
  if (firstOn && !isOn(n - 1)) {
    let b = 1
    while (b < n && isOn(b)) b++
    return { on: readings.slice(0, b), kun: readings.slice(b) }
  }
  let b = firstOn ? 0 : -1
  for (let i = 1; b < 0 && i < n; i++) if (isOn(i)) b = i
  if (b < 0) b = n - 1
  return { kun: readings.slice(0, b), on: readings.slice(b) }
}

const KANJI_ONLY_RE = /^[一-鿿㐀-䶿々]{1,4}$/
const KANA_RE = /[ぁ-ゟァ-ヿ]/
const LATIN_RE = /^[\x20-\x7EÀ-ſ]+$/ // ASCII + accented latin (ō, ū…)

// Kanji rows are hand-made, so tolerate swapped columns: find the field that
// IS the kanji, the one that is romaji and the one holding the kana readings.
function detectFields(card) {
  const f = (v) => String(v || '').trim()
  const kana = f(card.kana)
  const romaji = f(card.romaji)
  const hira = f(card.hiragana)
  const kanji =
    [kana, romaji, hira].find((v) => KANJI_ONLY_RE.test(v)) ||
    [...`${kana}${romaji}`].find(isKanji) ||
    kana
  const pron = [romaji, kana, hira].find((v) => v && v !== kanji && LATIN_RE.test(v) && /[a-z]/i.test(v)) || ''
  const readings = [hira, kana, romaji].find((v) => v && v !== kanji && KANA_RE.test(v)) || ''
  return { kanji, pron, readings }
}

export function parseKanjiCard(card) {
  const { kanji, pron, readings: readingsRaw } = detectFields(card)
  const { readingsPart, keywordsPart } = splitReadingsAndKeywords(readingsRaw)
  const keywords = parseKeywords(keywordsPart)

  let on = []
  let kun = []
  const other = [] // readings that could not be classified (kept for display)

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
    } else {
      ;({ on, kun } = splitOnKun(readings, kanji, keywords))
    }
  }

  return {
    kanji,
    meaning: card.italiano || '',
    romaji: pron,
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
    if (c.topic !== 'kanji') continue
    const k = parseKanjiCard(c)
    if (!k.kanji) continue
    if (!map.has(k.kanji)) map.set(k.kanji, { ...k, card: c, category: kanjiCategory(k.kanji, k.meaning) })
  }
  return [...map.values()]
}
