import { useRef } from 'react'

// Two visible upload buttons. Routes file to the right handler by extension,
// so even if the wrong picker is used the file still lands correctly.
export default function UploadButton({ onCsv, onMd }) {
  const csvRef = useRef(null)
  const mdRef = useRef(null)

  function handle(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const name = file.name.toLowerCase()
      if (name.endsWith('.md') || name.endsWith('.markdown')) onMd(text)
      else onCsv(text) // .csv / .txt / anything else -> cards
    }
    reader.readAsText(file)
  }

  const pick = (e, ref) => {
    const file = e.target.files?.[0]
    handle(file)
    if (ref.current) ref.current.value = '' // allow re-upload of same file
  }

  return (
    <div className="flex gap-2">
      <input
        ref={csvRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={(e) => pick(e, csvRef)}
      />
      <input
        ref={mdRef}
        type="file"
        accept=".md,.markdown"
        className="hidden"
        onChange={(e) => pick(e, mdRef)}
      />
      <button
        onClick={() => csvRef.current?.click()}
        className="tap rounded-full bg-surface px-4 py-2 text-sm font-medium text-accent-600 shadow-soft ring-1 ring-line transition hover:bg-accent-soft"
      >
        ⬆ CSV flashcard
      </button>
      <button
        onClick={() => mdRef.current?.click()}
        className="tap rounded-full bg-surface px-4 py-2 text-sm font-medium text-accent-600 shadow-soft ring-1 ring-line transition hover:bg-accent-soft"
      >
        ⬆ MD lezione
      </button>
    </div>
  )
}
