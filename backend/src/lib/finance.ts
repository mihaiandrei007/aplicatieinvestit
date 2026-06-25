/**
 * lib/finance — calculatoare financiare educative (pure, testate).
 * Dobândă compusă, valoare viitoare cu contribuții, regula lui 72.
 */

/**
 * Dobândă compusă: valoarea unui principal după `years` ani la rata anuală `rate`
 * (ex. 0.07), capitalizat de `perYear` ori pe an.
 */
export function compoundInterest(principal: number, rate: number, years: number, perYear = 1): number {
  if (principal < 0 || years < 0 || perYear <= 0) {
    throw new Error('Parametri invalizi pentru dobânda compusă.');
  }
  return round(principal * (1 + rate / perYear) ** (perYear * years));
}

/**
 * Valoarea viitoare a unei investiții cu contribuții lunare constante.
 * `monthlyContribution` se adaugă la finalul fiecărei luni.
 */
export function futureValueWithContributions(
  principal: number,
  annualRate: number,
  years: number,
  monthlyContribution: number,
): number {
  const months = Math.round(years * 12);
  const monthlyRate = annualRate / 12;
  let value = principal;
  for (let i = 0; i < months; i++) {
    value = value * (1 + monthlyRate) + monthlyContribution;
  }
  return round(value);
}

/** Regula lui 72: ani aproximativi pentru dublarea banilor la o rată dată. */
export function ruleOf72(annualRatePercent: number): number {
  if (annualRatePercent <= 0) throw new Error('Rata trebuie să fie pozitivă.');
  return round(72 / annualRatePercent);
}

/** Randament anualizat (CAGR) din valoarea inițială/finală pe `years` ani. */
export function cagr(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || years <= 0) return 0;
  return (endValue / startValue) ** (1 / years) - 1;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
