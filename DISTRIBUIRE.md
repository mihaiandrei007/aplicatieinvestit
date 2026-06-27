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

## Limitări de știut (tunnel)
- **PC-ul tău trebuie să ruleze `expo start`** cât timp testează ei. Backend-ul, fiind pe Render, e independent.
- **Notificările push** sunt limitate în Expo Go pe iOS — restul aplicației merge complet.

---

# Varianta 2 — APK Android (link permanent, fără PC-ul tău pornit)

Un fișier `.apk` instalabil direct, pe care îl trimiți ca link. Nu necesită Expo Go,
nu necesită PC-ul tău pornit. **Doar pentru Android.** (config gata în `mobile/eas.json`)

1. Asigură-te că backend-ul e deja deployat (vezi pasul 1 de sus) și ai URL-ul lui.
2. În `mobile/eas.json`, înlocuiește `https://investpals-backend.onrender.com` cu URL-ul tău real
   (în profilul `preview`), ca APK-ul să pointeze spre backend-ul tău.
3. Instalează unealta și fă-ți cont Expo (gratis):
   ```bash
   cd mobile
   npm install -g eas-cli
   eas login            # creează cont pe expo.dev dacă nu ai
   eas init             # leagă proiectul (adaugă projectId în app.json)
   eas build -p android --profile preview
   ```
4. Build-ul rulează în cloud-ul Expo (~10–15 min). La final primești un **link de download** către `.apk`.
5. Trimite linkul prietenilor cu Android → îl deschid, descarcă, instalează
   (poate cere „permite instalarea din surse necunoscute").

> iPhone: un build instalabil real (`.ipa` / TestFlight) necesită **cont Apple Developer (99$/an)**.
> Pentru prietenii cu iPhone, rămâi la **Varianta 1 (Expo Go + tunnel)** până atunci.

---

## Ce să folosești, pe scurt
- **Prieteni Android** → APK (Varianta 2): le trimiți un link, gata, permanent.
- **Prieteni iPhone** → Expo Go + tunnel (Varianta 1), cu PC-ul tău pornit cât testează.
- **Backend** → o singură dată pe Render (`render.yaml`), apoi merge pentru toți.

## Recapitulare comenzi
```bash
# backend (o dată): deploy pe Render via render.yaml

# Android — APK permanent:
cd mobile && eas build -p android --profile preview

# iPhone — Expo Go + tunnel (PC pornit):
cd mobile && npx expo start --tunnel
```
