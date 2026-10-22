import { TABS } from './Tabs.jsx'

// Fixed bottom navigation for mobile (hidden on sm+ where top tabs show).
// Upload lives in the header on mobile, so all five sections fit here.
export default function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigazione principale"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
        {TABS.map((it) => {
          const on = active === it.id
          return (
            <li key={it.id} className="flex-1">
              <button
                onClick={() => onChange(it.id)}
                aria-label={it.label}
                aria-current={on ? 'page' : undefined}
                className={[
                  'tap flex w-full flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition',
                  on ? 'text-accent-600' : 'text-muted hover:text-accent-500',
                ].join(' ')}
              >
                <span className="font-jp text-xl font-bold leading-none" aria-hidden>
                  {it.icon}
                </span>
                {it.short || it.label}
                <span
                  className={['mt-0.5 h-0.5 w-6 rounded-full transition-colors', on ? 'bg-accent-600' : 'bg-transparent'].join(' ')}
                  aria-hidden
                />
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
