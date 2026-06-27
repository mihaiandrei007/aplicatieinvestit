# Idei de funcționalități — cercetare de piață

Listă de funcționalități pe care le-am putea implementa în InvestPals, sintetizată din
analiza unor aplicații similare (investiții/trading cu competiție între prieteni).
Fiecare idee are: **sursa** (ce app o face bine), **de ce contează**, **efort** (Mic/Mediu/Mare)
și **se bazează pe** (ce avem deja).

> Aplicații studiate: Public.com, eToro, Stocktwits, Commonstock, Iris, M1 Finance, Stash,
> Invstr (Fantasy Finance), StockBattle, Wall Street Survivor, BestBrokers, MarketWatch VSE,
> HowTheMarketWorks, TradingView „The Leap", Investopedia Simulator, Robinhood Learn,
> Greenlight, Step, Khan Academy, Zogo, Finny, Bamboo, Stockpedia,
> + mecanici din Duolingo, Strava, BeReal, Sleeper/DraftKings, Spotify Wrapped.

---

## 0. Ce avem deja (recap)
Portofoliu personal + ROI, grupuri cu cod de invitație, clasament de grup, feed de activitate
cu reacții + comentarii, WebSocket (prețuri + feed live), push (te-a depășit X / o acțiune a sărit),
turnee (ROI în fereastră), clasament Sharpe, insigne, anti-overtrading (limită/zi), academie
(misiuni + quiz-uri cu explicații + calculator dobândă compusă + scor de risc), OAuth Google/Apple.

## 0.1 Lecția strategică (important)
**Public.com și-a închis feed-ul social în 2025**, iar Commonstock a fost absorbit de Yahoo.
Concluzie: feed-urile sociale „urmărește străini" nu rețin utilizatori pe termen lung.
Avantajul nostru defensabil = **grupuri închise de prieteni + bani virtuali + competiție + educație**.
Relația reală (prietenii) e motorul de retenție — nu un feed public. *Rămânem friends-first.*

---

## 1. Quick wins — impact mare, efort mic (de început cu astea)

> ✅ **#1, #2, #3, #6 sunt IMPLEMENTATE** (backend + mobil, validate E2E). Restul rămân.

| # | Funcționalitate | Sursă | Efort | Stare |
|---|---|---|---|---|
| 1 | **Buget de tranzacții ca „monedă"** — 1 credit/trade, se reîncarcă la check-in | Invstr | Mic | ✅ implementat |
| 2 | **Streak de investiție** + „streak freeze" | Duolingo | Mic | ✅ implementat |
| 3 | **Tag Bullish/Bearish cu un tap** → sentiment de grup per simbol | Stocktwits | Mic | ✅ implementat |
| 4 | **„Explică-ți tranzacția"** — notă opțională atașată trade-ului, apare în feed | HowTheMarketWorks | Mic | de făcut |
| 5 | **Reacții rapide (kudos) pe orice element din feed** | Strava | Mic | de făcut |
| 6 | **Lecție → quiz → recompensă** (cash virtual + credite, nu bani reali) | Robinhood Learn&Earn | Mic | ✅ implementat |
| 7 | **Micro-lecție „înainte de primul trade"** (gating onboarding) | Robinhood 101 | Mic | de făcut |
| 8 | **Clasament doar pe P&L realizat + actualizare orară** | TradingView | Mic | de făcut |

---

## 2. Social & feed

