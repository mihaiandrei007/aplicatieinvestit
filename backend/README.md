# InvestPals — Backend

API-ul InvestPals: Node + Express + TypeScript + Prisma + PostgreSQL.

Principiu: **toată logica de business = funcții pure testate** (`src/lib/`), separate
de rute (`src/routes/`) și de bază de date. Rutele doar încarcă date, deleagă către
funcțiile pure și salvează rezultatul.

## Structură

```
src/
  lib/            # logică pură, testată (Vitest) — reutilizabilă, fără DB/UI
    portfolio.ts    # dețineri + P&L din istoricul tranzacțiilor
    priceSim.ts     # simulator determinist de preț (același seed => aceeași serie)
    trading.ts      # validarea unei cumpărări/vânzări (fonduri, dețineri)
    leaderboard.ts  # clasament după ROI
    paginate.ts     # paginare offset-based
    invite.ts       # coduri de invitație pentru grupuri
  services/       # leagă DB-ul de funcțiile pure (fără reguli proprii)
  routes/         # rute Express subțiri (auth, instruments, portfolio, groups)
  http/           # erori + middleware de autentificare
  auth/           # hashing parolă (bcrypt) + JWT
  app.ts, server.ts
prisma/
  schema.prisma   # User, Instrument, Transaction, Group, Membership, ActivityEvent
  seed.ts         # instrumente de start cu prețuri deterministe
```

## Setup local

```bash
cp .env.example .env        # completează DATABASE_URL și JWT_SECRET
npm install
npm run prisma:migrate      # creează schema în PostgreSQL
npm run db:seed             # populează instrumente
npm run dev                 # pornește API-ul (http://localhost:4000)
```

## Comenzi

| Comandă | Efect |
| --- | --- |
| `npm test` | rulează testele pure (Vitest) |
| `npm run typecheck` | verificare de tipuri |
| `npm run dev` | server cu reload |
| `npm run build` / `npm start` | build + rulare producție |

## API (Etapa 1 — MVP)

Autentificare prin header `Authorization: Bearer <token>`.

| Metodă | Rută | Descriere |
| --- | --- | --- |
| `POST` | `/api/auth/register` | cont nou → `{ token, user }` |
| `POST` | `/api/auth/login` | autentificare → `{ token, user }` |
| `GET` | `/api/auth/me` | utilizatorul curent |
| `GET` | `/api/instruments` | lista instrumentelor + preț curent |
| `GET` | `/api/portfolio` | dețineri, P&L, equity, numerar |
| `GET` | `/api/portfolio/transactions` | istoric paginat |
| `POST` | `/api/portfolio/trade` | cumpărare/vânzare `{ symbol, side, quantity }` |
| `POST` | `/api/groups` | creează grup → cod de invitație |
| `POST` | `/api/groups/join` | intră cu `{ inviteCode }` |
| `GET` | `/api/groups` | grupurile mele |
| `GET` | `/api/groups/:id/leaderboard` | clasament de grup după ROI |
| `GET` | `/api/groups/:id/members` | membri cu email mascat |

### Etapa 2 — social

| Metodă | Rută | Descriere |
| --- | --- | --- |
| `GET` | `/api/groups/:id/feed` | feed de activitate (paginat) |
| `POST` | `/api/events/:id/reactions` | comută o reacție `{ emoji }` |
| `GET` / `POST` | `/api/events/:id/comments` | listează / adaugă comentariu |

### Etapa 3 — timp real

WebSocket la `/ws?token=<JWT>`; mesaje client: `{ action: 'subscribe', groupId }`.
Server emite `NEW_ACTIVITY`, `PRICE_UPDATE`, `PRICE_JUMP`, `NOTIFICATION`.

| Metodă | Rută | Descriere |
| --- | --- | --- |
| `POST` | `/api/push/register` | înregistrează token Expo `{ token }` |
| `POST` | `/api/market/tick` | avansează prețurile (dev/demo) |
| `GET` | `/api/market/prices` | prețuri curente |

### Etapa 4 — provocări & gamificare

| Metodă | Rută | Descriere |
| --- | --- | --- |
| `POST` / `GET` | `/api/groups/:id/tournaments` | creează / listează turnee |
| `POST` | `/api/tournaments/:id/join` | înscriere în turneu |
| `GET` | `/api/tournaments/:id/leaderboard` | clasament turneu (ROI în fereastră) |
| `GET` | `/api/groups/:id/leaderboard/sharpe` | clasament ajustat la risc (Sharpe) |
| `GET` | `/api/me/badges` | insignele mele + catalog |

### Etapa 5 — educativ

| Metodă | Rută | Descriere |
| --- | --- | --- |
| `GET` | `/api/academy/missions` | misiuni + progres |
| `POST` | `/api/academy/missions/:id/complete` | marchează finalizată |
| `GET` / `POST` | `/api/academy/quizzes/:id[/submit]` | quiz / trimite răspunsuri |
| `POST` | `/api/academy/calculator/compound` | calculator dobândă compusă |
| `GET` | `/api/academy/risk-score` | scor de risc al portofoliului |

## Note

- Bani strict **virtuali** (educativ). Capital de start: 100.000 (configurabil prin `STARTING_CASH`).
- Următorii pași (vezi `../docs/ROADMAP.md`): feed social, timp real, provocări, academie.
