// "Sincronizza": download the study data from the GitHub repo.
// All three files are fetched and validated BEFORE anything is written, so a
// failed or partial download never touches the local data.

import { parseCsv } from './parseCsv.js'
import { parseMarkdown } from './parseMarkdown.js'
import { isValidVerbs } from './verbs.js'

const BASE = 'https://raw.githubusercontent.com/alepalumbo/nihongo-higoro/main/data/'

export const SYNC_URLS = {
  cards: `${BASE}anki_nihongo_con_mayu.csv`,
  verbs: `${BASE}verbi_studiati.json`,
  lessons: `${BASE}giapponese_con_mayu.md`,
}

export class SyncError extends Error {}

async function download(url, label) {
  let res
  try {
    // Unique query + no-store: skip browser/CDN caches, always the latest file.
    res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' })
  } catch {
    throw new SyncError('Connessione assente o GitHub non raggiungibile.')
  }
  if (res.status === 404) {
    throw new SyncError(`${label} non è stato trovato su GitHub (404): il repository potrebbe essere privato oppure il file non è nella cartella data/.`)
  }
  if (!res.ok) throw new SyncError(`${label}: errore HTTP ${res.status}.`)
  return res.text()
}

export async function fetchRemoteData() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new SyncError('Sei offline: usa l’upload manuale dei file.')
  }

  const [csv, json, md] = await Promise.all([
    download(SYNC_URLS.cards, 'Il CSV delle flashcard'),
    download(SYNC_URLS.verbs, 'Il JSON dei verbi'),
    download(SYNC_URLS.lessons, 'Il file degli appunti'),
  ])

  const cards = parseCsv(csv)
  if (!cards.length) throw new SyncError('Il CSV scaricato è vuoto o non valido.')

  let verbs
  try {
    verbs = JSON.parse(json)
  } catch {
    throw new SyncError('Il JSON dei verbi scaricato non è valido.')
  }
  if (!isValidVerbs(verbs)) throw new SyncError('Il JSON dei verbi non ha il formato atteso.')

  const lessons = parseMarkdown(md)
  if (!lessons.length) throw new SyncError('Il file degli appunti non contiene lezioni.')

  return { cards, verbs, lessons }
}
