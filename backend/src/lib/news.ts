/**
 * lib/news — generator of FAKE news that "sounds" like real financial news.
 *
 * Each news item has a headline + article body + source, with realistic specifics
 * (analysts, price targets, quarters, amounts, regions) generated DETERMINISTICALLY from
 * an rng (all users see the same news). Headlines are generally AMBIGUOUS — the
 * impact (up/down) is internal and not revealed; the user interprets it.
 *
 * Pure, tested functions.
 */

/** Context with realistic specifics, generated deterministically. */
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
  /** +1 = tends to push the price up, -1 down (internal, undisclosed). */
  polarity: 1 | -1;
  /** Base magnitude of the move (fraction). */
  magnitude: number;
  headline: (name: string, c: NewsCtx) => string;
  body: (name: string, c: NewsCtx) => string;
}

const FIRMS = ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'UBS', 'Barclays', 'Citi', 'Bank of America', 'Jefferies'];
const REGIONS = ['the US', 'the European Union', 'the United Kingdom', 'Asia'];
const SECTORS = ['technology', 'semiconductors', 'energy', 'retail', 'healthcare', 'auto', 'fintech'];
const PRODUCTS = ['the next generation of products', 'the cloud platform', 'the production lines', 'the core service', 'the base model'];
const TRENDS = ['improving', 'softening', 'below expectations', 'above estimates', 'mixed'];
const SOURCES = ['Markets Today', 'Capital Markets Wire', 'Financial Wire', 'Global Market', 'The Investor', 'Reuters Markets', 'Bloomberg Markets', 'Street Signal', 'The Ticker', 'Premarket Brief'];

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

/** Builds the specifics context (consumes a fixed number of values from rng). */
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
    money: `$${mld.toFixed(1)} bn`,
    moneyM: `$${mil} mn`,
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
 * All headlines are NEUTRAL — you cannot infer the direction (up/down) from either the
 * headline or the body. Polarity/magnitude stay internal (they move the price), but the
 * player cannot read them, so predictions don't turn into a sure win.
 */
