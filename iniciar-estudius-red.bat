@echo off
chcp 65001 >nul
title Estudius - Red local
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] Node.js no esta instalado.
  echo Descargalo desde: https://nodejs.org/
  echo.
  pause
  exit /b 1
)

node "%~dp0Backend\iniciar-estudius-red.js"
set EXITCODE=%ERRORLEVEL%
echo.
if not "%EXITCODE%"=="0" (
  echo Si el error fue EADDRINUSE, el .bat intento liberar el puerto.
  echo Cerra otras ventanas de Node/Estudius y volve a ejecutar.
)
pause
exit /b %EXITCODE%