| Funcționalitate | Sursă | Efort | Se bazează pe |
|---|---|---|---|
| Sentiment Bullish/Bearish per simbol (agregat din tag-urile grupului) | Stocktwits | Mic | feed |
| Note „de ce am cumpărat" la fiecare trade (teză de investiție) | Commonstock, HowTheMarketWorks | Mic | feed |
| Profiluri bogate: ROI, win rate, timp mediu de deținere, scor de risc 1–7 | eToro | Mediu | snapshot portofoliu |
| Convenție de afișare în **procente, nu sume** (învață gândirea pe alocare) | Commonstock, Iris | Mic | UI |
| „Copiază portofoliul unui prieten" ca șablon de start (nu copy-trading live) | M1 Finance (Pie) | Mediu | tranzacții |
| Listă socială „cele mai deținute de grupul tău / de toți" | Robinhood (100 Most Popular) | Mic-Mediu | tranzacții (date proprii) |
| Sondaje în grup („ce acțiune cumpărăm săptămâna asta?") | Sleeper | Mic-Mediu | grupuri |

## 3. Competiție & gamificare

| Funcționalitate | Sursă | Efort | Se bazează pe |
|---|---|---|---|
| **Scară de niveluri cu nume** (Intern → … → Guru), XP din misiuni, recompense la level-up | Invstr | Mediu | insigne |
| **Tiere de corectitudine pe comportament** (Raw / Supreme / Xtreme): cei care fac overtrading sau folosesc „power-ups" merg pe board separat | Invstr | Mediu | anti-overtrading + clasament |
| **Dueluri 1v1 între prieteni** pe fereastră scurtă (1 zi / 1 săptămână), cine are % mai mare | StockBattle | Mediu-Mare | turnee |
| Recompensă de **consistență** (stil „Local Legend"), nu doar ROI brut — descurajează overtrading | Strava | Mic-Mediu | snapshot-uri capital |
| Meniu de **reguli custom la crearea ligii** (cash start, date, simboluri permise, comision) | MarketWatch VSE | Mediu | turnee/grupuri |
| Comision simulat per tranzacție (taxă soft anti-churn) | HowTheMarketWorks | Mic | trade |
| Gating clasament pe „a făcut primul trade" (nudge de activare) | HowTheMarketWorks | Mic | clasament |

## 4. Educație

| Funcționalitate | Sursă | Efort | Se bazează pe |
|---|---|---|---|
| Buclă lecție→quiz→**recompensă virtuală/insignă** | Robinhood Learn&Earn | Mic | academie + quiz |
| Micro-modul obligatoriu **înainte de primul trade** | Robinhood 101 | Mic | academie |
| **Glosar ca micro-lecții** — fiecare termen = explicație de 20s, tooltips deep-link | Investopedia (30k termeni) | Mediu | academie |
| Buton **„Explică asta"** contextual pe o deținere/tranzacție | Public (Alpha), Investopedia | Mediu | (opțional AI) |
| Studii de caz „replay" ca trade-uri ghidate în sandbox | Stockpedia/ProLearn | Mediu | priceSim + portofoliu |
| Detectare & afișare overtrading în istoricul de tranzacții (educativ) | Investopedia | Mic | tranzacții |
| **Misiune = video scurt + quiz + XP/coins, scor pe 3 stele** (după % corect) | Greenlight Level Up | Mediu | academie |
| **Model de „mastery" cu degradare** (Familiar→Proficient→Mastered, scazi puncte dacă uiți) — răsplătește înțelegerea reținută, nu quiz-ul de o dată | Khan Academy | Mediu | academie |
| **Recompensă „cel mai progresat"**, nu doar primul loc (ține începătorii în joc) | Step Money 101 | Mic | quiz |
| **Lecții care deblochează funcții în portofoliu** (ex. misiunea „diversificare" → deblochează scorul de diversificare) — *nimeni nu leagă educația de comportament* | whitespace | Mediu | academie + portofoliu |
| **Glosar + repetiție spațiată** (slăbiciunea clară a lui Zogo — termenii nu se reîntăresc) | gap Zogo | Mediu | academie |

## 5. Engagement, retenție & timp real

| Funcționalitate | Sursă | Efort | Se bazează pe |
|---|---|---|---|
| **Clasament de grup live în timpul orelor de piață** | DraftKings, Strava | Mic | WebSocket |
| **Streak + streak freeze** + push „îți pierzi streak-ul" la ora obișnuită | Duolingo | Mic-Mediu | push |
| **Recap săptămânal „InvestPals Wrapped"** (cel mai bun trade, locul în grup, ROI vs prieteni) — shareable | Spotify Wrapped, Duolingo Leagues | Mediu | date stocate + push |
| **Chat de grup** cu reacții, GIF-uri, sondaje (lipiciul competiției între prieteni) | Sleeper, Discord | Mare | grupuri |
| **Watchlist + alerte de preț configurabile** (5%/10%, maxim 52 săpt.) | Robinhood | Mediu | WebSocket + push |
| **Watch-party** la evenimente de piață (rezultate/Fed): feed live + chat | Stocktwits, DraftKings | Mare | WebSocket + feed |
| **„Market moment" zilnic** (prompt de predicție/pick sincronizat pentru tot grupul) | BeReal | Mediu | push + UI |
| **Trivia zilnică de GRUP** cu clasament (Zogo o face anonim/global — noi o facem între prieteni) | Zogo Trivia Party | Mediu | leaderboard + grupuri |
| Plafon global de notificări (<5/săpt) + ore de liniște + categorii opt-in | best practice fintech, Discord | Mic-Mediu | push |

---

## 6. De evitat (conștient)
- **Taxe de intrare / premii în bani reali** (StockBattle, StockPe) — risc de reglementare (jocuri de noroc/valori mobiliare). InvestPals rămâne **strict virtual**.
- **Feed public cu străini / social-trading deschis** — Public.com l-a închis; nu reține. Rămânem friends-first.
- **Copy-trading automat în timp real** (eToro CopyTrader) — infrastructură grea, valoare mică pe bani virtuali. Varianta ușoară = „copiază șablonul" (M1 Pie).
- **Monetizare pay-to-win** — dacă vreodată monetizăm, doar cosmetice/conveniență (skin-uri, „Gems" câștigați), niciodată avantaj de joc.

## 7. Diferențiatorii noștri (nimeni nu le combină pe toate trei)
1. **Clasament ajustat la risc (Sharpe)** la nivel de grup — aproape niciun competitor de consum nu-l oferă.
2. **Streak/obișnuință zilnică** legate de investiție educativă.
3. **Învățare cablată explicit într-un grup de prieteni** (academie + feed social + clasament pe risc într-un singur produs virtual).

## 8. Notă de implementare
Conform principiului din CLAUDE.md: orice logică nouă = **funcție pură + test (Vitest)**, apoi rută, apoi UI.
Multe dintre ideile de mai sus sunt aproape pur business-logic (streak, buget de tranzacții, tiere de
corectitudine, consistență, Wrapped, sentiment) — se pretează perfect la modulele pure existente.

### Propunere de ordine (sprinturi mici)
1. Quick wins #1–#8 (buget tranzacții, streak, sentiment, note trade, kudos, lecție→recompensă, micro-modul, P&L realizat).
2. Niveluri + tiere de corectitudine + recompensă de consistență.
3. Recap săptămânal „Wrapped" + watchlist/alerte.
4. Chat de grup + dueluri 1v1.
5. Watch-party + market moment zilnic.
