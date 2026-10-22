export default function Controls({ flipped, onPrev, onNext, onFlip, onGotIt, onMissed }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        <Btn onClick={onPrev} variant="ghost">← Prec.</Btn>
        <Btn onClick={onFlip} variant="solid">↻ Gira</Btn>
        <Btn onClick={onNext} variant="ghost">Succ. →</Btn>
      </div>

      {flipped && (
        <div className="tab-enter flex items-center justify-center gap-3">
          <Btn onClick={onMissed} variant="miss">✗ Sbagliata</Btn>
          <Btn onClick={onGotIt} variant="got">✓ Giusta</Btn>
        </div>
      )}
    </div>
  )
}

function Btn({ children, onClick, variant }) {
  const styles = {
    solid: 'bg-accent-600 text-white hover:bg-accent-700',
    ghost: 'bg-surface text-muted ring-1 ring-line hover:bg-bg',
    got: 'bg-green-600 text-white hover:bg-green-700 ring-2 ring-green-300/40',
    miss: 'bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-300/40',
  }[variant]
  return (
    <button
      onClick={onClick}
      className={['tap rounded-full px-5 py-2.5 text-sm font-semibold shadow-soft transition active:scale-95', styles].join(' ')}
    >
      {children}
    </button>
  )
}
