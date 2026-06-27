# Design — InvestPals (mobil)

Direcție vizuală: **dark-first, prietenoasă, modernă** — carduri rotunjite cu umbre,
un albastru-violet ca accent, verde/roșu pentru câștig/pierdere, avatare cu inițiale,
emoji ca accente, grafic de capital cu gradient.

Paleta și componentele sunt în `mobile/src/theme.ts` și `mobile/src/components/ui.tsx`.

## Ecrane (machete)

| | Ecran |
| --- | --- |
| ![](01-login.png) | **Login** — logo, OAuth Google/Apple |
| ![](02-portfoliu.png) | **Portofoliu** — card de streak 🔥, hero equity cu grafic, dețineri |
| ![](03-piata.png) | **Piață** — instrumente live, panou de tranzacționare + sentiment 📈📉 |
| ![](04-clasament.png) | **Clasament de grup** — medalii 🥇🥈🥉, avatare, rândul „tu" evidențiat |
| ![](05-feed.png) | **Feed social** — activitate, reacții, comentarii |
| ![](06-academie.png) | **Academie** — progres, misiuni, quiz-uri, insigne |

## Cum se regenerează machetele
`mockups.gen.mjs` produce fișiere HTML; capturile se fac cu Chromium la viewport 390×844 @2x
(Playwright cu viewport forțat — altfel chenarul ferestrei taie bara de jos).

> Notă: machetele sunt o reprezentare fidelă a designului implementat în cod (aceeași paletă
> și aceleași componente). Nu sunt capturi din build-ul Expo rulat pe device.
