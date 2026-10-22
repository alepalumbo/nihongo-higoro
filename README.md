# 日本語ひごろ — Nihongo Higoro 🎴

App offline per imparare il giapponese — lezioni in Markdown, flashcard, palestra dei verbi e kanji. React + Vite + Tailwind, tutto in `localStorage`, nessun backend.

## Avvio

```bash
npm install
npm run dev
```

## Funzioni

- **Lezioni** — carica un `.md`, ogni lezione è una sezione collassabile con indice e ricerca. Ordinate cronologicamente, upload additivo.
- **Flashcard** — JP→IT / IT→JP, flip 3D, ✓/✗, punteggio, filtri per **lezione** e **topic**, mescola.
- **Verbi** — palestra di coniugazione: 13 forme (masu, masen, mashita, plain past, nai, nakatta, -te, nakute, tai, takunai, takatta, takunakatta…), filtro per gruppo (G1/G2/G3), scelta multipla o scrittura libera in romaji (tollera maiuscole, spazi, n/nn, ō/ou, Kunrei/Hepburn).
- **Kanji** — griglia, scheda di dettaglio (on'yomi / kun'yomi / parole chiave), filtro per categoria, quiz sul significato, quiz “kanji nelle frasi”.
- **Statistiche** — sessioni, % corrette oggi e in totale, serie di giorni (≥10 carte/giorno), ultimi 7 giorni, i 5 topic con più errori.
- **Banner giornaliero** — 🔥 serie, carte di oggi, frase motivazionale in giapponese.
- **Furigana** — 漢字＋ふりがな (solo sui kanji) → ひらがな → Romaji. **Tema** chiaro/scuro.

## Formato CSV

```
topic;romaji;kana;italiano;hiragana[;lezione]
```

- Niente header. Separatore `;`. L'upload **sostituisce** tutto il mazzo (con anteprima e conferma).
- `lezione` (6ª colonna, opzionale): `L3`, `3` o `Lezione 3`. **Se manca, la lezione viene dedotta**: le righe del CSV sono in ordine di lezione, e ogni carta viene abbinata alla lezione del file `.md` in cui compare la parola (sequenza sempre non decrescente). Carica anche l'`.md` per un abbinamento preciso.
- Topic: `sostantivo, aggettivo, verbo, frase, espressione, ora, mese, giorno, colore, numero, saluto, kanji, altro`.

### Card kanji

```
kanji;yama / san;山;montagna;やま・サン — 富士山(ふじさん)、山登り(やまのぼり)
```

- `hiragana` = letture, poi `—`, poi parole chiave `parola(lettura)`.
- **Scrivi l'on'yomi in katakana** (サン) e il kun'yomi in hiragana (やま): così le letture vengono etichettate con certezza. In alternativa: `訓: やま / 音: さん`. Se è tutto in hiragana, l'app deduce on/kun dalle parole chiave (best effort).
- Okurigana col punto: `た.べる`.

## Verbi

La palestra usa **solo** [verbi_studiati.json](verbi_studiati.json) (forme pre-calcolate e validate, nessuna coniugazione automatica). Per aggiungere verbi sostituisci il file e ricompila (`npm run build` / `Nihongo-aggiorna.bat`).

## Android (APK offline)

Vedi [BUILDING.md](BUILDING.md). In breve:

```bash
npm run build
npx cap sync android
npx cap open android   # poi Build → Build APK in Android Studio
```

## Storage (localStorage)

| Chiave | Contenuto |
|--------|-----------|
| `mayu_lessons` | `[{ title, content }]` |
| `mayu_cards` | `[{ topic, romaji, kana, furigana, hiragana, italiano, lessonRef? }]` |
| `mayu_stats` | `{ studiedDates, correctDates, seen, correct, sessions, lastStudyAt, topicSeen, topicErrors }` |
| `mayu_verbi_prefs` | impostazioni della palestra verbi |
| `mayu_darkmode` | `true` / `false` |
