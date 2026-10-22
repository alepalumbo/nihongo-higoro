import JapaneseText from '../JapaneseText.jsx'
import { topicStyle } from '../../lib/topics.js'

// 3D flip card.
//  mode:      'jp-it' | 'it-jp'  — which face is the prompt
//  furigana:  'furigana' | 'kana' | 'romaji'  — JP rendering style
export default function Flashcard({ card, flipped, mode, furigana, onFlip }) {
  const jpToIt = mode === 'jp-it'
  const ts = topicStyle(card.topic)

  return (
    <div className="perspective w-full select-none">
      <div
        onClick={onFlip}
        role="button"
        aria-label="Gira la carta"
        className={['flip-inner relative h-64 w-full cursor-pointer sm:h-72', flipped ? 'is-flipped' : ''].join(' ')}
      >
        {/* ---------- FRONT (prompt) ---------- */}
        <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-surface p-6 text-txt shadow-soft ring-1 ring-line">
          {/* Prominent topic badge */}
          <Badge ts={ts} topic={card.topic} prominent />
          <span className="absolute left-4 top-4 text-xs font-medium uppercase tracking-wide text-muted">
            {jpToIt ? '日本語' : 'Italiano'}
          </span>

          {jpToIt ? (
            <JapaneseText card={card} mode={furigana} className="text-4xl font-bold leading-tight sm:text-5xl" />
          ) : (
            <div className="text-center text-3xl font-bold leading-tight sm:text-4xl">{card.italiano || '—'}</div>
          )}

          <span className="absolute bottom-4 text-xs text-muted">tocca per girare</span>
        </div>

        {/* ---------- BACK (answer, clearly separated fields) ---------- */}
        <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center gap-0 rounded-3xl bg-carddark p-6 text-white shadow-soft">
          <Badge ts={ts} topic={card.topic} onDark />
          <span className="absolute left-4 top-4 text-xs font-medium uppercase tracking-wide text-white/70">
            Risposta
          </span>

          {/* 1. Kana / Kanji */}
          <JapaneseText card={card} mode={furigana} className="text-3xl font-bold leading-tight sm:text-4xl" />
          <Divider />
          {/* 2. Romaji (already shown above in Romaji mode) */}
          {furigana !== 'romaji' && (
            <>
              <div className="text-base font-medium tracking-wide text-white/70">{card.romaji}</div>
              <Divider />
            </>
          )}
          {/* 3. Italiano */}
          <div className="text-2xl font-bold text-accent-100 sm:text-3xl">{card.italiano || '—'}</div>
        </div>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="my-2 h-px w-16 bg-white/20" />
}

function Badge({ ts, topic, onDark, prominent }) {
  return (
    <span
      className={[
        'absolute right-4 top-4 rounded-full font-semibold capitalize text-white shadow-sm',
        prominent ? 'px-3 py-1.5 text-xs tracking-wide ring-2 ring-white/40' : 'px-2.5 py-1 text-[11px]',
        ts.badge,
        onDark ? 'ring-2 ring-white/30' : '',
      ].join(' ')}
    >
      {topic}
    </span>
  )
}
