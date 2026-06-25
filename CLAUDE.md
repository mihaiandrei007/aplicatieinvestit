# CLAUDE.md — context pentru InvestPals

Acest fișier e citit automat la începutul unei sesiuni. Rezumă proiectul ca să poți
continua fără context anterior. Detalii în README.md și docs/ROADMAP.md.

## Ce este
InvestPals — aplicație de telefon de investiții cu bani VIRTUALI între prieteni
(educativă, zero risc real). Pornește din proiectul de atestat „Portofoliu Virtual".

## Ideile principale (nu le pierde din vedere)
1. Grupuri de prieteni (cod de invitație) — fiecare cu portofoliul lui.
2. Clasament de grup după randament (ROI).
3. Feed social — vezi tranzacțiile prietenilor, cu reacții/comentarii.
4. Provocări / turnee + obiective de învățare; reguli anti-overtrading;
   clasament pe randament ajustat la risc (Sharpe), nu doar brut.
5. Notificări push la evenimente (te-a depășit cineva, o acțiune a sărit).
6. Educativ — „academie cu misiuni", quiz-uri, tooltips (moștenite din atestat).

## Stack propus
- Mobil: React Native + Expo (sau Flutter).
- Backend: Node + Express/Fastify + TypeScript + Prisma + PostgreSQL.
- Timp real: WebSockets + push (Expo Notifications).
- Auth: OAuth (Google/Apple) + JWT.

## Principiu de arhitectură (important)
Toată logica de business = funcții PURE, testate, separate de UI. Se portează din
proiectul-părinte „Portofoliu Virtual" (repo atestat-portofoliu):
- lib/portfolio (P&L, dețineri), lib/priceSim (simulator preț determinist),
  lib/orders (ordine limită), lib/dividends, lib/leaderboard (ROI),
  lib/paginate, lib/academy (misiuni educative).
- Modelul de date pleacă de la User/Instrument/Transaction + adaugă social:
  Group, Membership, ActivityEvent, reacții/comentarii.

## Reguli de lucru
- Orice logică nouă -> funcție pură + test (Vitest), apoi rută, apoi UI.
- Aplicația rămâne strict educativă, bani virtuali (fără bani reali — evită reglementări).
- Vezi docs/ROADMAP.md pentru etape; începe cu Etapa 1 (MVP: auth + portofoliu + grup + clasament).

## Proiect-părinte
atestat-portofoliu (simulator web de bursă) — vezi acolo docs/IDEI-VIITOARE.md și
codul din backend/src/lib/ pentru logica reutilizabilă.
