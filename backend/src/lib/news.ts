/**
 * lib/news — generator de știri FALSE, dar care „sună" ca știri financiare reale.
 *
 * Fiecare știre are titlu + corp de articol + sursă, cu specificuri realiste
 * (analiști, ținte de preț, trimestre, sume, regiuni) generate DETERMINIST dintr-un
 * rng (toți utilizatorii văd aceeași știre). Titlurile sunt în general AMBIGUE —
 * impactul (urcă/coboară) e intern și nu se dezvăluie; utilizatorul interpretează.
 *
 * Funcții pure, testate.
 */

/** Context cu specificuri realiste, generat determinist. */
export interface NewsCtx {
  pct: number;
  money: string;
  moneyM: string;
  quarter: string;
  firm: string;
  region: string;
  sector: string;
  product: string;
  target: number;
  trend: string;
}

export interface NewsTemplate {
  category: string;
  /** +1 = tinde să împingă prețul în sus, -1 în jos (intern, nedezvăluit). */
  polarity: 1 | -1;
  /** Magnitudinea de bază a mișcării (fracțiune). */
  magnitude: number;
  headline: (name: string, c: NewsCtx) => string;
  body: (name: string, c: NewsCtx) => string;
}

const FIRMS = ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'UBS', 'Barclays', 'Citi', 'Bank of America', 'Jefferies'];
const REGIONS = ['SUA', 'Uniunea Europeană', 'Marea Britanie', 'Asia'];
const SECTORS = ['tehnologie', 'semiconductori', 'energie', 'retail', 'sănătate', 'auto', 'fintech'];
const PRODUCTS = ['noua generație de produse', 'platforma cloud', 'liniile de producție', 'serviciul principal', 'modelul de bază'];
const TRENDS = ['în creștere', 'în scădere', 'sub așteptări', 'peste estimări', 'mixtă'];
const SOURCES = ['Bursa de Azi', 'Capital Markets RO', 'Financial Wire', 'Piața Globală', 'Investitorul', 'Reuters Markets'];

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

/** Construiește contextul de specificuri (consumă un număr fix de valori din rng). */
export function buildCtx(rng: () => number): NewsCtx {
  const pct = 3 + Math.floor(rng() * 16);
  const mld = (5 + Math.floor(rng() * 120)) / 10;
  const mil = 20 + Math.floor(rng() * 480);
  const quarter = `T${1 + Math.floor(rng() * 4)}`;
  const firm = pick(rng, FIRMS);
  const region = pick(rng, REGIONS);
  const sector = pick(rng, SECTORS);
  const product = pick(rng, PRODUCTS);
  const target = 50 + Math.floor(rng() * 450);
  const trend = pick(rng, TRENDS);
  return {
    pct,
    money: `${mld.toFixed(1).replace('.', ',')} mld $`,
    moneyM: `${mil} mil $`,
    quarter,
    firm,
    region,
    sector,
    product,
    target,
    trend,
  };
}

/**
 * Toate titlurile sunt NEUTRE — nu poți deduce direcția (sus/jos) nici din titlu,
 * nici din corp. Polaritatea/magnitudinea rămân interne (mișcă prețul), dar
 * jucătorul nu le poate citi, ca să nu transforme predicțiile în câștig sigur.
 */
