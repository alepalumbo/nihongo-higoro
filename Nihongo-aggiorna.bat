@echo off
REM ============================================================
REM  Esegui SOLO dopo aver cambiato il codice dell'app.
REM  Ricompila la build che poi Nihongo.bat servira'.
REM  (Per l'uso normale non serve: usa direttamente Nihongo.bat.)
REM ============================================================
cd /d "%~dp0"
echo Ricompilo l'app...
call npm run build
if errorlevel 1 (
  echo.
  echo Errore durante la build.
) else (
  echo.
  echo Fatto. Avvia con Nihongo.bat
)
pause
