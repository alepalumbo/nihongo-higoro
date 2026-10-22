import { Fragment, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

// --- helpers -------------------------------------------------------------

function childrenToString(ch) {
  if (ch == null) return ''
  if (typeof ch === 'string' || typeof ch === 'number') return String(ch)
  if (Array.isArray(ch)) return ch.map(childrenToString).join('')
  if (ch.props && ch.props.children) return childrenToString(ch.props.children)
  return ''
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^\w぀-ヿ一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Wrap query matches in <mark>, walking string/array children.
function highlight(children, query) {
  if (!query) return children
  const q = query.toLowerCase()
  const walk = (node, keyBase = '') => {
    if (typeof node === 'string') {
      const low = node.toLowerCase()
      if (!low.includes(q)) return node
      const parts = []
      let i = 0
      let idx = low.indexOf(q)
      let k = 0
      while (idx !== -1) {
        if (idx > i) parts.push(node.slice(i, idx))
        parts.push(<mark key={`${keyBase}-${k++}`}>{node.slice(idx, idx + query.length)}</mark>)
        i = idx + query.length
        idx = low.indexOf(q, i)
      }
      if (i < node.length) parts.push(node.slice(i))
      return parts
    }
    if (Array.isArray(node)) return node.map((n, i) => <Fragment key={i}>{walk(n, String(i))}</Fragment>)
    return node
  }
  return walk(children)
}

// Extract ## / ### headings for the per-lesson table of contents.
// Ids are unique per lesson (repeated titles get -2, -3…) and keyed by source
// line, so the rendered heading and its TOC link always agree.
function extractHeadings(content, lessonId) {
  const out = []
  const used = new Map()
  let inFence = false
  ;(content || '').split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    if (inFence) return
    const m = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line)
    if (!m) return
    const text = m[2].trim()
    const base = `${lessonId}__${slugify(text)}`
    const n = (used.get(base) || 0) + 1
    used.set(base, n)
    out.push({ level: m[1].length, text, id: n === 1 ? base : `${base}-${n}`, line: i + 1 })
  })
  return out
}

// --- component -----------------------------------------------------------

export default function LessonCard({ lesson, defaultOpen = false, furigana = 'furigana', query = '' }) {
  const [manualOpen, setManualOpen] = useState(defaultOpen)
  const open = query ? true : manualOpen // searching forces the section open

  const lessonId = slugify(lesson.title)
  const headings = extractHeadings(lesson.content, lessonId)
  const idByLine = new Map(headings.map((h) => [h.line, h.id]))
  const headingId = (node, children) =>
    idByLine.get(node?.position?.start?.line) || `${lessonId}__${slugify(childrenToString(children))}`

  const hl = (children) => highlight(children, query)

  const components = {
    table: ({ node, ...props }) => (
      <div className="table-scroll">
        <table {...props} />
      </div>
    ),
    h2: ({ node, children, ...props }) => (
      <h2 id={headingId(node, children)} {...props}>
        {hl(children)}
      </h2>
    ),
    h3: ({ node, children, ...props }) => (
      <h3 id={headingId(node, children)} {...props}>
        {hl(children)}
      </h3>
    ),
    p: ({ node, children, ...props }) => <p {...props}>{hl(children)}</p>,
    li: ({ node, children, ...props }) => <li {...props}>{hl(children)}</li>,
    td: ({ node, children, ...props }) => <td {...props}>{hl(children)}</td>,
    th: ({ node, children, ...props }) => <th {...props}>{hl(children)}</th>,
    strong: ({ node, children, ...props }) => <strong {...props}>{hl(children)}</strong>,
    em: ({ node, children, ...props }) => <em {...props}>{hl(children)}</em>,
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-surface shadow-soft ring-1 ring-line">
      <button
        onClick={() => setManualOpen((o) => !o)}
        aria-expanded={open}
        className="tap flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-accent-soft"
      >
        <h2 className="text-base font-semibold text-txt sm:text-lg">{lesson.title}</h2>
        <span
          className={['shrink-0 text-accent-500 transition-transform duration-300', open ? 'rotate-180' : ''].join(' ')}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-line px-5 py-4">
          {/* Sticky table of contents for this lesson */}
          {headings.length > 1 && (
            <nav className="sticky top-2 z-10 mb-4 rounded-xl bg-elevated/95 p-3 text-sm shadow-soft ring-1 ring-line backdrop-blur">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Indice</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {headings.map((h) => (
                  <li key={h.id} className={h.level === 3 ? 'pl-3' : ''}>
                    <a
                      href={`#${h.id}`}
                      className="text-accent-500/80 hover:text-accent-500 hover:underline dark:text-accent-300/80 dark:hover:text-accent-300"
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className={['md-body tab-enter', `md-fur-${furigana}`].join(' ')}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
              {lesson.content || '_(nessun contenuto)_'}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </section>
  )
}
