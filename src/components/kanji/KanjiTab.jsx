import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  KANJI_CATEGORIES, kanjiItemsFromDeck, buildMeaningQuestion, phraseCandidates, buildPhraseQuestion,
} from '../../lib/kanji.js'
import JapaneseText from '../JapaneseText.jsx'
import Segmented from '../ui/Segmented.jsx'
import ChoiceGrid from '../ui/ChoiceGrid.jsx'
import Empty from '../ui/Empty.jsx'

const CAT_BY_ID = Object.fromEntries(KANJI_CATEGORIES.map((c) => [c.id, c]))

export default function KanjiTab({ deck, furigana, onStudy }) {
  const items = useMemo(() => kanjiItemsFromDeck(deck), [deck])
  const [view, setView] = useState('grid') // 'grid' | 'quiz' | 'phrases'
  const [category, setCategory] = useState('all')
  const [detail, setDetail] = useState(null)

  const filtered = useMemo(
    () => (category === 'all' ? items : items.filter((k) => k.category === category)),
    [items, category],
  )
  const presentCats = KANJI_CATEGORIES.filter((c) => items.some((k) => k.category === c.id))

  if (!items.length) {
    return (
      <Empty
        icon="漢"
        title="Nessun kanji ancora"
        hint="Aggiungi al CSV delle righe con topic “kanji”, ad esempio:"
      >
        <code className="mt-3 block max-w-full overflow-x-auto rounded-lg bg-bg px-3 py-2 text-left text-xs text-txt ring-1 ring-line">
          kanji;yama / san;山;montagna;やま・さん — 富士山(ふじさん)
        </code>
        <p className="mt-2 max-w-sm text-xs text-muted">
          Consiglio: scrivi l’on’yomi in katakana (やま・サン) così le letture vengono etichettate con certezza.
        </p>
      </Empty>
    )
  }

  return (
    <div className="tab-enter space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Modalità kanji"
          value={view}
          onChange={setView}
          options={[
            { id: 'grid', label: '漢 Griglia' },
            { id: 'quiz', label: 'Quiz significato' },
            { id: 'phrases', label: 'Kanji nelle frasi' },
          ]}
        />
        <span className="text-sm text-muted">{items.length} kanji studiati</span>
      </div>

      {view !== 'phrases' && presentCats.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categoria">
          <CatChip on={category === 'all'} onClick={() => setCategory('all')}>
            Tutti ({items.length})
          </CatChip>
          {presentCats.map((c) => (
            <CatChip key={c.id} on={category === c.id} onClick={() => setCategory(c.id)}>
              {c.icon} {c.label} ({items.filter((k) => k.category === c.id).length})
            </CatChip>
          ))}
        </div>
      )}

      {view === 'grid' && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {filtered.map((k) => (
            <button
              key={k.kanji}
              onClick={() => setDetail(k)}
              aria-label={`${k.kanji}: ${k.meaning}`}
              className="tap flex flex-col items-center justify-center rounded-2xl bg-surface px-2 py-4 shadow-soft ring-1 ring-line transition hover:ring-accent-400 active:scale-95"
            >
              <span className="font-jp text-4xl font-bold leading-none text-txt">{k.kanji}</span>
              <span className="mt-2 truncate font-jp text-xs text-muted">{k.primary || k.romaji}</span>
            </button>
          ))}
        </div>
      )}

      {view === 'quiz' && <MeaningQuiz items={filtered} onStudy={onStudy} onOpen={setDetail} />}
      {view === 'phrases' && <PhraseQuiz deck={deck} items={items} furigana={furigana} onStudy={onStudy} />}

      {detail && <KanjiDetail k={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

function CatChip({ on, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={[
        'rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition',
        on ? 'bg-accent-600 text-white ring-accent-600' : 'bg-surface text-muted ring-line hover:text-txt',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Score({ score, onReset }) {
  return (
    <div className="flex justify-end px-1 text-sm">
      <button onClick={onReset} className="font-medium text-accent-600 hover:underline">
        Punteggio: {score.correct} / {score.total} · azzera
      </button>
    </div>
  )
}

function useQuiz(build, deps, onStudy, topic = 'kanji') {
  const [q, setQ] = useState(() => build(null)) // first question ready on mount, no empty flash
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const mounted = useRef(false)
  const next = (prev) => {
    setQ(build(prev))
    setPicked(null)
  }
  // New question when the source data changes (not on mount).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    next(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  const pick = (o) => {
    if (picked != null || !q) return
    setPicked(o)
    const ok = o === q.answer
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
    onStudy({ correct: ok, topic })
  }
  return { q, picked, pick, next, score, reset: () => setScore({ correct: 0, total: 0 }) }
}

function MeaningQuiz({ items, onStudy, onOpen }) {
  const { q, picked, pick, next, score, reset } = useQuiz((prev) => buildMeaningQuestion(items, prev?.target), [items], onStudy)
  if (!q) return <Empty icon="❓" title="Servono almeno 4 kanji" hint="Scegli “Tutti” o una categoria con più kanji." />
  const done = picked != null
  return (
    <div className="space-y-4">
      <Score score={score} onReset={reset} />
      <section className="rounded-3xl bg-surface p-8 text-center shadow-soft ring-1 ring-line">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Cosa significa?</p>
        <p className="mt-3 font-jp text-7xl font-bold text-txt">{q.target.kanji}</p>
        {done && <Readings k={q.target} compact />}
      </section>
      <ChoiceGrid options={q.options} answer={q.answer} picked={picked} onPick={pick} />
      {done && (
        <div className="flex gap-2">
          <button onClick={() => onOpen(q.target)} className="tap flex-1 rounded-xl bg-surface py-2.5 text-sm font-semibold text-accent-600 ring-1 ring-line">
            Dettagli
          </button>
          <button onClick={() => next(q)} autoFocus className="tap flex-[2] rounded-xl bg-accent-600 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-accent-700">
            Avanti →
          </button>
        </div>
      )}
    </div>
  )
}

function PhraseQuiz({ deck, items, furigana, onStudy }) {
  const candidates = useMemo(
    () => phraseCandidates(deck.filter((c) => c.topic === 'frase'), items),
    [deck, items],
  )
  const { q, picked, pick, next, score, reset } = useQuiz((prev) => buildPhraseQuestion(candidates, items, prev?.phrase), [candidates], onStudy)

  if (!q) {
    return (
      <Empty
        icon="📝"
        title="Nessuna frase disponibile"
        hint="Servono almeno 4 kanji studiati e frasi (topic “frase”) che li contengano."
      />
    )
  }
  const done = picked != null
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 text-sm text-muted">
        <span>{candidates.length} frasi con kanji noti</span>
        <Score score={score} onReset={reset} />
      </div>
      <section className="rounded-3xl bg-surface p-6 text-center shadow-soft ring-1 ring-line">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Quale kanji manca?</p>
        <p className="mt-4 font-jp text-2xl font-bold leading-relaxed text-txt sm:text-3xl">
          {q.before}
          <span
            className={[
              'mx-1 inline-block min-w-[1.6em] rounded-md border-b-4 px-1',
              !done ? 'border-accent-500 text-transparent' : picked === q.answer ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600',
            ].join(' ')}
          >
            {done ? q.answer : '＿'}
          </span>
          {q.after}
        </p>
        <p className="mt-3 text-sm text-muted">“{q.phrase.italiano}”</p>
        {done && (
          <div className="tab-enter mt-4 border-t border-line pt-4">
            <JapaneseText card={q.phrase} mode={furigana} className="text-lg text-txt" />
            <p className="mt-1 text-xs text-muted">{q.phrase.romaji}</p>
          </div>
        )}
      </section>
      <ChoiceGrid options={q.options} answer={q.answer} picked={picked} onPick={pick} optionClass="text-center font-jp text-3xl" />
      {done && (
        <button onClick={() => next(q)} autoFocus className="tap w-full rounded-xl bg-accent-600 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-accent-700">
          Avanti →
        </button>
      )}
    </div>
  )
}

function ReadingRow({ label, jp, values }) {
  if (!values.length) return null
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
        {label} <span className="font-jp normal-case">{jp}</span>
      </span>
      <span className="font-jp text-lg text-txt">{values.join('・')}</span>
    </div>
  )
}

function Readings({ k, compact }) {
  return (
    <div className={['space-y-1.5 text-left', compact ? 'mx-auto mt-4 inline-block' : ''].join(' ')}>
      <ReadingRow label="On'yomi" jp="音読み" values={k.on} />
      <ReadingRow label="Kun'yomi" jp="訓読み" values={k.kun} />
      <ReadingRow label="Letture" jp="" values={k.other} />
      {k.romaji && (
        <div className="flex items-baseline gap-3">
          <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">Romaji</span>
          <span className="text-sm text-txt">{k.romaji}</span>
        </div>
      )}
    </div>
  )
}

function KanjiDetail({ k, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const cat = CAT_BY_ID[k.category]
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Kanji ${k.kanji}`}
        onClick={(e) => e.stopPropagation()}
        className="toast-in max-h-[90vh] w-full overflow-auto rounded-t-3xl bg-elevated p-6 shadow-soft ring-1 ring-line sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-start justify-between">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-600">
            {cat.icon} {cat.label}
          </span>
          <button onClick={onClose} aria-label="Chiudi" className="tap -mr-2 -mt-2 rounded-full text-xl text-muted hover:text-txt">
            ✕
          </button>
        </div>
        <p className="mt-2 text-center font-jp text-8xl font-bold text-txt">{k.kanji}</p>
        <p className="mt-2 text-center text-xl font-semibold text-accent-600">{k.meaning}</p>
        <div className="mt-5 rounded-2xl bg-bg p-4">
          <Readings k={k} />
        </div>
        {k.keywords.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Parole chiave</p>
            <ul className="space-y-1.5">
              {k.keywords.map((w) => (
                <li key={w.word} className="flex items-baseline justify-between gap-3 rounded-xl bg-bg px-3 py-2">
                  <span className="font-jp text-lg font-semibold text-txt">{w.word}</span>
                  <span className="font-jp text-sm text-muted">{w.reading}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
