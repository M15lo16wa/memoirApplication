@echo off
echo 🚀 Démarrage de la plateforme Santé Sénégal...
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé. Veuillez installer Node.js d'abord.
    pause
    exit /b 1
)

echo 🌐 Démarrage de l'application React...
start "React App" cmd /k "npm start"

echo.
echo ✅ Plateforme démarrée avec succès !
echo 🌐 Application React: http://localhost:3001
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause >nul