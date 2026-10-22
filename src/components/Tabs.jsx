// App sections — shared by the top tabs (tablet/desktop) and BottomNav (mobile).
export const TABS = [
  { id: 'lessons', label: 'Lezioni', jp: '授業', icon: '📖' },
  { id: 'flashcards', label: 'Flashcard', jp: '単語', icon: '🃏' },
  { id: 'verbs', label: 'Verbi', jp: '動詞', icon: '🏋️' },
  { id: 'kanji', label: 'Kanji', jp: '漢字', icon: '漢' },
  { id: 'stats', label: 'Statistiche', short: 'Stats', jp: '統計', icon: '📊' },
]

export default function Tabs({ active, onChange }) {
  return (
    <nav className="flex items-center gap-1 rounded-full bg-surface p-1 shadow-soft ring-1 ring-line" aria-label="Sezioni">
      {TABS.map((t) => {
        const on = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            aria-current={on ? 'page' : undefined}
            className={[
              'tap relative flex-1 rounded-full px-3 py-2 text-sm font-medium transition-all duration-300',
              on ? 'bg-accent-600 text-white shadow' : 'text-muted hover:text-accent-500',
            ].join(' ')}
          >
            <span className="font-jp mr-1 hidden text-xs opacity-70 md:inline">{t.jp}</span>
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
