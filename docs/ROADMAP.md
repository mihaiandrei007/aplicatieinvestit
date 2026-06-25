# Roadmap — InvestPals

Plan de dezvoltare pe etape. Fiecare etapă livrează ceva demonstrabil.

## Etapa 0 — Fundație
- [ ] Alegere stack mobil (React Native + Expo recomandat).
- [ ] Schelet backend (Express + TypeScript + Prisma + PostgreSQL).
- [ ] Portează modulele pure din „Portofoliu Virtual" (lib/portfolio, priceSim,
      orders, dividends, leaderboard, paginate, academy) + testele lor.
- [ ] Auth: OAuth (Google/Apple) + JWT.

## Etapa 1 — MVP (portofoliu personal + grup)
- [ ] Înregistrare/login.
- [ ] Portofoliu personal: listă instrumente, cumpărare/vânzare, P&L, grafic.
- [ ] Creare/intrare în grup prin cod de invitație (model Group, Membership).
- [ ] Clasament de grup după ROI.

## Etapa 2 — Strat social
- [ ] Feed de activitate (cine a cumpărat/vândut ce) — model ActivityEvent.
- [ ] Reacții și comentarii la evenimente.
- [ ] Profil public minimal în cadrul grupului (cu intimitate: email mascat).

## Etapa 3 — Timp real
- [ ] WebSockets pentru actualizarea prețurilor și a feed-ului.
- [ ] Notificări push (Expo Notifications): „te-a depășit X", „o acțiune a sărit".

## Etapa 4 — Provocări & gamificare
- [ ] Turnee pe perioadă fixă (ex. lunar), clasament dedicat.
- [ ] Reguli educative: limită de tranzacții/zi (anti-overtrading), clasament pe
      randament ajustat la risc (Sharpe), nu doar brut.
- [ ] Insigne și obiective.

## Etapa 5 — Educativ (din atestat)
- [ ] „Academie cu misiuni" adaptată la mobil.
- [ ] Quiz-uri contextuale și tooltips.
- [ ] Calculator de dobândă compusă, risk score.

## Idei viitoare (backlog)
- Indice de piață sintetic + „alpha" (ai bătut piața?).
- Replay de scenarii istorice (crize).
- Mod „time machine" (accelerarea simulării).

Principiu moștenit din proiectul-părinte: orice logică de business = funcție pură
testată, separată de UI. Așa rămâne ușor de portat și de demonstrat.
