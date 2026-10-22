export default function Toast({ toasts }) {
  return (
    // Above the mobile bottom nav; long messages wrap instead of overflowing.
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[70] flex w-[min(92vw,28rem)] -translate-x-1/2 flex-col items-center gap-2 sm:bottom-5">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === 'error' ? 'alert' : 'status'}
          className={[
            'toast-in rounded-2xl px-5 py-2.5 text-center text-sm font-medium shadow-soft',
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
