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

## Ce e implementat
- Autentificare (înregistrare/login) cu token păstrat securizat.
- Portofoliu: equity, randament, **grafic de evoluție** (SVG), dețineri, P&L.
- Piață: instrumente cu **prețuri live (WebSocket)**, cumpărare/vânzare, insigne noi.
- Grupuri: creare/intrare cu cod, clasament, **feed social live**, **turnee** (creare/înscriere).
- Academie: misiuni cu progres, **quiz-uri interactive** cu explicații, galerie de insigne.
- **Notificări push** (`expo-notifications`) înregistrate automat la login (device fizic).
- Timp real: `src/realtime/useRealtime.ts` (reconectare automată) consumă `WS_URL`.

## OAuth Google/Apple
Backend-ul expune `POST /api/auth/oauth` (verifică ID token-ul prin JWKS) și
`AuthContext.signInWithOAuth(provider, idToken)` e gata. Pentru a-l activa pe client:

1. Setează `GOOGLE_CLIENT_ID` / `APPLE_CLIENT_ID` în backend (`.env`).
2. Adaugă pe mobil `expo-auth-session` (Google) și `expo-apple-authentication` (Apple).
3. Obține `idToken`-ul de la provider și apelează `signInWithOAuth('google', idToken)`.

Butoanele „Continuă cu Google/Apple" din ecranul de login sunt pregătite pentru pasul 3.
