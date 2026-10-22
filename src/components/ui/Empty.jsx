// Shared empty-state card.
export default function Empty({ icon = '🎴', title, hint, children }) {
  return (
    <div className="tab-enter flex flex-col items-center justify-center rounded-2xl bg-surface px-6 py-14 text-center shadow-soft ring-1 ring-line">
      <div className="mb-3 text-4xl" aria-hidden>
        {icon}
      </div>
      <p className="font-semibold text-txt">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {children}
    </div>
  )
}
