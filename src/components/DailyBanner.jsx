import { useState } from 'react'
import { STREAK_MIN, todaySummary } from '../lib/stats.js'
import { randomMotivation } from '../lib/motivation.js'

// Streak, today's progress and a motivational phrase, shown above the tabs.
export default function DailyBanner({ stats }) {
  const { seen, streak } = todaySummary(stats)
  const [phrase, setPhrase] = useState(() => randomMotivation())
  const goal = Math.min(seen, STREAK_MIN)

  return (
    <section className="mb-5 flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-soft ring-1 ring-line sm:flex-row sm:items-center sm:gap-5">
      <div className="flex shrink-0 items-center gap-4">
        <div className="text-center" title={`Giorni consecutivi con almeno ${STREAK_MIN} carte`}>
          <div className="text-2xl font-bold leading-none text-txt">
            {streak}
            <span aria-hidden>🔥</span>
          </div>
          <div className="mt-1 text-[11px] text-muted">{streak === 1 ? 'giorno' : 'giorni'}</div>
        </div>
        <div className="min-w-[7rem]">
          <div className="text-sm font-semibold text-txt">{seen} carte oggi</div>
          <div
            className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-label="Obiettivo giornaliero"
            aria-valuenow={goal}
            aria-valuemin={0}
            aria-valuemax={STREAK_MIN}
          >
            <div className="h-full rounded-full bg-accent-500 transition-all" style={{ width: `${(goal / STREAK_MIN) * 100}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-muted">
            {seen >= STREAK_MIN ? 'Obiettivo raggiunto ✓' : `${STREAK_MIN - seen} alla serie`}
          </div>
        </div>
      </div>

      <button
        onClick={() => setPhrase((p) => randomMotivation(p))}
        title="Un'altra frase"
        className="min-w-0 flex-1 rounded-xl bg-bg px-3 py-2 text-left transition hover:bg-accent-soft sm:border-l sm:border-line"
      >
        <span className="block font-jp text-base font-semibold text-txt">{phrase.jp}</span>
        <span className="block text-xs text-muted">
          {phrase.romaji} — {phrase.it}
        </span>
      </button>
    </section>
  )
}
