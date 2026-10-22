import { useEffect, useMemo, useRef, useState } from 'react'
import Flashcard from './Flashcard.jsx'
import Controls from './Controls.jsx'
import MultiSelect from '../MultiSelect.jsx'
import Segmented from '../ui/Segmented.jsx'
import Empty from '../ui/Empty.jsx'
import { topicStyle } from '../../lib/topics.js'
import { lessonNumber } from '../../lib/merge.js'
import { NO_LESSON } from '../../lib/lessons.js'

function shuffleArr(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// `cards` is the deck with lessons already assigned (see lessons.js).
export default function FlashcardTab({ cards, furigana, onStudy }) {
  const [mode, setMode] = useState('jp-it') // 'jp-it' | 'it-jp'
  const [shuffled, setShuffled] = useState(false)
  const [seed, setSeed] = useState(0)

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [session, setSession] = useState({ correct: 0, total: 0 })
  const [judged, setJudged] = useState(() => new Set())

  // Available filter values (only lessons/topics that actually have cards).
  const counts = useMemo(() => {
    const lesson = new Map()
    const topic = new Map()
    for (const c of cards) {
      lesson.set(c.lesson, (lesson.get(c.lesson) || 0) + 1)
      topic.set(c.topic || 'altro', (topic.get(c.topic || 'altro') || 0) + 1)
    }
    return { lesson, topic }
  }, [cards])
  const lessonNames = useMemo(
    () => [...counts.lesson.keys()].sort((a, b) => lessonNumber(a) - lessonNumber(b)),
    [counts],
  )
  const topicNames = useMemo(() => [...counts.topic.keys()], [counts])

  // Selections default to "all"; newly-uploaded values auto-join the selection.
  const [selLessons, setSelLessons] = useState(lessonNames)
  const [selTopics, setSelTopics] = useState(topicNames)
  const prevL = useRef(lessonNames)
  const prevT = useRef(topicNames)

  useEffect(() => {
    const added = lessonNames.filter((n) => !prevL.current.includes(n))
    setSelLessons((cur) => [...cur.filter((n) => lessonNames.includes(n)), ...added])
    prevL.current = lessonNames
  }, [lessonNames])

  useEffect(() => {
    const added = topicNames.filter((n) => !prevT.current.includes(n))
    setSelTopics((cur) => [...cur.filter((n) => topicNames.includes(n)), ...added])
    prevT.current = topicNames
  }, [topicNames])

  // Deck = intersection of selected lessons AND selected topics.
  const filtered = useMemo(() => {
    const base = cards.filter(
      (c) => selLessons.includes(c.lesson) && selTopics.includes(c.topic || 'altro'),
    )
    return shuffled ? shuffleArr(base) : base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, selLessons, selTopics, shuffled, seed])

  useEffect(() => {
    setIndex(0)
    setFlipped(false)
  }, [selLessons, selTopics, shuffled, seed, mode])

  const lessonOptions = lessonNames.map((n) => ({ value: n, label: `${n} (${counts.lesson.get(n)})` }))
  const topicOptions = topicNames.map((n) => ({ value: n, label: `${n} (${counts.topic.get(n)})`, dotClass: topicStyle(n).dot }))

  if (!cards.length) {
    return (
      <Empty
        title="Nessuna flashcard"
        hint="Carica il tuo .csv (topic;romaji;kana;italiano;hiragana) con il pulsante Upload."
      />
    )
  }

  const card = filtered[index]

  const go = (delta) => {
    if (!filtered.length) return
    setFlipped(false)
    setIndex((i) => (i + delta + filtered.length) % filtered.length)
  }

  const judge = (correct) => {
    if (!card) return
    if (!judged.has(card.uid)) {
      setJudged((s) => new Set(s).add(card.uid))
      setSession((s) => ({
        correct: s.correct + (correct ? 1 : 0),
        total: s.total + 1,
      }))
      onStudy({ correct, topic: card.topic })
    }
    go(1)
  }

  const resetSession = () => {
    setSession({ correct: 0, total: 0 })
    setJudged(new Set())
    setIndex(0)
    setFlipped(false)
  }

  return (
    <div className="tab-enter space-y-5">
      {/* Dual filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MultiSelect
          label="Filtra per lezione"
          options={lessonOptions}
          selected={selLessons}
          onChange={setSelLessons}
          allLabel="Tutte le lezioni"
        />
        <MultiSelect
          label="Filtra per topic"
          options={topicOptions}
          selected={selTopics}
          onChange={setSelTopics}
          allLabel="Tutti i topic"
        />
      </div>

      {lessonNames.length === 1 && lessonNames[0] === NO_LESSON && (
        <p className="rounded-xl bg-accent-soft px-4 py-2.5 text-xs text-txt">
          Le carte non sono ancora abbinate alle lezioni: carica gli appunti (.md) o premi{' '}
          <strong>Sincronizza</strong> per poter filtrare per lezione.
        </p>
      )}

      {/* Mode + shuffle + count */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Direzione"
          value={mode}
          onChange={setMode}
          options={[
            { id: 'jp-it', label: 'JP → IT' },
            { id: 'it-jp', label: 'IT → JP' },
          ]}
        />
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted">
            {filtered.length} carte selezionate
          </span>
          <button
            onClick={() => {
              setShuffled(true)
              setSeed((s) => s + 1)
            }}
            aria-label="Mescola le carte"
            className="tap rounded-full bg-surface px-4 py-2 text-sm font-medium text-accent-600 shadow-soft ring-1 ring-line transition hover:bg-accent-soft"
          >
            🔀 Mescola
          </button>
        </div>
      </div>

      {!filtered.length ? (
        <Empty title="Nessuna carta per questi filtri" hint="Allarga la selezione di lezioni o topic." />
      ) : (
        <>
          {/* Deck progress bar */}
          <div>
            <div className="mb-1 flex items-center justify-between text-sm text-muted">
              <span>
                Carta {index + 1} / {filtered.length}
              </span>
              <button
                onClick={resetSession}
                className="font-medium text-accent-600 hover:underline"
              >
                Punteggio: {session.correct} / {session.total} · azzera
              </button>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-valuenow={index + 1}
              aria-valuemin={1}
              aria-valuemax={filtered.length}
            >
              <div
                className="h-full rounded-full bg-accent-500 transition-all duration-300"
                style={{ width: `${((index + 1) / filtered.length) * 100}%` }}
              />
            </div>
          </div>

          {/* key changes on navigation (index/shuffle/filter) -> React remounts
              a fresh, unflipped card with no reverse-flip animation, so the
              back is never briefly shown. Flipping in place keeps the same key
              (only `flipped` changes), preserving the flip animation. */}
          <Flashcard
            key={`${seed}-${index}-${card.uid}`}
            card={card}
            flipped={flipped}
            mode={mode}
            furigana={furigana}
            onFlip={() => setFlipped((f) => !f)}
          />

          <Controls
            flipped={flipped}
            onPrev={() => go(-1)}
            onNext={() => go(1)}
            onFlip={() => setFlipped((f) => !f)}
            onGotIt={() => judge(true)}
            onMissed={() => judge(false)}
          />
        </>
      )}
    </div>
  )
}
