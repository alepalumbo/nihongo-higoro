import { topicStyle } from '../../lib/topics.js'
import { STREAK_MIN, last7, normalizeStats, pct, todaySummary } from '../../lib/stats.js'

export default function StatsPanel({ cards, stats: rawStats }) {
  const stats = normalizeStats(rawStats)
  const today = todaySummary(stats)
  const week = last7(stats.studiedDates)
  const weekMax = Math.max(STREAK_MIN, ...week.map((d) => d.count))

  // Cards per topic in the deck.
  const byTopic = {}
  for (const c of cards) byTopic[c.topic || 'altro'] = (byTopic[c.topic || 'altro'] || 0) + 1
  const topics = Object.entries(byTopic).sort((a, b) => b[1] - a[1])
  const topicMax = Math.max(1, ...topics.map(([, n]) => n))

  // Top 5 topics by number of mistakes.
  const errors = Object.entries(stats.topicErrors)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const errMax = Math.max(1, ...errors.map(([, n]) => n))

  const items = [
    { label: 'Carte nel mazzo', value: cards.length, jp: '単語' },
    { label: 'Sessioni di studio', value: stats.sessions, jp: '回数' },
    { label: `Serie (≥${STREAK_MIN}/giorno)`, value: `${today.streak}🔥`, jp: '連続' },
    { label: 'Studiate oggi', value: today.seen, jp: '今日' },
    { label: 'Corrette oggi', value: today.seen ? `${today.rate}%` : '—', jp: '今日の正解' },
    { label: 'Corrette in totale', value: stats.seen ? `${pct(stats.correct, stats.seen)}%` : '—', jp: '正解率' },
  ]

  return (
    <div className="tab-enter space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-2xl bg-surface p-4 text-center shadow-soft ring-1 ring-line">
            <div className="font-jp text-xs text-accent-400">{it.jp}</div>
            <div className="mt-1 text-3xl font-bold text-txt">{it.value}</div>
            <div className="mt-1 text-xs text-muted">{it.label}</div>
          </div>
        ))}
      </div>

      {/* 7-day study bar chart; bars that reached the daily goal are solid */}
      <Card title="Studiate negli ultimi 7 giorni" note={`obiettivo serie: ${STREAK_MIN}/giorno`}>
        <div className="relative flex items-end justify-between gap-2" style={{ height: 104 }}>
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-accent-400/60"
            style={{ bottom: 20 + (STREAK_MIN / weekMax) * 72 }}
            aria-hidden
          />
          {week.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-semibold text-muted">{d.count || ''}</span>
              <div
                className="w-full rounded-t-md bg-accent-500 transition-all duration-500"
                style={{
                  height: `${(d.count / weekMax) * 72}px`,
                  minHeight: d.count ? 4 : 2,
                  opacity: d.count >= STREAK_MIN ? 1 : d.count ? 0.45 : 0.2,
                }}
                title={`${d.key}: ${d.count}`}
              />
              <span className="text-[10px] capitalize text-muted">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Topics with most mistakes */}
      <Card title="Topic con più errori">
        {errors.length === 0 ? (
          <p className="text-sm text-muted">Ancora nessun errore registrato — continua così!</p>
        ) : (
          <ul className="space-y-2">
            {errors.map(([topic, n]) => (
              <TopicBar
                key={topic}
                topic={topic}
                value={n}
                max={errMax}
                barClass="bg-red-500"
                right={`${n} · ${pct(n, stats.topicSeen[topic] || n)}%`}
              />
            ))}
          </ul>
        )}
      </Card>

      {topics.length > 0 && (
        <Card title="Carte per topic">
          <ul className="space-y-2">
            {topics.map(([topic, n]) => (
              <TopicBar key={topic} topic={topic} value={n} max={topicMax} barClass={topicStyle(topic).badge} right={n} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function Card({ title, note, children }) {
  return (
    <div className="rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-line">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-txt">{title}</p>
        {note && <p className="text-[11px] text-muted">{note}</p>}
      </div>
      {children}
    </div>
  )
}

function TopicBar({ topic, value, max, barClass, right }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex w-24 shrink-0 items-center gap-2 text-xs capitalize text-muted">
        <span className={['h-2.5 w-2.5 rounded-full', topicStyle(topic).dot].join(' ')} />
        {topic}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-line">
        <div className={['h-full rounded-full', barClass].join(' ')} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right text-xs font-semibold text-txt">{right}</span>
    </li>
  )
}
