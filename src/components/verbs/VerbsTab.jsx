import { useEffect, useMemo, useRef, useState } from 'react'
import { KEYS } from '../../lib/storage.js'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import {
  VERBS, VERB_FORMS, FORM_BY_KEY, GROUP_LABEL,
  filterVerbs, pickQuestion, buildOptions, isCorrectAnswer,
} from '../../lib/verbs.js'
import JapaneseText from '../JapaneseText.jsx'
import Segmented from '../ui/Segmented.jsx'
import ChoiceGrid from '../ui/ChoiceGrid.jsx'
import Empty from '../ui/Empty.jsx'

const DEFAULT_PREFS = {
  group: 'all',
  mode: 'choice', // 'choice' | 'write'
  forms: VERB_FORMS.map((f) => f.key),
  hints: true,
}

const GROUP_STYLE = {
  1: 'bg-blue-500',
  2: 'bg-green-600',
  3: 'bg-amber-500',
}

export default function VerbsTab({ furigana, onStudy }) {
  const [stored, setPrefs] = useLocalStorage(KEYS.verbPrefs, DEFAULT_PREFS)
  const prefs = { ...DEFAULT_PREFS, ...stored }
  const update = (patch) => setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, ...patch }))

  const pool = useMemo(() => filterVerbs(prefs.group), [prefs.group])
  const formsKey = prefs.forms.join(',')

  // First question is ready on mount (no empty-state flash).
  const [q, setQ] = useState(() => pickQuestion(pool, prefs.forms, null))
  const [options, setOptions] = useState(() => (q ? buildOptions(q) : []))
  const [picked, setPicked] = useState(null) // MC choice or submitted text
  const [input, setInput] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [showSettings, setShowSettings] = useState(false)
  const inputRef = useRef(null)

  const next = (prev) => {
    const nq = pickQuestion(pool, prefs.forms, prev)
    setQ(nq)
    setOptions(nq ? buildOptions(nq) : [])
    setPicked(null)
    setInput('')
    setShowHint(false)
  }

  // New question whenever the filters change (not on mount).
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    next(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.group, formsKey])

  useEffect(() => {
    if (prefs.mode === 'write' && picked == null) inputRef.current?.focus()
  }, [q, prefs.mode, picked])

  const answer = q ? q.verb.forme[q.formKey] : ''
  const done = picked != null
  const correct = done && (prefs.mode === 'choice' ? picked === answer : isCorrectAnswer(picked, answer))

  const submit = (value) => {
    if (done || !q) return
    if (prefs.mode === 'write' && !value.trim()) return
    setPicked(value)
    const ok = prefs.mode === 'choice' ? value === answer : isCorrectAnswer(value, answer)
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
    onStudy({ correct: ok, topic: 'verbo' })
  }

  const toggleForm = (key) =>
    update({ forms: prefs.forms.includes(key) ? prefs.forms.filter((k) => k !== key) : [...prefs.forms, key] })

  const groupCounts = useMemo(() => {
    const c = { all: VERBS.length }
    VERBS.forEach((v) => (c[v.gruppo] = (c[v.gruppo] || 0) + 1))
    return c
  }, [])

  return (
    <div className="tab-enter space-y-4">
      {/* Settings */}
      <section className="rounded-2xl bg-surface p-4 shadow-soft ring-1 ring-line">
        <button
          onClick={() => setShowSettings((s) => !s)}
          aria-expanded={showSettings}
          className="tap flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-semibold text-txt">
            ⚙️ Impostazioni
            <span className="ml-2 font-normal text-muted">
              {prefs.group === 'all' ? 'tutti i gruppi' : `G${prefs.group}`} · {prefs.forms.length} forme ·{' '}
              {prefs.mode === 'choice' ? 'scelta multipla' : 'scrittura'}
            </span>
          </span>
          <span className={['text-accent-500 transition-transform', showSettings ? 'rotate-180' : ''].join(' ')} aria-hidden>
            ▾
          </span>
        </button>

        {showSettings && (
          <div className="mt-4 space-y-4">
            <Field label="Gruppo verbale">
              <Segmented
                label="Gruppo verbale"
                value={prefs.group}
                onChange={(group) => update({ group })}
                options={[
                  { id: 'all', label: `Tutti (${groupCounts.all})` },
                  { id: '1', label: `G1 (${groupCounts[1] || 0})` },
                  { id: '2', label: `G2 (${groupCounts[2] || 0})` },
                  { id: '3', label: `G3 (${groupCounts[3] || 0})` },
                ]}
              />
            </Field>

            <Field label="Modalità">
              <Segmented
                label="Modalità"
                value={prefs.mode}
                onChange={(mode) => {
                  update({ mode })
                  next(null)
                }}
                options={[
                  { id: 'choice', label: 'Scelta multipla' },
                  { id: 'write', label: 'Scrittura libera' },
                ]}
              />
            </Field>

            <Field
              label="Forme da esercitare"
              extra={
                <span className="flex gap-3 text-xs font-medium">
                  <button className="text-accent-600 hover:underline" onClick={() => update({ forms: VERB_FORMS.map((f) => f.key) })}>
                    Tutte
                  </button>
                  <button className="text-muted hover:underline" onClick={() => update({ forms: [] })}>
                    Nessuna
                  </button>
                </span>
              }
            >
              <div className="flex flex-wrap gap-2">
                {VERB_FORMS.map((f) => {
                  const on = prefs.forms.includes(f.key)
                  return (
                    <button
                      key={f.key}
                      onClick={() => toggleForm(f.key)}
                      aria-pressed={on}
                      className={[
                        'rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition',
                        on ? 'bg-accent-soft text-accent-600 ring-accent-400' : 'bg-bg text-muted ring-line hover:text-txt',
                      ].join(' ')}
                    >
                      {on ? '✓ ' : ''}
                      {f.label} <span className="font-normal opacity-70">{f.hint}</span>
                    </button>
                  )
                })}
              </div>
            </Field>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-txt">
              <input
                type="checkbox"
                checked={prefs.hints}
                onChange={(e) => update({ hints: e.target.checked })}
                className="h-4 w-4 accent-indigo-600"
              />
              Mostra sempre gruppo e traduzione come aiuto
            </label>
          </div>
        )}
      </section>

      {!q ? (
        <Empty
          icon="🏋️"
          title="Nessun esercizio disponibile"
          hint="Seleziona almeno una forma da esercitare."
        />
      ) : (
        <>
          <div className="flex items-center justify-between px-1 text-sm text-muted">
            <span>{pool.length} verbi nel gruppo</span>
            <button onClick={() => setScore({ correct: 0, total: 0 })} className="font-medium text-accent-600 hover:underline">
              Punteggio: {score.correct} / {score.total} · azzera
            </button>
          </div>

          {/* Question */}
          <section className="rounded-3xl bg-surface p-6 shadow-soft ring-1 ring-line">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Coniuga il verbo</span>
              {(prefs.hints || showHint || done) && (
                <span className={['rounded-full px-2.5 py-1 text-[11px] font-semibold text-white', GROUP_STYLE[q.verb.gruppo]].join(' ')}>
                  {GROUP_LABEL[q.verb.gruppo]}
                </span>
              )}
            </div>

            <div className="mt-4 text-center">
              <JapaneseText
                card={{ kana: q.verb.kana, hiragana: q.verb.hiragana, romaji: q.verb.romaji }}
                mode={furigana}
                className="text-4xl font-bold leading-tight text-txt"
              />
              {furigana !== 'romaji' && <div className="mt-1 text-sm font-medium text-muted">{q.verb.romaji}</div>}
              {prefs.hints || showHint || done ? (
                <div className="mt-2 text-sm text-txt">“{q.verb.italiano}”</div>
              ) : (
                <button onClick={() => setShowHint(true)} className="mt-2 text-xs font-medium text-accent-600 hover:underline">
                  💡 Mostra aiuto
                </button>
              )}
            </div>

            <div className="mt-5 flex justify-center">
              <span className="rounded-full bg-accent-soft px-4 py-2 text-sm font-bold text-accent-600 ring-1 ring-accent-400">
                → {FORM_BY_KEY[q.formKey].label} <span className="font-medium opacity-80">({FORM_BY_KEY[q.formKey].hint})</span>
              </span>
            </div>
          </section>

          {/* Answer */}
          {prefs.mode === 'choice' ? (
            <ChoiceGrid options={options} answer={answer} picked={picked} onPick={submit} />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (done) next(q)
                else submit(input)
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={done}
                placeholder="Scrivi in romaji…"
                aria-label="Risposta in romaji"
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                className={[
                  'min-w-0 flex-1 rounded-xl bg-surface px-4 py-3 text-base text-txt shadow-soft ring-1 placeholder:text-muted focus:outline-none',
                  !done ? 'ring-line focus:ring-accent-400' : correct ? 'ring-2 ring-green-600' : 'ring-2 ring-red-600',
                ].join(' ')}
              />
              {!done && (
                <button type="submit" className="tap rounded-xl bg-accent-600 px-5 text-sm font-semibold text-white shadow-soft hover:bg-accent-700">
                  Verifica
                </button>
              )}
            </form>
          )}

          {/* Feedback */}
          {done && (
            <section
              role="status"
              className={[
                'tab-enter rounded-2xl p-4 ring-1',
                correct ? 'bg-green-600/10 ring-green-600/40' : 'bg-red-600/10 ring-red-600/40',
              ].join(' ')}
            >
              <p className={['font-bold', correct ? 'text-green-600' : 'text-red-600'].join(' ')}>
                {correct ? '✓ Corretto!' : '✗ Sbagliato'}
              </p>
              <p className="mt-1 text-sm text-txt">
                {FORM_BY_KEY[q.formKey].label} di <span className="font-jp">{q.verb.kana}</span>:{' '}
                <mark className="rounded bg-accent-soft px-1.5 py-0.5 font-bold text-accent-600">{answer}</mark>
              </p>
              {!correct && prefs.mode === 'write' && (
                <p className="mt-1 text-xs text-muted">Hai scritto: {picked}</p>
              )}
              {q.verb.nota && <p className="mt-2 text-xs text-muted">{q.verb.nota}</p>}
              <button
                onClick={() => next(q)}
                autoFocus
                className="tap mt-3 w-full rounded-xl bg-accent-600 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-accent-700"
              >
                Avanti →
              </button>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function Field({ label, extra, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
        {extra}
      </div>
      {children}
    </div>
  )
}
