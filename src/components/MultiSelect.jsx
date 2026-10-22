import { useEffect, useRef, useState } from 'react'

// Generic multi-select dropdown with select-all / deselect-all.
//  options:  [{ value, label, dotClass? }]
//  selected: array of selected values
//  onChange: (nextArray) => void
//  allLabel: text shown when every option is selected (e.g. "Tutte le lezioni")
export default function MultiSelect({ label, options, selected, onChange, allLabel }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const allValues = options.map((o) => o.value)
  const allSelected = selected.length === options.length && options.length > 0
  const noneSelected = selected.length === 0

  const toggle = (value) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    )
  }

  const summary = allSelected
    ? allLabel
    : noneSelected
    ? 'Nessuna selezione'
    : `${selected.length} selezionate`

  const active = !allSelected // filtering is "on" when not everything is selected

  return (
    <div className="relative w-full" ref={ref}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex w-full items-center justify-between gap-2 rounded-xl bg-surface px-4 py-2.5 text-sm font-medium shadow-soft ring-1 transition',
          active ? 'text-accent-500 ring-accent-400' : 'text-muted ring-line',
        ].join(' ')}
      >
        <span className="flex items-center gap-2 truncate">
          {summary}
          {active && (
            <span className="rounded-full bg-accent-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {selected.length}
            </span>
          )}
        </span>
        <span className={['text-muted transition-transform', open ? 'rotate-180' : ''].join(' ')}>▾</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl bg-elevated p-2 shadow-soft ring-1 ring-line">
          <div className="mb-1 flex gap-1 border-b border-line pb-2">
            <button
              onClick={() => onChange(allValues)}
              className="flex-1 rounded-lg bg-accent-soft px-2 py-1.5 text-xs font-semibold text-accent-600 hover:opacity-80"
            >
              Seleziona tutto
            </button>
            <button
              onClick={() => onChange([])}
              className="flex-1 rounded-lg bg-bg px-2 py-1.5 text-xs font-semibold text-muted hover:bg-line"
            >
              Deseleziona
            </button>
          </div>
          <ul className="space-y-0.5">
            {options.map((o) => {
              const on = selected.includes(o.value)
              return (
                <li key={o.value}>
                  <button
                    onClick={() => toggle(o.value)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-txt hover:bg-bg"
                  >
                    <span
                      className={[
                        'flex h-4 w-4 items-center justify-center rounded border text-[10px] text-white',
                        on ? 'border-accent-600 bg-accent-600' : 'border-line',
                      ].join(' ')}
                    >
                      {on ? '✓' : ''}
                    </span>
                    {o.dotClass && <span className={['h-2.5 w-2.5 rounded-full', o.dotClass].join(' ')} />}
                    <span className="truncate capitalize">{o.label}</span>
                  </button>
                </li>
              )
            })}
            {options.length === 0 && (
              <li className="px-2 py-1.5 text-xs text-muted">Nessuna opzione</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
