# InvestPals — Mobil (React Native + Expo)

Aplicația de telefon care consumă API-ul din `../backend`. Construită cu
**Expo Router** (navigare bazată pe fișiere) și TypeScript.

## Structură

```
app/                      # rute (Expo Router)
  _layout.tsx             # AuthProvider + gating autentificare
  (auth)/login|register   # ecrane de autentificare
  (tabs)/                 # tab-uri după login
    portfolio.tsx           # equity, ROI, dețineri, P&L
    market.tsx              # instrumente + cumpărare/vânzare
    groups.tsx              # creare/intrare în grup
    academy.tsx             # misiuni + insigne
  group/[id].tsx          # clasament + feed social (cu reacții)
src/
  api/client.ts           # client HTTP tipat + endpoint-uri
  auth/AuthContext.tsx     # sesiune + token în SecureStore
  components/ui.tsx        # kit UI (Screen, Card, Button, Field…)
  config.ts, theme.ts
```

## Rulare

1. Pornește backend-ul (vezi `../backend/README.md`) — implicit pe `http://localhost:4000`.
2. Setează adresa API-ului în `app.json` → `expo.extra.apiUrl`:
   - emulator Android: `http://10.0.2.2:4000`
   - dispozitiv fizic: `http://IP-UL-CALCULATORULUI:4000`
3. Instalează și pornește:

```bash
cd mobile
npm install
npx expo start
```

Apoi scanează codul QR cu **Expo Go** (Android/iOS) sau apasă `a`/`i` pentru emulator.

## Ce e implementat (Etapele 1–2 pe mobil)
- Autentificare (înregistrare/login) cu token păstrat securizat.
- Portofoliu: equity, randament, dețineri, P&L (pull-to-refresh).
- Piață: listă instrumente, cumpărare/vânzare, notificare de insigne noi.
- Grupuri: creare, intrare cu cod, clasament de grup, feed social cu reacții.
- Academie: misiuni cu progres + galerie de insigne.

## Următorii pași (mobil)
- WebSocket live (prețuri + feed) folosind `src/config.ts → WS_URL`.
- Notificări push cu `expo-notifications` (înregistrare token la `/api/push/register`).
- Ecrane de turnee și quiz-uri.
