@echo off
REM ============================================================
REM  Nihongo Higoro - server per INSTALLARE/AGGIORNARE la PWA
REM  Serve la build su http://localhost:5173 e apre Edge/Chrome,
REM  dove puoi installare l'app (icona nella barra indirizzi).
REM  Dopo l'installazione avvii l'app dal menu Start: funziona
REM  offline, senza questo .bat.
REM ============================================================
cd /d "%~dp0"

if not exist "node_modules\" (
  echo Prima installazione delle dipendenze...
  call npm install --strict-ssl=false
)

if not exist "dist\index.html" (
  echo Prima compilazione...
  call npm run build
)

echo Avvio il server locale su http://localhost:5173 ...
start "Nihongo server" /min cmd /c "npm run preview"

timeout /t 2 >nul

set "URL=http://localhost:5173"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"

REM Finestra normale (non --app) cosi' vedi il pulsante "Installa".
if exist "%EDGE%" (
  start "" "%EDGE%" %URL%
) else if exist "%CHROME%" (
  start "" "%CHROME%" %URL%
) else (
  start "" %URL%
)

exit /b 0
