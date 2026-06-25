# InvestPals — investiții (virtuale) între prieteni

Aplicație de telefon în care un grup de prieteni învață să investească împreună:
fiecare are portofoliul lui cu bani virtuali, vedeți un clasament al grupului și
un feed social cu mișcările fiecăruia. Zero risc real — totul e educativ.

Proiect pornit din simulatorul de bursă „Portofoliu Virtual" (atestat).
Reutilizează logica de business deja scrisă și testată acolo.

## Concept
- Grupuri de prieteni — creezi sau intri într-un grup cu un cod de invitație.
- Portofoliu personal — 100.000 (virtuali) de start, cumperi/vinzi acțiuni.
- Clasament de grup — cine are cel mai bun randament (ROI).
- Feed social — vezi ce au cumpărat/vândut prietenii, cu reacții și comentarii.
- Provocări — turnee lunare, „cine bate piața", obiective de învățare.
- Notificări push — un prieten te-a depășit, o acțiune a sărit, o provocare s-a încheiat.

## Stack propus
- Mobil: React Native + Expo (sau Flutter)
- Backend: Node + Express/Fastify + TypeScript
- Bază de date: PostgreSQL + Prisma
- Timp real: WebSockets / push notifications
- Auth: OAuth (Google/Apple) + JWT

## Ce reutilizăm din „Portofoliu Virtual"
Logica de business e deja scrisă ca funcții pure testate și e independentă de UI:
- calcul P&L și dețineri (portfolio)
- simulator de preț (beta, volatilitate, salturi) (priceSim)
- ordine cu limită, dividende, ROI/clasament, paginare
- conceptele educative (glosar, „academie cu misiuni")
Practic, backend-ul nou pornește de la aceste module + un model de date social.

## Roadmap
Vezi docs/ROADMAP.md. Pe scurt:
1. MVP — auth + portofoliu personal + un grup + clasament de grup.
2. Social — feed de activitate + reacții/comentarii.
3. Timp real — WebSockets + notificări push.
4. Provocări — turnee și obiective.
5. Educativ — academia cu misiuni adaptată la mobil.

## Notă legală
Aplicația rămâne strict educativă, cu bani virtuali. Dacă vreodată atinge bani
reali, intervin reglementări financiare serioase — de evitat la nivel de proiect școlar.
