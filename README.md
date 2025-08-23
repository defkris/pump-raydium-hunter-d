# Pump → Raydium Hunter (Frontend + Backend + APK CI)
## Lokalnie
Backend:
  cd backend && cp .env.example .env && npm i && npm run dev
Frontend:
  cd frontend && npm i && VITE_API_BASE=http://localhost:8080 npm run dev
Seed demo:
  curl -XPOST http://localhost:8080/seed-demo

## APK z GitHub Actions
Po pushu lub ręcznie w Actions → job: **Build APK (Capacitor)** → pobierz artefakt `app-debug-apk` (plik `.apk`).

## Produkcja
Postaw backend na VPS/Render (HTTPS) i ustaw w front `VITE_API_BASE` na publiczny URL.
