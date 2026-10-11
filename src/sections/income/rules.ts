import type { IncomeAnswers as IncomeFields } from "../../lib/form-state";
import type { IncomeAnswers } from "../../lib/health-benefits";
import { all, required, when, runSchema, type Rule, type Schema } from "../../lib/validation";

/**
 * Your income: the amounts the published income formula uses (src/lib/health-benefits.ts),
 * each with help on where to find it. Three pages, in order. The partner's amount is asked
 * only when the household has a partner. Amounts are kept as typed and parsed here.
 */

export type IncomeStepId = "net-income" | "support-payments" | "drug-costs";

export type IncomeField = keyof IncomeFields;

export type IncomeStepConfig = {
  heading: string;
  fields: IncomeField[];
};

export const INCOME_STEPS: Record<IncomeStepId, IncomeStepConfig> = {
  "net-income": {
    heading: "What was your net income in 2025?",
    fields: ["yourNetIncome", "partnerNetIncome"],
  },
  "support-payments": {
    heading: "Did you receive child or spousal support in 2025?",
    fields: ["supportPayments", "taxableSupportPayments"],
  },
  "drug-costs": {
    heading: "What are your household's total annual drug costs?",
    fields: ["annualDrugCosts"],
  },
};

export const INCOME_STEP_IDS = Object.keys(INCOME_STEPS) as IncomeStepId[];

/**
 * Dollars as people type them: "18500", "18,500", "$18,500.50". Returns null for anything
 * else, including negative amounts.
 */
export function parseAmount(value: string | undefined): number | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/^\$/, "").replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Number(cleaned);
}

const amount =
  (message: string): Rule =>
  (v) =>
    parseAmount(typeof v === "string" ? v : undefined) === null ? message : null;

const AMOUNT_FORMAT = "Enter an amount in dollars, like 18,500 or 0";

/** The rules for one page. The partner's amount only counts when there is a partner. */
export function incomeSchema(step: IncomeStepId, hasPartner: boolean): Schema {
  switch (step) {
    case "net-income":
      return {
        yourNetIncome: all(required("Enter your net income, or 0"), amount(AMOUNT_FORMAT)),
        partnerNetIncome: when(
          () => hasPartner,
          all(required("Enter your spouse's or partner's net income, or 0"), amount(AMOUNT_FORMAT)),
        ),
      };
    case "support-payments":
      return {
        supportPayments: all(required("Enter the support payments received, or 0"), amount(AMOUNT_FORMAT)),
        taxableSupportPayments: all(
          required("Enter the taxable part of the support payments, or 0"),
          amount(AMOUNT_FORMAT),
          (v, values) => {
            const taxable = parseAmount(v as string);
            const total = parseAmount(values.supportPayments as string);
            return taxable !== null && total !== null && taxable > total
              ? "The taxable part can't be more than the total support payments"
              : null;
          },
        ),
      };
    case "drug-costs":
      return {
        annualDrugCosts: all(required("Enter your household's annual drug costs, or 0"), amount(AMOUNT_FORMAT)),
      };
  }
}

export const isIncomeStep = (value: string | undefined): value is IncomeStepId =>
  INCOME_STEP_IDS.includes(value as IncomeStepId);

export const nextStep = (from: IncomeStepId): IncomeStepId | null =>
  INCOME_STEP_IDS[INCOME_STEP_IDS.indexOf(from) + 1] ?? null;

export const previousStep = (from: IncomeStepId): IncomeStepId | null =>
  INCOME_STEP_IDS[INCOME_STEP_IDS.indexOf(from) - 1] ?? null;

export const isStepComplete = (id: IncomeStepId, answers: IncomeFields, hasPartner: boolean): boolean =>
  runSchema(incomeSchema(id, hasPartner), answers as Record<string, unknown>).length === 0;

export function firstIncompleteStep(answers: IncomeFields, hasPartner: boolean): IncomeStepId | null {
  return INCOME_STEP_IDS.find((id) => !isStepComplete(id, answers, hasPartner)) ?? null;
}

export const isIncomeComplete = (answers: IncomeFields, hasPartner: boolean): boolean =>
  firstIncompleteStep(answers, hasPartner) === null;

/** The amounts for the income formula, or null until every page is answered. */
export function incomeAnswersFrom(answers: IncomeFields, hasPartner: boolean): IncomeAnswers | null {
  if (!isIncomeComplete(answers, hasPartner)) return null;
  const money = (v: string | undefined) => parseAmount(v) ?? 0;
  return {
    yourNetIncome: money(answers.yourNetIncome),
    partnerNetIncome: hasPartner ? money(answers.partnerNetIncome) : 0,
    supportPayments: money(answers.supportPayments),
    taxableSupportPayments: money(answers.taxableSupportPayments),
    annualDrugCosts: money(answers.annualDrugCosts),
  };
}
