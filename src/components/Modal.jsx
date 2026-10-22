// Lightweight confirmation modal with an optional preview body.
export default function Modal({ open, title, message, body, confirmLabel = 'Continua', cancelLabel = 'Annulla', onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="toast-in w-full max-w-sm rounded-2xl bg-elevated p-6 shadow-soft ring-1 ring-line"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 className="mb-2 text-lg font-bold text-txt">{title}</h3>}
        {message && <p className="text-sm leading-relaxed text-muted">{message}</p>}
        {body && <div className="mt-3 max-h-52 overflow-auto rounded-xl bg-bg p-3 text-sm">{body}</div>}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="tap rounded-full px-4 py-2 text-sm font-semibold text-muted ring-1 ring-line transition hover:bg-bg"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="tap rounded-full bg-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent-700 active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
