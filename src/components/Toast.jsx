export default function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            'toast-in rounded-full px-5 py-2.5 text-sm font-medium shadow-soft',
            t.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-txt text-bg',
          ].join(' ')}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
