// Pill-style segmented control. options: [{ id, label }]
export default function Segmented({ options, value, onChange, label }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex max-w-full flex-wrap rounded-full bg-surface p-1 shadow-soft ring-1 ring-line"
    >
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={[
            'rounded-full px-4 py-1.5 text-sm font-semibold transition',
            value === o.id ? 'bg-accent-600 text-white' : 'text-muted hover:text-accent-500',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
