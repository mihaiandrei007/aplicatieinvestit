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

## Note

- Bani strict **virtuali** (educativ). Capital de start: 100.000 (configurabil prin `STARTING_CASH`).
- Următorii pași (vezi `../docs/ROADMAP.md`): feed social, timp real, provocări, academie.
