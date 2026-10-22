// "Sincronizza" button: cloud icon, spinner while downloading, disabled offline.
// `compact` renders the round icon-only variant used in the mobile header.
export default function SyncButton({ onSync, syncing, online, compact = false }) {
  const label = !online ? 'Offline — usa l’upload manuale' : syncing ? 'Sincronizzazione…' : 'Sincronizza da GitHub'
  const icon = syncing ? <Spinner /> : <span aria-hidden>{online ? '☁️' : '📴'}</span>

  return (
    <button
      onClick={onSync}
      disabled={!online || syncing}
      aria-label={label}
      aria-busy={syncing}
      title={label}
      className={[
        'tap inline-flex items-center justify-center gap-2 bg-surface text-sm font-medium shadow-soft ring-1 ring-line transition',
        compact ? 'h-11 w-11 rounded-full text-lg' : 'rounded-full px-4 py-2',
        !online || syncing ? 'cursor-not-allowed opacity-60' : 'text-accent-600 hover:bg-accent-soft',
      ].join(' ')}
    >
      {icon}
      {!compact && <span>{syncing ? 'Sincronizzo…' : online ? 'Sincronizza' : 'Offline'}</span>}
    </button>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-accent-500" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
