import { useMemo, useState } from 'react'
import LessonCard from './LessonCard.jsx'
import { sortLessons } from '../../lib/merge.js'
import Empty from '../ui/Empty.jsx'

export default function LessonsTab({ lessons, furigana = 'furigana' }) {
  const [query, setQuery] = useState('')
  const ordered = useMemo(() => sortLessons(lessons), [lessons])

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!q) return ordered
    return ordered.filter(
      (l) => l.title.toLowerCase().includes(q) || (l.content || '').toLowerCase().includes(q),
    )
  }, [ordered, q])

  if (!lessons.length) {
    return (
      <Empty icon="📖" title="Nessuna lezione ancora" hint="Carica il file .md delle lezioni con il pulsante Upload." />
    )
  }

  return (
    <div className="tab-enter space-y-3">
      {/* Search across all lessons */}
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca parole in tutte le lezioni…"
          aria-label="Cerca nelle lezioni"
          className="w-full rounded-xl bg-surface py-3 pl-11 pr-4 text-sm text-txt shadow-soft ring-1 ring-line placeholder:text-muted focus:outline-none focus:ring-accent-400"
        />
      </div>

      {q && (
        <p className="px-1 text-xs text-muted">
          {filtered.length} lezion{filtered.length === 1 ? 'e' : 'i'} con “{query.trim()}”
        </p>
      )}

      {filtered.length === 0 ? (
        <Empty icon="🔍" title="Nessun risultato" hint="Prova un altro termine di ricerca." />
      ) : (
        filtered.map((l, i) => (
          <LessonCard key={l.title} lesson={l} defaultOpen={!q && i === 0} furigana={furigana} query={q} />
        ))
      )}
    </div>
  )
}
