import { useEffect, useMemo, useState } from 'react'
import { KEYS } from './lib/storage.js'
import { parseCsv } from './lib/parseCsv.js'
import { parseMarkdown } from './lib/parseMarkdown.js'
import { mergeLessons } from './lib/merge.js'
import { assignLessons } from './lib/lessons.js'
import { EMPTY_STATS, recordStudy } from './lib/stats.js'
import { BUNDLED_VERBS, isValidVerbs } from './lib/verbs.js'
import { fetchRemoteData, SyncError } from './lib/sync.js'
import { useOnline } from './hooks/useOnline.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useToast } from './hooks/useToast.js'
import { nextFuriganaMode, FURIGANA_LABELS } from './lib/japanese.js'

import Tabs from './components/Tabs.jsx'
import Toast from './components/Toast.jsx'
import Modal from './components/Modal.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import UploadButton from './components/UploadButton.jsx'
import BottomNav from './components/BottomNav.jsx'
import LessonsTab from './components/lessons/LessonsTab.jsx'
import FlashcardTab from './components/flashcards/FlashcardTab.jsx'
import StatsPanel from './components/stats/StatsPanel.jsx'
import VerbsTab from './components/verbs/VerbsTab.jsx'
import KanjiTab from './components/kanji/KanjiTab.jsx'
import DailyBanner from './components/DailyBanner.jsx'
import SyncButton from './components/SyncButton.jsx'

const CLOSED_CONFIRM = { open: false }

// Bring older stored cards up to the current model (topic + furigana + hiragana).
function migrateCards(cards) {
  let changed = false
  const out = cards.map((c) => {
    const next = { ...c }
    if (next.topic == null) {
      next.topic = 'altro'
      changed = true
    }
    if (next.furigana == null) {
      next.furigana = next.kana || ''
      changed = true
    }
    if (next.hiragana == null) {
      next.hiragana = ''
      changed = true
    }
    // Lessons are now derived at runtime (lessons.js); drop the old stored tag.
    if ('lesson' in next) {
      delete next.lesson
      changed = true
    }
    return next
  })
  return { out, changed }
}

