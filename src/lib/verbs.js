// Verb gym data + answer checking.
// Source of truth: verbi_studiati.json (project root) — every form is
// pre-computed and validated there, so there is no conjugation logic here.
// To add verbs, replace that file and rebuild.

import verbi from '../../verbi_studiati.json' with { type: 'json' }

export const VERBS = verbi

export const VERB_FORMS = [
  { key: 'presente_formale', label: 'Presente formale', hint: '~masu' },
  { key: 'negativo_formale', label: 'Negativo formale', hint: '~masen' },
  { key: 'passato_formale', label: 'Passato formale', hint: '~mashita' },
  { key: 'passato_neg_formale', label: 'Passato negativo formale', hint: '~masen deshita' },
  { key: 'plain_past', label: 'Passato informale', hint: '~ta' },
  { key: 'neg_informale', label: 'Negativo informale', hint: '~nai' },
  { key: 'neg_informale_passato', label: 'Negativo informale passato', hint: '~nakatta' },
  { key: 'forma_te', label: 'Forma -te', hint: '~te' },
  { key: 'forma_te_neg', label: 'Forma -te negativa', hint: '~nakute' },
  { key: 'tai', label: 'Voglio fare', hint: '~tai' },
  { key: 'takunai', label: 'Non voglio fare', hint: '~takunai' },
  { key: 'takatta', label: 'Volevo fare', hint: '~takatta' },
  { key: 'takunakatta', label: 'Non volevo fare', hint: '~takunakatta' },
]

export const FORM_BY_KEY = Object.fromEntries(VERB_FORMS.map((f) => [f.key, f]))

export const GROUP_LABEL = { 1: 'G1 · Godan', 2: 'G2 · Ichidan', 3: 'G3 · Irregolare' }

// Normalise romaji so harmless spelling differences don't count as errors:
// case, spaces ("masen deshita" = "masendeshita"), long-vowel marks
// (ō = ou), Kunrei vs Hepburn (si/shi, tu/tsu…) and n/nn.
export function normalizeRomaji(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, (m) => (m === '\u0304' || m === '\u0302' ? ':' : ''))
    .replace(/o:/g, 'ou')
    .replace(/u:/g, 'uu')
    .replace(/a:/g, 'aa')
    .replace(/e:/g, 'ee')
    .replace(/i:/g, 'ii')
    .replace(/[\s'’\-.]/g, '')
    .replace(/si/g, 'shi')
    .replace(/ti/g, 'chi')
    .replace(/tu/g, 'tsu')
    .replace(/(^|[^sc])hu/g, '$1fu')
    .replace(/zi/g, 'ji')
    .replace(/sy([aou])/g, 'sh$1')
    .replace(/ty([aou])/g, 'ch$1')
    .replace(/zy([aou])/g, 'j$1')
    .replace(/nn/g, 'n')
}

export function isCorrectAnswer(input, expected) {
  return normalizeRomaji(input) !== '' && normalizeRomaji(input) === normalizeRomaji(expected)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function filterVerbs(group) {
  return group === 'all' ? VERBS : VERBS.filter((v) => String(v.gruppo) === String(group))
}

// Random { verb, formKey }, avoiding an immediate repeat of the previous one.
export function pickQuestion(pool, formKeys, prev) {
  if (!pool.length || !formKeys.length) return null
  for (let tries = 0; tries < 10; tries++) {
    const verb = pool[Math.floor(Math.random() * pool.length)]
    const formKey = formKeys[Math.floor(Math.random() * formKeys.length)]
    if (!verb.forme?.[formKey]) continue
    if (prev && prev.verb.romaji === verb.romaji && prev.formKey === formKey && pool.length * formKeys.length > 1) continue
    return { verb, formKey }
  }
  return null
}

// 4 options: the correct form, up to 2 other forms of the SAME verb (tests
// whether you know which form is which) and the same form of other verbs
// (preferably the same group) — all taken from the JSON, never invented.
export function buildOptions({ verb, formKey }) {
  const answer = verb.forme[formKey]
  const seen = new Set([normalizeRomaji(answer)])
  const out = [answer]
  const add = (v) => {
    if (!v || out.length >= 4) return
    const k = normalizeRomaji(v)
    if (seen.has(k)) return
    seen.add(k)
    out.push(v)
  }

  const sameVerb = shuffle(Object.entries(verb.forme).filter(([k]) => k !== formKey).map(([, v]) => v))
  sameVerb.slice(0, 2).forEach(add)

  const others = shuffle(VERBS.filter((v) => v.romaji !== verb.romaji))
  const sameGroup = others.filter((v) => v.gruppo === verb.gruppo)
  for (const v of [...sameGroup, ...others]) add(v.forme?.[formKey])
  for (const v of sameVerb) add(v) // tiny pools: fill from the same verb

  return shuffle(out)
}
