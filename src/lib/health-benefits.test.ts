import { describe, it, expect } from "vitest";
import {
  incomeLimit,
  familyIncome,
  isWithinLimit,
  SOURCES,
  CHECKED_ON,
  PER_ADDITIONAL_CHILD,
  type IncomeAnswers,
} from "./health-benefits";

const noIncome: IncomeAnswers = {
  yourNetIncome: 0,
  partnerNetIncome: 0,
  supportPayments: 0,
  taxableSupportPayments: 0,
  annualDrugCosts: 0,
};

describe("incomeLimit", () => {
  // Every row of the "Income guidelines" tables on alberta.ca, checked on CHECKED_ON
  it.each([
    [false, 0, 16_580],
    [false, 1, 26_023],
    [false, 2, 31_010],
    [false, 3, 36_325],
    [false, 4, 41_957],
    [true, 0, 23_212],
    [true, 1, 31_237],
    [true, 2, 36_634],
    [true, 3, 41_594],
    [true, 4, 46_932],
  ])("adult benefit, partner %s, %i children: $%i", (hasPartner, children, expected) => {
    expect(incomeLimit("adult", { hasPartner, children })).toBe(expected);
  });

  it("uses the same limits for the child benefit when there are children", () => {
    expect(incomeLimit("child", { hasPartner: false, children: 2 })).toBe(31_010);
    expect(incomeLimit("child", { hasPartner: true, children: 4 })).toBe(46_932);
  });

  it("doesn't apply the child benefit to a household without children", () => {
    expect(incomeLimit("child", { hasPartner: true, children: 0 })).toBeNull();
  });

  it("adds the published amount for each child beyond four", () => {
    expect(PER_ADDITIONAL_CHILD).toBe(4_973);
    expect(incomeLimit("child", { hasPartner: false, children: 5 })).toBe(41_957 + 4_973);
    expect(incomeLimit("adult", { hasPartner: true, children: 7 })).toBe(46_932 + 3 * 4_973);
  });

  it("rejects a number of children that isn't a whole number of 0 or more", () => {
    expect(() => incomeLimit("adult", { hasPartner: false, children: -1 })).toThrow(RangeError);
    expect(() => incomeLimit("adult", { hasPartner: false, children: 1.5 })).toThrow(RangeError);
  });
});

describe("familyIncome", () => {
  it("adds both partners' net income (Line 23600)", () => {
    expect(familyIncome({ ...noIncome, yourNetIncome: 18_000, partnerNetIncome: 9_500 })).toBe(27_500);
  });

  it("adds only the non-taxable part of support payments (Line 12799 minus Line 12800)", () => {
    const answers = { ...noIncome, yourNetIncome: 20_000, supportPayments: 6_000, taxableSupportPayments: 4_000 };
    expect(familyIncome(answers)).toBe(22_000);
  });

  it("subtracts annual drug costs", () => {
    expect(familyIncome({ ...noIncome, yourNetIncome: 30_000, annualDrugCosts: 2_500 })).toBe(27_500);
  });

  it("never goes below zero", () => {
    expect(familyIncome({ ...noIncome, yourNetIncome: 1_000, annualDrugCosts: 5_000 })).toBe(0);
  });
});

describe("isWithinLimit", () => {
  // The pages give a "maximum income": someone exactly at the limit is within it
  it("is within the limit at exactly the limit", () => {
    expect(isWithinLimit(26_023, 26_023)).toBe(true);
  });

  it("is within the limit at $1 below the limit", () => {
    expect(isWithinLimit(26_022, 26_023)).toBe(true);
  });

  it("is not within the limit at $1 above the limit", () => {
    expect(isWithinLimit(26_024, 26_023)).toBe(false);
  });
});

describe("sources", () => {
  it("names an alberta.ca page and the date checked for each program", () => {
    for (const source of Object.values(SOURCES)) {
      expect(source.url).toMatch(/^https:\/\/www\.alberta\.ca\//);
      expect(source.checkedOn).toBe(CHECKED_ON);
    }
  });
});
