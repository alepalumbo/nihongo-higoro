// Multiple-choice answers. Before a pick every option is clickable; after it,
// the right answer turns green and a wrong pick turns red.
export default function ChoiceGrid({ options, answer, picked, onPick, optionClass = '' }) {
  const done = picked != null
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const isAnswer = o === answer
        const isPicked = o === picked
        const state = !done
          ? 'bg-surface text-txt ring-line hover:ring-accent-400 hover:bg-accent-soft'
          : isAnswer
            ? 'bg-green-600 text-white ring-green-600'
            : isPicked
              ? 'bg-red-600 text-white ring-red-600'
              : 'bg-surface text-muted ring-line opacity-60'
        return (
          <button
            key={o}
            disabled={done}
            onClick={() => onPick(o)}
            className={['tap rounded-xl px-4 py-3 text-left font-semibold shadow-soft ring-1 transition active:scale-[0.98]', state, optionClass].join(' ')}
          >
            {done && isAnswer && <span aria-hidden>✓ </span>}
            {done && isPicked && !isAnswer && <span aria-hidden>✗ </span>}
            {o}
          </button>
        )
      })}
    </div>
  )
}
