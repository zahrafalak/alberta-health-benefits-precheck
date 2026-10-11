/**
 * The Alberta Child Health Benefit and Alberta Adult Health Benefit rules this pre-check
 * uses: income limits by family and the published income formula. Plain data and pure
 * functions, copied from the program pages on alberta.ca. Nothing here imports React or
 * the design system (src/lib/framework-neutral.test.ts enforces it).
 *
 * When the program pages change, update the numbers and CHECKED_ON together.
 */

export type Program = "child" | "adult";

export const CHECKED_ON = "2026-10-10";

/** Applies to the October 1, 2026 to September 30, 2027 benefit year, based on 2025 income. */
export const BENEFIT_YEAR = "October 1, 2026 to September 30, 2027";

export const SOURCES: Record<Program, { name: string; url: string; checkedOn: string }> = {
  child: {
    name: "Alberta Child Health Benefit",
    url: "https://www.alberta.ca/alberta-child-health-benefit",
    checkedOn: CHECKED_ON,
  },
  adult: {
    name: "Alberta Adult Health Benefit",
    url: "https://www.alberta.ca/alberta-adult-health-benefit",
    checkedOn: CHECKED_ON,
  },
};

/** The application form both programs use. */
export const APPLICATION_FORM = {
  number: "AEHB3931",
  url: "https://cfr.forms.gov.ab.ca/Form/AEHB3931",
};

export type Household = {
  hasPartner: boolean;
  /** Children under 18, or 18 and 19 living at home and attending high school. */
  children: number;
};

/**
 * Maximum income by number of children (index 0 to 4), from the "Income guidelines"
 * tables on both program pages. The Child Health Benefit has no row without children.
 */
const MAXIMUM_INCOME = {
  single: [16_580, 26_023, 31_010, 36_325, 41_957],
  couple: [23_212, 31_237, 36_634, 41_594, 46_932],
} as const;

/** "For each additional child, add $4,973" to the four-child amount. */
export const PER_ADDITIONAL_CHILD = 4_973;

/**
 * The maximum income for a household under a program, or null when the program doesn't
 * apply to that household (the Child Health Benefit needs at least one child).
 */
export function incomeLimit(program: Program, household: Household): number | null {
  const { hasPartner, children } = household;
  if (!Number.isInteger(children) || children < 0) {
    throw new RangeError(`children must be a whole number of 0 or more, got ${children}`);
  }
  if (program === "child" && children === 0) return null;

  const row = hasPartner ? MAXIMUM_INCOME.couple : MAXIMUM_INCOME.single;
  if (children <= 4) return row[children];
  return row[4] + (children - 4) * PER_ADDITIONAL_CHILD;
}

/** The amounts the income formula uses, in dollars, from the 2025 tax returns. */
export type IncomeAnswers = {
  /** Line 23600 (net income) on your return. */
  yourNetIncome: number;
  /** Line 23600 on your spouse's or partner's return; 0 without one. */
  partnerNetIncome: number;
  /** Line 12799: total support payments received by you and your partner. */
  supportPayments: number;
  /** Line 12800: the taxable part of those support payments. */
  taxableSupportPayments: number;
  /** Your household's total annual drug costs. */
  annualDrugCosts: number;
};

/**
 * "How to calculate your income", step by step from the program pages:
 * add both Line 23600 amounts; add the support payments (Line 12799) less their taxable
 * part (Line 12800); subtract total annual drug costs; if it's less than zero, use 0.
 */
export function familyIncome(answers: IncomeAnswers): number {
  const netIncome = answers.yourNetIncome + answers.partnerNetIncome;
  const nonTaxableSupport = answers.supportPayments - answers.taxableSupportPayments;
  const income = netIncome + nonTaxableSupport - answers.annualDrugCosts;
  return Math.max(0, income);
}

/** The pages give a "maximum income", so income equal to the limit is within it. */
export function isWithinLimit(income: number, limit: number): boolean {
  return income <= limit;
}