export default function App() {
  const [tab, setTab] = useState('lessons')
  const [lessons, setLessons] = useLocalStorage(KEYS.lessons, [])
  const [cards, setCards] = useLocalStorage(KEYS.cards, [])
  const [stats, setStats] = useLocalStorage(KEYS.stats, EMPTY_STATS)
  const [dark, setDark] = useLocalStorage(KEYS.darkmode, false)
  const [furigana, setFurigana] = useState('furigana')
  const [confirm, setConfirm] = useState(CLOSED_CONFIRM)
  const [uploadSheet, setUploadSheet] = useState(false)
  const [syncedVerbs, setSyncedVerbs] = useLocalStorage(KEYS.verbs, null)
  const [syncing, setSyncing] = useState(false)
  const online = useOnline()
  const { toasts, show } = useToast()

  // Verbs: last synced verbi_studiati.json, else the copy bundled in the build.
  const verbs = useMemo(() => (isValidVerbs(syncedVerbs) ? syncedVerbs : BUNDLED_VERBS), [syncedVerbs])

  // Deck = stored cards + inferred lesson + stable uid. Recomputed only when
  // the cards or the lessons change.
  const deck = useMemo(() => assignLessons(cards, lessons), [cards, lessons])

  // One-time graceful migration of legacy localStorage cards.
  useEffect(() => {
    const { out, changed } = migrateCards(cards)
    if (changed) setCards(out)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reflect theme preference on <html data-theme>.
  useEffect(() => {
    const el = document.documentElement
    if (dark) el.setAttribute('data-theme', 'dark')
    else el.removeAttribute('data-theme')
  }, [dark])

  // CSV upload REPLACES the deck (with a preview of counts).
  function handleCsv(text) {
    setUploadSheet(false)
    const incoming = parseCsv(text)
    if (!incoming.length) {
      show('CSV vuoto o non valido', 'error')
      return
    }
    const next = incoming

    const existing = new Set(cards.map((c) => c.romaji.toLowerCase()))
    const newCount = incoming.filter((c) => !existing.has(c.romaji.toLowerCase())).length

    const apply = () => {
      setCards(next)
      show(`Carte aggiornate: ${next.length} carte caricate`)
      setConfirm(CLOSED_CONFIRM)
    }

    setConfirm({
      open: true,
      title: 'Caricare le flashcard?',
      message: `${incoming.length} carte trovate, ${newCount} nuove rispetto alle attuali (${cards.length}). L'upload sostituisce tutto il mazzo.`,
      confirmLabel: 'Sostituisci',
      action: apply,
    })
  }

  // Lesson (MD) upload stays additive — preview the titles found.
  function handleMd(text) {
    setUploadSheet(false)
    const incoming = parseMarkdown(text)
    if (!incoming.length) {
      show('File .md vuoto o senza titoli', 'error')
      return
    }
    const existingTitles = new Set(lessons.map((l) => l.title))
    const newTitles = incoming.filter((l) => !existingTitles.has(l.title))

    const apply = () => {
      setLessons((prev) => {
        const { merged } = mergeLessons(prev, incoming)
        return merged
      })
      show(newTitles.length > 0 ? `${newTitles.length} lezioni aggiunte` : 'Lezioni aggiornate')
      setConfirm(CLOSED_CONFIRM)
    }

    setConfirm({
      open: true,
      title: 'Aggiungere le lezioni?',
      message: `${incoming.length} lezioni nel file, ${newTitles.length} nuove. Le lezioni vengono aggiunte (mai sovrascritte).`,
      confirmLabel: 'Aggiungi',
      action: apply,
      body: (
        <ul className="space-y-1">
          {incoming.map((l) => (
            <li key={l.title} className="flex items-center gap-2 text-txt">
              <span className={existingTitles.has(l.title) ? 'text-muted' : 'text-accent-600'}>
                {existingTitles.has(l.title) ? '↻' : '＋'}
              </span>
              <span className="truncate">{l.title}</span>
            </li>
          ))}
        </ul>
      ),
    })
  }

  // Download CSV + verbs JSON + notes MD from GitHub. Local data is replaced
  // only after all three files arrived and parsed (fetchRemoteData validates).
  async function handleSync() {
    if (syncing) return
    setUploadSheet(false)
    if (!navigator.onLine) {
      show('Sei offline: usa l’upload manuale dei file.', 'error')
      return
    }
    setSyncing(true)
    try {
      const remote = await fetchRemoteData()
      setCards(remote.cards)
      setLessons((prev) => mergeLessons(prev, remote.lessons).merged)
      setSyncedVerbs(remote.verbs)
      show(`Sincronizzato: ${remote.cards.length} carte, ${remote.lessons.length} lezioni, ${remote.verbs.length} verbi`)
    } catch (e) {
      show(e instanceof SyncError ? e.message : 'Sincronizzazione non riuscita.', 'error')
    } finally {
      setSyncing(false)
    }
  }

  // Every answer (flashcards, verbs, kanji) goes through here.
  function handleStudy(event) {
    setStats((s) => recordStudy(s, event))
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:pb-24 sm:pt-10">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-jp text-2xl font-bold tracking-tight text-txt sm:text-3xl">
              <span className="text-accent-500">日本語</span>ひごろ
            </h1>
            <p className="mt-1 text-sm text-muted">Nihongo Higoro · impara il giapponese</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFurigana((m) => nextFuriganaMode(m))}
              title="Cambia visualizzazione giapponese"
              aria-label="Cambia visualizzazione giapponese"
              className="tap rounded-full bg-surface px-4 py-2 text-sm font-medium text-accent-600 shadow-soft ring-1 ring-line transition hover:bg-accent-soft"
            >
              🇯🇵 {FURIGANA_LABELS[furigana]}
            </button>
            {/* Upload buttons live in the header on tablet/desktop; on phones
                the bottom-nav Upload button opens the same actions in a sheet. */}
            <div className="hidden gap-2 sm:flex">
              <SyncButton onSync={handleSync} syncing={syncing} online={online} />
              <UploadButton onCsv={handleCsv} onMd={handleMd} />
            </div>
            <div className="sm:hidden">
              <SyncButton onSync={handleSync} syncing={syncing} online={online} compact />
            </div>
            <button
              onClick={() => setUploadSheet(true)}
              aria-label="Carica file"
              title="Carica file"
              className="tap grid h-11 w-11 place-items-center rounded-full bg-surface text-lg shadow-soft ring-1 ring-line transition hover:bg-accent-soft sm:hidden"
            >
              ⬆️
            </button>
            <ThemeToggle dark={dark} onToggle={() => setDark((d) => !d)} />
          </div>
        </header>

        <DailyBanner stats={stats} />

        {/* Top tabs (tablet/desktop) */}
        <div className="mb-6 hidden sm:block">
          <Tabs active={tab} onChange={setTab} />
        </div>

        {/* Content */}
        <main key={tab}>
          {tab === 'lessons' && <LessonsTab lessons={lessons} furigana={furigana} />}
          {tab === 'flashcards' && <FlashcardTab cards={deck} furigana={furigana} onStudy={handleStudy} />}
          {tab === 'verbs' && <VerbsTab verbs={verbs} furigana={furigana} onStudy={handleStudy} />}
          {tab === 'kanji' && <KanjiTab deck={deck} furigana={furigana} onFurigana={setFurigana} onStudy={handleStudy} />}
          {tab === 'stats' && <StatsPanel cards={deck} stats={stats} />}
        </main>
      </div>

      {/* Bottom navigation (mobile) */}
      <BottomNav active={tab} onChange={setTab} />

      {/* Upload sheet (mobile) */}
      {uploadSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50 sm:hidden"
          onClick={() => setUploadSheet(false)}
        >
          <div
            className="toast-in w-full rounded-t-2xl bg-elevated p-5 pb-8 shadow-soft ring-1 ring-line"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <p className="mb-3 text-center text-sm font-semibold text-txt">Aggiorna i dati</p>
            <div className="flex flex-col items-center gap-3">
              <SyncButton onSync={handleSync} syncing={syncing} online={online} />
              {!online && (
                <p className="text-center text-xs text-muted">Sei offline: puoi comunque caricare i file a mano.</p>
              )}
              <UploadButton onCsv={handleCsv} onMd={handleMd} />
            </div>
          </div>
        </div>
      )}

      <Modal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        body={confirm.body}
        confirmLabel={confirm.confirmLabel || 'Continua'}
        cancelLabel="Annulla"
        onConfirm={() => confirm.action?.()}
        onCancel={() => setConfirm(CLOSED_CONFIRM)}
      />

      <Toast toasts={toasts} />
    </div>
  )
}
