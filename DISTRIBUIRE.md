# Cum trimiți InvestPals prietenilor (Expo Go + tunnel)

Prietenii deschid aplicația în **Expo Go** (gratis, iOS + Android) scanând un cod QR.
Ca să meargă login/piață, backend-ul trebuie să fie **online**. Pașii:

```
[1] Deploy backend (o singură dată)  →  [2] Pornește app cu apiUrl spre backend  →  [3] Dai codul QR
```

---

## 1. Deploy backend + bază de date (gratis, ~5 min)

Repo-ul are deja tot ce trebuie: `backend/Dockerfile`, `render.yaml`, auto-seed la pornire
și piață live (prețuri + știri la 15s).

### Varianta A — Render (recomandat, un singur fișier)
1. Urcă proiectul pe GitHub (deja e pe branch-ul tău).
2. Intră pe [render.com](https://render.com) → **New** → **Blueprint** → conectează repo-ul.
3. Render citește `render.yaml` și creează **baza Postgres + serviciul backend** automat.
   (`DATABASE_URL` și `JWT_SECRET` se completează singure.)
4. Așteaptă build-ul. Copiază URL-ul serviciului, ex: `https://investpals-backend.onrender.com`.
5. Verifică: deschide `https://...onrender.com/health` → trebuie să scrie `{"status":"ok"}`.

### Varianta B — Railway
1. [railway.app](https://railway.app) → New Project → **Provision PostgreSQL**.
2. Add Service → Deploy from repo → **Root Directory: `backend`** (folosește Dockerfile-ul).
3. Variabile: `DATABASE_URL` (din pluginul Postgres), `JWT_SECRET` (orice text lung),
   `NODE_ENV=production`, `MARKET_TICK_MS=15000`.
4. Copiază URL-ul public generat.

> Notă: planurile gratuite „adorm" după inactivitate — prima cerere după o pauză e mai lentă (10–30s). Normal pentru demo.

---

## 2. Pornește aplicația spre backend-ul live

În folderul `mobile/`:

```bash
cp .env.example .env
# editează .env și pune URL-ul tău:
# EXPO_PUBLIC_API_URL=https://investpals-backend.onrender.com

npm install
npx expo start --tunnel
```

`--tunnel` face ca aplicația să fie accesibilă de oriunde (nu doar din rețeaua ta).

---

## 3. Trimite-le codul QR

- Apare un **cod QR** în terminal (și în pagina Expo Dev Tools).
- Prietenii instalează **Expo Go**: [iOS App Store](https://apps.apple.com/app/expo-go/id982107779) · [Android Play](https://play.google.com/store/apps/details?id=host.exp.exponent).
- **Android:** scanează QR-ul din Expo Go.
- **iPhone:** scanează QR-ul cu camera → se deschide în Expo Go.
- Își fac cont în aplicație și pot tranzacționa, intra în grupuri, vedea clasamentul și știrile.

Toți văd **aceleași prețuri** (piața e globală, pe server) și se mișcă live la fiecare 15s.

---

## Limitări de știut
- **PC-ul tău trebuie să ruleze `expo start`** cât timp testează ei (tunnel-ul servește codul aplicației). Backend-ul, fiind pe Render, e independent.
- **Notificările push** sunt limitate în Expo Go pe iOS — restul aplicației merge complet.
- Vrei un link permanent, fără PC-ul tău pornit? Treci la un **build EAS** (`eas build -p android --profile preview` pentru un `.apk` de trimis). Pot pregăti și asta.

## Recapitulare comenzi
```bash
# backend (o dată): deploy pe Render via render.yaml
# mobil (de fiecare dată când vrei să le arăți):
cd mobile && npx expo start --tunnel
```
