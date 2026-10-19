@echo off
setlocal
cd /d "%~dp0"
set "ACADEMIAI_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "ACADEMIAI_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not "%ACADEMIAI_NODE%"=="node" if not exist "%ACADEMIAI_NODE%" (
  echo Node.js is needed to run the local preview. Install the Node.js LTS release, then reopen this file.
  pause
  exit /b 1
)
"%ACADEMIAI_NODE%" scripts\serve.mjs --open %*
if errorlevel 1 pause