export const NEWS_TEMPLATES: readonly NewsTemplate[] = [
  {
    category: 'corporate',
    polarity: 1,
    magnitude: 0.05,
    headline: (n) => `${n} reorganizează una dintre diviziile sale`,
    body: (n) =>
      `${n} a anunțat o reorganizare internă a uneia dintre divizii. Compania nu a oferit detalii financiare, iar reacția pieței rămâne incertă.`,
  },
  {
    category: 'volume',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `Volum de tranzacționare neobișnuit pe ${n} astăzi`,
    body: (n) =>
      `Acțiunile ${n} au înregistrat un volum peste medie în ședința de azi. Analiștii nu au identificat un motiv clar; mișcarea poate fi tehnică sau pe baza unor poziționări.`,
  },
  {
    category: 'investor',
    polarity: 1,
    magnitude: 0.06,
    headline: (n) => `${n} susține o prezentare pentru investitori săptămâna aceasta`,
    body: (n) =>
      `${n} va prezenta în fața investitorilor săptămâna aceasta. Conținutul nu a fost dezvăluit, iar piața așteaptă detalii înainte de a reacționa.`,
  },
  {
    category: 'analyst',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `Analiștii reevaluează ${n} înaintea raportării`,
    body: (n, c) =>
      `Mai multe case de brokeraj, printre care ${c.firm}, își revizuiesc modelele pentru ${n} înaintea următoarei raportări. Opiniile rămân împărțite, fără o direcție clară.`,
  },
  {
    category: 'fund',
    polarity: 1,
    magnitude: 0.04,
    headline: (n) => `Un fond și-a ajustat poziția în ${n}`,
    body: (n) =>
      `Documente recente arată că un fond instituțional și-a modificat deținerea în ${n}. Nu este clar dacă a cumpărat sau a redus, iar mărimea ajustării nu a fost detaliată.`,
  },
  {
    category: 'mna',
    polarity: -1,
    magnitude: 0.06,
    headline: (n, c) => `${n} ar fi în discuții pe o temă din sectorul ${c.sector}`,
    body: (n, c) =>
      `Surse din piață vorbesc despre discuții implicând ${n} legate de sectorul ${c.sector}. Nu există confirmare oficială, iar natura tranzacției e neclară.`,
  },
  {
    category: 'supply',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `${n} face ajustări în lanțul de aprovizionare`,
    body: (n, c) =>
      `${n} a comunicat ajustări la ${c.product}. Compania nu a precizat dacă acestea cresc sau scad costurile; efectul net rămâne de văzut.`,
  },
  {
    category: 'leadership',
    polarity: 1,
    magnitude: 0.04,
    headline: (n) => `Schimbări în echipa de management a ${n}`,
    body: (n) =>
      `${n} a anunțat schimbări de personal în conducere. Impactul asupra strategiei nu este deocamdată clar, iar reacțiile sunt mixte.`,
  },
  {
    category: 'contract',
    polarity: 1,
    magnitude: 0.05,
    headline: (n) => `${n} actualizează termenii unui contract existent`,
    body: (n) =>
      `${n} a renegociat termenii unui contract. Valoarea și implicațiile asupra marjelor nu au fost dezvăluite public.`,
  },
  {
    category: 'compliance',
    polarity: -1,
    magnitude: 0.05,
    headline: (n, c) => `${n} poartă discuții de conformitate cu autoritățile din ${c.region}`,
    body: (n, c) =>
      `${n} este în dialog cu autoritățile din ${c.region} pe o temă de conformitate de rutină. Compania spune că procesul e standard; consecințele rămân neclare.`,
  },
  {
    category: 'options',
    polarity: 1,
    magnitude: 0.05,
    headline: (n) => `Activitate crescută a opțiunilor pe ${n}`,
    body: (n) =>
      `Piața de opțiuni pe ${n} a fost mai activă decât de obicei. Pozițiile sunt împărțite între pariuri pe creștere și pe scădere, fără o tendință dominantă.`,
  },
  {
    category: 'product',
    polarity: 1,
    magnitude: 0.05,
    headline: (n, c) => `${n} testează intern ${c.product}`,
    body: (n, c) =>
      `${n} ar testa intern ${c.product}. Stadiul e incipient și nu există un calendar oficial, deci impactul comercial e incert.`,
  },
  {
    category: 'sector',
    polarity: -1,
    magnitude: 0.05,
    headline: (n, c) => `Dezbatere în industrie despre viitorul sectorului ${c.sector}`,
    body: (n, c) =>
      `Un raport sectorial despre ${c.sector} a stârnit dezbateri, iar ${n} este menționată printre companiile vizate. Concluziile sunt nuanțate, fără o direcție unică.`,
  },
  {
    category: 'guidance',
    polarity: 1,
    magnitude: 0.05,
    headline: (n) => `${n} își reiterează obiectivele pentru anul în curs`,
    body: (n, c) =>
      `${n} și-a reconfirmat obiectivele anuale, fără a oferi cifre noi. Conducerea a descris mediul drept ${c.trend}, formulare interpretată diferit de analiști.`,
  },
  {
    category: 'event',
    polarity: -1,
    magnitude: 0.04,
    headline: (n) => `${n} a programat o conferință de presă`,
    body: (n) =>
      `${n} a anunțat o conferință de presă, fără a preciza tema. Speculațiile circulă în ambele direcții până la momentul evenimentului.`,
  },
  {
    category: 'data',
    polarity: 1,
    magnitude: 0.05,
    headline: (n, c) => `Date noi din sectorul ${c.sector} ajung la piață`,
    body: (n, c) =>
      `Indicatori proaspeți din ${c.sector}, relevanți pentru ${n}, sunt analizați de piață. Citirea lor este mixtă și ar putea fi revizuită.`,
  },
  {
    category: 'investment',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `${n} își continuă programul de investiții`,
    body: (n, c) =>
      `${n} a confirmat că își continuă planul de investiții de ${c.money}. Investitorii dezbat dacă efortul susține creșterea sau apasă pe fluxul de numerar.`,
  },
  {
    category: 'analyst',
    polarity: 1,
    magnitude: 0.04,
    headline: (n, c) => `${c.firm} publică o notă amplă despre ${n}`,
    body: (n, c) =>
      `${c.firm} a publicat o analiză detaliată despre ${n}, cu argumente atât pentru, cât și împotriva poziției. Nota nu trage o concluzie tranșantă.`,
  },
  {
    category: 'partnership',
    polarity: 1,
    magnitude: 0.05,
    headline: (n, c) => `${n} explorează o colaborare în ${c.sector}`,
    body: (n, c) =>
      `${n} ar explora o posibilă colaborare în ${c.sector}. Discuțiile sunt la început, fără termeni stabiliți, deci efectul e greu de estimat.`,
  },
  {
    category: 'macro',
    polarity: -1,
    magnitude: 0.05,
    headline: (n, c) => `Piața digeră semnalele băncii centrale; ${c.sector} în atenție`,
    body: (n, c) =>
      `Ultimele comentarii ale băncii centrale sunt analizate de piață. Sectorul ${c.sector}, din care face parte ${n}, e urmărit, dar reacțiile pe titluri sunt eterogene.`,
  },
];

