import { describe, it, expect } from "vitest";
import { runSchema } from "../../lib/validation";
import { familyIncome } from "../../lib/health-benefits";
import type { IncomeAnswers } from "../../lib/form-state";
import {
  INCOME_STEP_IDS,
  firstIncompleteStep,
  incomeAnswersFrom,
  incomeSchema,
  parseAmount,
  type IncomeStepId,
} from "./rules";

const errorsFor = (step: IncomeStepId, answers: IncomeAnswers, hasPartner = false) =>
  runSchema(incomeSchema(step, hasPartner), answers as Record<string, unknown>).map((e) => e.text);

const SINGLE: IncomeAnswers = {
  yourNetIncome: "21,000",
  supportPayments: "3,000",
  taxableSupportPayments: "1,000",
  annualDrugCosts: "500",
};

describe("parseAmount", () => {
  it("reads a plain number", () => {
    expect(parseAmount("18500")).toBe(18_500);
  });

  it("reads an amount with a dollar sign and a comma", () => {
    expect(parseAmount("$18,500")).toBe(18_500);
  });

  it("accepts cents", () => {
    expect(parseAmount("75.50")).toBe(75.5);
  });

  it.each(["", "abc", "-200", "18 500 dollars", "1.234"])("rejects %p", (value) => {
    expect(parseAmount(value)).toBeNull();
  });
});

describe("the income pages", () => {
  it("asks for net income, then support payments, then drug costs", () => {
    expect(INCOME_STEP_IDS).toEqual(["net-income", "support-payments", "drug-costs"]);
  });

  it("needs your net income, and accepts 0", () => {
    expect(errorsFor("net-income", {})).toEqual(["Enter your net income, or 0"]);
    expect(errorsFor("net-income", { yourNetIncome: "0" })).toEqual([]);
  });

  it("asks for a partner's net income only when there is a partner", () => {
    expect(errorsFor("net-income", { yourNetIncome: "20000" }, false)).toEqual([]);
    expect(errorsFor("net-income", { yourNetIncome: "20000" }, true)).toEqual([
      "Enter your spouse's or partner's net income, or 0",
    ]);
  });

  it("explains the format when an amount isn't a number", () => {
    expect(errorsFor("drug-costs", { annualDrugCosts: "a lot" })).toEqual([
      "Enter an amount in dollars, like 18,500 or 0",
    ]);
  });

  it("doesn't allow the taxable part to be more than the total support", () => {
    expect(errorsFor("support-payments", { supportPayments: "1000", taxableSupportPayments: "1500" })).toEqual([
      "The taxable part can't be more than the total support payments",
    ]);
  });
});

describe("progress", () => {
  it("moves through the pages in order", () => {
    expect(firstIncompleteStep({}, false)).toBe("net-income");
    expect(firstIncompleteStep({ yourNetIncome: "0" }, false)).toBe("support-payments");
    expect(firstIncompleteStep(SINGLE, false)).toBeNull();
  });

  it("sends someone back to net income when they now have a partner", () => {
    expect(firstIncompleteStep(SINGLE, true)).toBe("net-income");
  });
});

describe("incomeAnswersFrom", () => {
  it("is null until every page is answered", () => {
    expect(incomeAnswersFrom({ yourNetIncome: "21000" }, false)).toBeNull();
  });

  it("turns typed amounts into the numbers the formula uses", () => {
    expect(incomeAnswersFrom(SINGLE, false)).toEqual({
      yourNetIncome: 21_000,
      partnerNetIncome: 0,
      supportPayments: 3_000,
      taxableSupportPayments: 1_000,
      annualDrugCosts: 500,
    });
  });

  it("ignores a leftover partner amount when there's no partner", () => {
    const answers = incomeAnswersFrom({ ...SINGLE, partnerNetIncome: "40,000" }, false);
    expect(answers?.partnerNetIncome).toBe(0);
  });

  it("feeds the published formula: 21,000 + (3,000 − 1,000) − 500 = 22,500", () => {
    const answers = incomeAnswersFrom(SINGLE, false);
    expect(answers && familyIncome(answers)).toBe(22_500);
  });
});
