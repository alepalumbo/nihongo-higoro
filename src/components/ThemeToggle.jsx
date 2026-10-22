// Animated sun/moon dark-mode toggle.
export default function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      title={dark ? 'Tema chiaro' : 'Tema scuro'}
      className="tap relative grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-surface shadow-soft ring-1 ring-line transition hover:ring-accent-300 active:scale-95"
    >
      {/* Sun */}
      <svg
        viewBox="0 0 24 24"
        className={[
          'absolute h-5 w-5 text-amber-500 transition-all duration-500',
          dark ? 'translate-y-6 rotate-90 opacity-0' : 'translate-y-0 rotate-0 opacity-100',
        ].join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>

      {/* Moon */}
      <svg
        viewBox="0 0 24 24"
        className={[
          'absolute h-5 w-5 text-accent-300 transition-all duration-500',
          dark ? 'translate-y-0 rotate-0 opacity-100' : '-translate-y-6 -rotate-90 opacity-0',
        ].join(' ')}
        fill="currentColor"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  )
}