export interface GeneratedNews {
  symbol: string;
  source: string;
  headline: string;
  body: string;
  /** Impact semnat asupra prețului (intern, nedezvăluit). */
  impact: number;
}

export interface Instrumentish {
  symbol: string;
  name: string;
}

/**
 * Poate genera o știre pentru un instrument ales determinist din `rng`.
 * Cu probabilitatea `probability` produce o știre; altfel `null`.
 */
export function maybeGenerateNews(
  rng: () => number,
  instruments: readonly Instrumentish[],
  probability = 0.5,
): GeneratedNews | null {
  if (instruments.length === 0) return null;
  if (rng() >= probability) return null;

  const inst = pick(rng, instruments);
  const tpl = pick(rng, NEWS_TEMPLATES);
  const ctx = buildCtx(rng);
  const source = pick(rng, SOURCES);
  const factor = 0.7 + rng() * 0.6; // variază magnitudinea 0.7x–1.3x

  // Curăță punctuația dublă (nume care se termină cu „.", ex. „Intel Corp.").
  const tidy = (s: string) => s.replace(/\.{2,}/g, '.').replace(/\.\s*,/g, ',');

  return {
    symbol: inst.symbol,
    source,
    headline: tidy(tpl.headline(inst.name, ctx)),
    body: tidy(tpl.body(inst.name, ctx)),
    impact: tpl.polarity * tpl.magnitude * factor,
  };
}
