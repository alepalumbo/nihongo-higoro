// Split a .md file into lesson sections.
// A lesson begins at a top-level heading (# or ##). The heading text becomes
// the title; everything until the next same-level heading is the content
// (stored as raw markdown, title line stripped).
// Returns: [{ title, content }]

export function parseMarkdown(text) {
  const src = text.replace(/\r\n/g, '\n').trim()
  if (!src) return []

  // Decide delimiter level: prefer # if present, else ##.
  const hasH1 = /^# .+/m.test(src)
  const headingRe = hasH1 ? /^# +(.+)$/ : /^## +(.+)$/

  const lines = src.split('\n')
  const sections = []
  let current = null

  for (const line of lines) {
    const m = line.match(headingRe)
    if (m) {
      if (current) sections.push(current)
      current = { title: m[1].trim(), content: [] }
    } else if (current) {
      current.content.push(line)
    } else {
      // Preamble before first heading — wrap as an untitled lesson.
      current = { title: 'Lezione', content: [line] }
    }
  }
  if (current) sections.push(current)

  return sections
    .map((s) => ({ title: s.title, content: s.content.join('\n').trim() }))
    .filter((s) => s.title)
}
