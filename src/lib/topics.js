// Topic metadata: color classes for badges/pills. Each entry has a solid
// variant (badge on card) and a soft variant (filter pill).

export const TOPIC_STYLES = {
  sostantivo:  { badge: 'bg-blue-500',   soft: 'bg-blue-100 text-blue-700 ring-blue-200',     dot: 'bg-blue-500' },
  verbo:       { badge: 'bg-green-500',  soft: 'bg-green-100 text-green-700 ring-green-200',   dot: 'bg-green-500' },
  aggettivo:   { badge: 'bg-orange-500', soft: 'bg-orange-100 text-orange-700 ring-orange-200',dot: 'bg-orange-500' },
  frase:       { badge: 'bg-purple-500', soft: 'bg-purple-100 text-purple-700 ring-purple-200',dot: 'bg-purple-500' },
  espressione: { badge: 'bg-pink-500',   soft: 'bg-pink-100 text-pink-700 ring-pink-200',     dot: 'bg-pink-500' },
  ora:         { badge: 'bg-teal-500',   soft: 'bg-teal-100 text-teal-700 ring-teal-200',     dot: 'bg-teal-500' },
  mese:        { badge: 'bg-teal-500',   soft: 'bg-teal-100 text-teal-700 ring-teal-200',     dot: 'bg-teal-500' },
  giorno:      { badge: 'bg-teal-500',   soft: 'bg-teal-100 text-teal-700 ring-teal-200',     dot: 'bg-teal-500' },
  colore:      { badge: 'bg-rose-500',   soft: 'bg-rose-100 text-rose-700 ring-rose-200',     dot: 'bg-rose-500' },
  numero:      { badge: 'bg-amber-500',  soft: 'bg-amber-100 text-amber-700 ring-amber-200',  dot: 'bg-amber-500' },
  saluto:      { badge: 'bg-cyan-500',   soft: 'bg-cyan-100 text-cyan-700 ring-cyan-200',     dot: 'bg-cyan-500' },
  kanji:       { badge: 'bg-stone-700',  soft: 'bg-stone-100 text-stone-700 ring-stone-200',  dot: 'bg-stone-700' },
  altro:       { badge: 'bg-gray-400',   soft: 'bg-gray-100 text-gray-600 ring-gray-200',     dot: 'bg-gray-400' },
}

export function topicStyle(topic) {
  return TOPIC_STYLES[topic] || TOPIC_STYLES.altro
}
