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

export const NEWS_TEMPLATES: readonly NewsTemplate[] = [
  {
    category: 'earnings',
    polarity: 1,
    magnitude: 0.05,
    headline: (n, c) => `${n}: venituri peste estimări în ${c.quarter}, dar marjele se comprimă`,
    body: (n, c) =>
      `${n} a raportat venituri în creștere cu ${c.pct}% față de anul trecut în ${c.quarter}, peste consensul analiștilor, însă marja brută a scăzut pe fondul costurilor mai mari. Reacția în pre-market a fost mixtă.`,
  },
  {
    category: 'earnings',
    polarity: -1,
    magnitude: 0.06,
    headline: (n, c) => `${n} ratează estimările de profit în ${c.quarter}`,
    body: (n, c) =>
      `${n} a raportat un profit pe acțiune sub așteptările pieței în ${c.quarter}, deși veniturile au rămas aproape de consens. Conducerea a invocat o cerere ${c.trend} și presiuni pe costuri.`,
  },
  {
    category: 'guidance',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `${n} își revizuiește estimările pentru anul fiscal`,
    body: (n, c) =>
      `${n} a actualizat ghidajul pentru anul fiscal, menționând incertitudini legate de cererea ${c.trend} și de costurile de input. Analiștii sunt împărțiți privind implicațiile.`,
  },
  {
    category: 'analyst',
    polarity: -1,
    magnitude: 0.05,
    headline: (n, c) => `${c.firm} retrogradează ${n} la „Hold", citând o evaluare întinsă`,
    body: (n, c) =>
      `Analiștii de la ${c.firm} au coborât recomandarea pentru ${n} la „Hold" de la „Buy" și au redus ținta de preț la ${c.target} $, considerând că potențialul de creștere este deja reflectat în cotație.`,
  },
  {
    category: 'analyst',
    polarity: 1,
    magnitude: 0.05,
    headline: (n, c) => `${c.firm} ridică ținta pentru ${n} la ${c.target} $`,
    body: (n, c) =>
      `${c.firm} a reiterat o recomandare pozitivă pentru ${n} și a majorat ținta de preț la ${c.target} $, invocând o execuție solidă. Alți analiști rămân prudenți.`,
  },
  {
    category: 'mna',
    polarity: 1,
    magnitude: 0.07,
    headline: (n, c) => `${n}, în discuții avansate pentru o achiziție în sectorul ${c.sector}`,
    body: (n, c) =>
      `Surse apropiate afirmă că ${n} ar negocia preluarea unei companii din ${c.sector}, o tranzacție evaluată la aproximativ ${c.money}. Investitorii cântăresc costul integrării față de potențialul de creștere.`,
  },
  {
    category: 'regulatory',
    polarity: -1,
    magnitude: 0.06,
    headline: (n, c) => `Autoritățile din ${c.region} deschid o anchetă privind practicile ${n}`,
    body: (n, c) =>
      `Reglementatorii din ${c.region} au anunțat o investigație legată de practicile comerciale ale ${n}. Compania spune că va coopera; impactul financiar este deocamdată neclar.`,
  },
  {
    category: 'supply',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `${n} confirmă întârzieri în lanțul de aprovizionare`,
    body: (n, c) =>
      `${n} a confirmat întârzieri la ${c.product}, care ar putea afecta livrările din ${c.quarter}. Conducerea afirmă că problema este temporară.`,
  },
  {
    category: 'leadership',
    polarity: -1,
    magnitude: 0.04,
    headline: (n) => `Directorul financiar al ${n} demisionează`,
    body: (n) =>
      `CFO-ul ${n} și-a anunțat plecarea și va rămâne până la numirea unui succesor. Piața urmărește dacă schimbarea semnalează o ajustare de strategie.`,
  },
  {
    category: 'legal',
    polarity: 1,
    magnitude: 0.04,
    headline: (n, c) => `${n} ajunge la o înțelegere de ${c.moneyM} într-un proces`,
    body: (n, c) =>
      `${n} a încheiat o înțelegere de ${c.moneyM} pentru a închide un litigiu, eliminând o incertitudine juridică. Costul afectează însă rezultatul trimestrial.`,
  },
  {
    category: 'buyback',
    polarity: 1,
    magnitude: 0.06,
    headline: (n, c) => `${n} aprobă un program de răscumpărare de ${c.money}`,
    body: (n, c) =>
      `Consiliul ${n} a aprobat răscumpărări de acțiuni de până la ${c.money}. Unii investitori salută gestul, alții ar fi preferat investiții în creștere.`,
  },
  {
    category: 'partnership',
    polarity: 1,
    magnitude: 0.05,
    headline: (n, c) => `${n} anunță un parteneriat strategic în ${c.sector}`,
    body: (n, c) =>
      `${n} a încheiat un parteneriat cu un actor major din ${c.sector}. Detaliile financiare nu au fost dezvăluite, iar analiștii dezbat amploarea beneficiilor.`,
  },
  {
    category: 'fund',
    polarity: 1,
    magnitude: 0.04,
    headline: (n) => `Un fond suveran și-a majorat participația la ${n}`,
    body: (n) =>
      `Documente de reglementare arată că un fond suveran și-a crescut deținerea în ${n} în ultimul trimestru. Mișcarea e citită ca un vot de încredere, deși poziția rămâne minoritară.`,
  },
  {
    category: 'activist',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `Un investitor activist a construit o poziție în ${n}`,
    body: (n) =>
      `Un fond activist a anunțat o participație în ${n} și cere schimbări în alocarea capitalului. Astfel de campanii pot crește valoarea sau pot semnala probleme.`,
  },
  {
    category: 'restructuring',
    polarity: 1,
    magnitude: 0.04,
    headline: (n) => `${n} anunță o restructurare cu reduceri de costuri`,
    body: (n, c) =>
      `${n} a anunțat un plan de reducere a costurilor cu ${c.money} anual, care include disponibilizări. Piața dezbate dacă măsura reflectă disciplină sau o cerere mai slabă.`,
  },
  {
    category: 'cyber',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `${n} investighează o posibilă breșă de securitate`,
    body: (n) =>
      `Un cercetător a raportat o vulnerabilitate la ${n}. Compania investighează și spune că nu există dovezi de date compromise. Amploarea rămâne neclară.`,
  },
  {
    category: 'demand',
    polarity: 1,
    magnitude: 0.05,
    headline: (n, c) => `Date din industrie indică o cerere ${c.trend} pentru ${n}`,
    body: (n, c) =>
      `Indicatori recenți din ${c.sector} arată o cerere ${c.trend} relevantă pentru ${n}. Semnalul este preliminar și ar putea fi revizuit.`,
  },
  {
    category: 'product',
    polarity: 1,
    magnitude: 0.05,
    headline: (n, c) => `${n} pregătește lansarea pentru ${c.product}`,
    body: (n, c) =>
      `${n} ar urma să prezinte ${c.product} în ${c.quarter}. Așteptările sunt ridicate, ceea ce ridică ștacheta pentru execuție.`,
  },
  {
    category: 'macro',
    polarity: -1,
    magnitude: 0.05,
    headline: (n, c) => `Sectorul ${c.sector} sub presiune după semnale de la banca centrală`,
    body: (n, c) =>
      `Comentariile băncii centrale privind dobânzile au pus presiune pe sectorul ${c.sector}, din care face parte și ${n}. Reacțiile pe titluri sunt eterogene.`,
  },
  {
    category: 'analyst',
    polarity: -1,
    magnitude: 0.04,
    headline: (n, c) => `${c.firm} reduce ținta de preț pentru ${n} la ${c.target} $`,
    body: (n, c) =>
      `${c.firm} a redus ținta pentru ${n} la ${c.target} $, menținând o recomandare neutră. Firma vede un orizont de creștere mai temperat.`,
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
