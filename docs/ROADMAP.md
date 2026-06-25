# Roadmap — InvestPals

Plan de dezvoltare pe etape. Fiecare etapă livrează ceva demonstrabil.

> Stare: Etapele 1–5 sunt implementate în backend (105 teste pure verzi) și validate
> end-to-end pe PostgreSQL. Aplicația mobilă (Expo) acoperă Etapele 1–2 + academia.
> Rămâne: OAuth Google/Apple, WebSocket/push pe client, ecrane de turnee/quiz pe mobil.

## Etapa 0 — Fundație
- [x] Alegere stack mobil (React Native + Expo).
- [x] Schelet backend (Express + TypeScript + Prisma + PostgreSQL).
- [x] Module pure (lib/portfolio, priceSim, leaderboard, paginate, trading, invite,
      social, notifications, risk, gamification, finance, academy) + teste Vitest.
      (Rescrise din descriere — repo-ul părinte „atestat-portofoliu" nu e accesibil aici.)
- [x] Auth cu JWT + bcrypt. (OAuth Google/Apple rămâne de adăugat.)

## Etapa 1 — MVP (portofoliu personal + grup)
- [x] Înregistrare/login.
- [x] Portofoliu personal: listă instrumente, cumpărare/vânzare, P&L. (grafic: pe mobil rămâne)
- [x] Creare/intrare în grup prin cod de invitație (model Group, Membership).
- [x] Clasament de grup după ROI.

## Etapa 2 — Strat social
- [x] Feed de activitate (cine a cumpărat/vândut ce) — model ActivityEvent.
- [x] Reacții și comentarii la evenimente.
- [x] Profil public minimal în cadrul grupului (cu intimitate: email mascat).

## Etapa 3 — Timp real
- [x] WebSockets pentru actualizarea prețurilor și a feed-ului (backend).
- [x] Notificări push (Expo): „te-a depășit X", „o acțiune a sărit" (backend, best-effort).

## Etapa 4 — Provocări & gamificare
- [x] Turnee pe perioadă fixă, clasament dedicat (ROI în fereastră).
- [x] Reguli educative: limită de tranzacții/zi (anti-overtrading), clasament pe
      randament ajustat la risc (Sharpe).
- [x] Insigne (badges) acordate automat.

## Etapa 5 — Educativ (din atestat)
- [x] „Academie cu misiuni" (backend + ecran mobil).
- [x] Quiz-uri contextuale cu explicații.
- [x] Calculator de dobândă compusă, scor de risc.

## Idei viitoare (backlog)
- Indice de piață sintetic + „alpha" (ai bătut piața?).
- Replay de scenarii istorice (crize).
- Mod „time machine" (accelerarea simulării).

Principiu moștenit din proiectul-părinte: orice logică de business = funcție pură
testată, separată de UI. Așa rămâne ușor de portat și de demonstrat.