export const NEWS_TEMPLATES: readonly NewsTemplate[] = [
  {
    category: 'corporate',
    polarity: 1,
    magnitude: 0.05,
    headline: (n) => `${n} reorganizes one of its divisions`,
    body: (n) =>
      `${n} announced an internal reorganization of one of its divisions. The company provided no financial details, and the market's reaction remains uncertain.`,
  },
  {
    category: 'volume',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `Unusual trading volume in ${n} today`,
    body: (n) =>
      `Shares of ${n} saw above-average volume in today's session. Analysts have not identified a clear reason; the move may be technical or driven by positioning.`,
  },
  {
    category: 'investor',
    polarity: 1,
    magnitude: 0.06,
    headline: (n) => `${n} is holding an investor presentation this week`,
    body: (n) =>
      `${n} will present to investors this week. The content has not been disclosed, and the market is awaiting details before reacting.`,
  },
  {
    category: 'analyst',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `Analysts reassess ${n} ahead of earnings`,
    body: (n, c) =>
      `Several brokerages, including ${c.firm}, are revising their models for ${n} ahead of the next earnings report. Opinions remain divided, with no clear direction.`,
  },
  {
    category: 'fund',
    polarity: 1,
    magnitude: 0.04,
    headline: (n) => `A fund has adjusted its position in ${n}`,
    body: (n) =>
      `Recent filings show that an institutional fund changed its holding in ${n}. It is unclear whether it bought or trimmed, and the size of the adjustment was not detailed.`,
  },
  {
    category: 'mna',
    polarity: -1,
    magnitude: 0.06,
    headline: (n, c) => `${n} is reportedly in talks on a matter in the ${c.sector} sector`,
    body: (n, c) =>
      `Market sources point to talks involving ${n} related to the ${c.sector} sector. There is no official confirmation, and the nature of the deal is unclear.`,
  },
  {
    category: 'supply',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `${n} makes supply-chain adjustments`,
    body: (n, c) =>
      `${n} communicated adjustments to ${c.product}. The company did not specify whether these raise or lower costs; the net effect remains to be seen.`,
  },
  {
    category: 'leadership',
    polarity: 1,
    magnitude: 0.04,
    headline: (n) => `Changes to ${n}'s management team`,
    body: (n) =>
      `${n} announced personnel changes in its leadership. The impact on strategy is not yet clear, and reactions are mixed.`,
  },
  {
    category: 'contract',
    polarity: 1,
    magnitude: 0.05,
    headline: (n) => `${n} updates the terms of an existing contract`,
    body: (n) =>
      `${n} renegotiated the terms of a contract. The value and the implications for margins have not been publicly disclosed.`,
  },
  {
    category: 'compliance',
    polarity: -1,
    magnitude: 0.05,
    headline: (n, c) => `${n} is in compliance talks with authorities in ${c.region}`,
    body: (n, c) =>
      `${n} is in dialogue with authorities in ${c.region} on a routine compliance matter. The company says the process is standard; the consequences remain unclear.`,
  },
  {
    category: 'options',
    polarity: 1,
    magnitude: 0.05,
    headline: (n) => `Elevated options activity in ${n}`,
    body: (n) =>
      `The options market in ${n} was more active than usual. Positions are split between bets on a rise and on a decline, with no dominant trend.`,
  },
  {
    category: 'product',
    polarity: 1,
    magnitude: 0.05,
    headline: (n, c) => `${n} is testing ${c.product} internally`,
    body: (n, c) =>
      `${n} is reportedly testing ${c.product} internally. The stage is early and there is no official timeline, so the commercial impact is uncertain.`,
  },
  {
    category: 'sector',
    polarity: -1,
    magnitude: 0.05,
    headline: (n, c) => `Industry debate over the future of the ${c.sector} sector`,
    body: (n, c) =>
      `A sector report on ${c.sector} has sparked debate, and ${n} is mentioned among the companies in focus. The conclusions are nuanced, with no single direction.`,
  },
  {
    category: 'guidance',
    polarity: 1,
    magnitude: 0.05,
    headline: (n) => `${n} reiterates its targets for the current year`,
    body: (n, c) =>
      `${n} reaffirmed its annual targets without providing new figures. Management described the environment as ${c.trend}, wording that analysts interpreted differently.`,
  },
  {
    category: 'event',
    polarity: -1,
    magnitude: 0.04,
    headline: (n) => `${n} has scheduled a press conference`,
    body: (n) =>
      `${n} announced a press conference without specifying the topic. Speculation is circulating in both directions until the event takes place.`,
  },
  {
    category: 'data',
    polarity: 1,
    magnitude: 0.05,
    headline: (n, c) => `New data from the ${c.sector} sector reaches the market`,
    body: (n, c) =>
      `Fresh indicators from ${c.sector}, relevant to ${n}, are being analyzed by the market. Their reading is mixed and could be revised.`,
  },
  {
    category: 'investment',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `${n} continues its investment program`,
    body: (n, c) =>
      `${n} confirmed that it is continuing its investment plan of ${c.money}. Investors are debating whether the effort supports growth or weighs on cash flow.`,
  },
  {
    category: 'analyst',
    polarity: 1,
    magnitude: 0.04,
    headline: (n, c) => `${c.firm} publishes an extensive note on ${n}`,
    body: (n, c) =>
      `${c.firm} published a detailed analysis of ${n}, with arguments both for and against the position. The note does not draw a firm conclusion.`,
  },
  {
    category: 'partnership',
    polarity: 1,
    magnitude: 0.05,
    headline: (n, c) => `${n} explores a collaboration in ${c.sector}`,
    body: (n, c) =>
      `${n} is reportedly exploring a possible collaboration in ${c.sector}. Talks are at an early stage with no settled terms, so the effect is hard to estimate.`,
  },
  {
    category: 'macro',
    polarity: -1,
    magnitude: 0.05,
    headline: (n, c) => `Market digests central bank signals; ${c.sector} in focus`,
    body: (n, c) =>
      `The central bank's latest comments are being analyzed by the market. The ${c.sector} sector, which ${n} belongs to, is being watched, but reactions across individual stocks are uneven.`,
  },
  {
    category: 'rumor',
    polarity: -1,
    magnitude: 0.06,
    headline: (n) => `${n} is the subject of market chatter`,
    body: (n, c) =>
      `Unconfirmed talk about ${n} is circulating among desks, tied loosely to the ${c.sector} space. Nothing has been verified and the company has not commented.`,
  },
  {
    category: 'guidance',
    polarity: 1,
    magnitude: 0.06,
    headline: (n, c) => `${n} updates its outlook for ${c.quarter}`,
    body: (n, c) =>
      `${n} revised its outlook for ${c.quarter}, citing trends described as ${c.trend}. Analysts disagree on what it implies going forward.`,
  },
  {
    category: 'rating',
    polarity: 1,
    magnitude: 0.05,
    headline: (n, c) => `${c.firm} revisits its rating on ${n}`,
    body: (n, c) =>
      `${c.firm} took another look at ${n}, weighing a price target near ${c.target}. The note lists both upside and downside cases without committing.`,
  },
  {
    category: 'insider',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `Insider activity reported at ${n}`,
    body: (n, c) =>
      `Regulatory filings show insider transactions at ${n} worth about ${c.moneyM}. Such moves can mean many things and are not a clear signal on their own.`,
  },
  {
    category: 'legal',
    polarity: -1,
    magnitude: 0.06,
    headline: (n) => `${n} addresses an ongoing legal matter`,
    body: (n, c) =>
      `${n} commented on a pending matter before authorities in ${c.region}. The outcome and timing remain uncertain, with arguments on both sides.`,
  },
  {
    category: 'product',
    polarity: 1,
    magnitude: 0.05,
    headline: (n, c) => `${n} previews ${c.product}`,
    body: (n, c) =>
      `${n} gave an early look at ${c.product}. Reception across the market has been mixed, and the commercial impact is not yet clear.`,
  },
  {
    category: 'capital',
    polarity: 1,
    magnitude: 0.05,
    headline: (n) => `${n} weighs its capital-return options`,
    body: (n, c) =>
      `${n} is said to be reviewing options for returning capital, on the order of ${c.money}. Investors are split on whether it is the best use of cash.`,
  },
  {
    category: 'workforce',
    polarity: -1,
    magnitude: 0.05,
    headline: (n) => `${n} adjusts its headcount plans`,
    body: (n, c) =>
      `${n} confirmed changes to its hiring plans across ${c.sector}. The move is being read both as discipline and as caution, depending on the desk.`,
  },
  {
    category: 'volume',
    polarity: 1,
    magnitude: 0.06,
    headline: (n) => `Unusual options volume around ${n}`,
    body: (n, c) =>
      `Traders flagged heavier-than-usual options activity around ${n}, near levels of ${c.target}. Positioning like this can point either way.`,
  },
];

export interface GeneratedNews {
  symbol: string;
  source: string;
  headline: string;
  body: string;
  /** Signed impact on the price (internal, undisclosed). */
  impact: number;
}

export interface Instrumentish {
  symbol: string;
  name: string;
}

/**
 * Can generate a news item for an instrument chosen deterministically from `rng`.
 * With probability `probability` it produces a news item; otherwise `null`.
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
  const factor = 0.7 + rng() * 0.6; // varies the magnitude 0.7x–1.3x

  // Tidy up double punctuation (names ending in ".", e.g. "Intel Corp.").
  const tidy = (s: string) => s.replace(/\.{2,}/g, '.').replace(/\.\s*,/g, ',');

  return {
    symbol: inst.symbol,
    source,
    headline: tidy(tpl.headline(inst.name, ctx)),
    body: tidy(tpl.body(inst.name, ctx)),
    impact: tpl.polarity * tpl.magnitude * factor,
  };
}
