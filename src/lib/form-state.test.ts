import { describe, it, expect } from "vitest";
import { EMPTY_FORM, formReducer, type FormState } from "./form-state";

describe("saving a branching section", () => {
  it("merges income answers page by page, keeping earlier pages", () => {
    const before: FormState = { ...EMPTY_FORM, income: { yourNetIncome: "18500" } };

    const after = formReducer(before, {
      type: "save-income",
      answers: { supportPayments: "0", taxableSupportPayments: "0" },
    });

    expect(after.income).toEqual({ yourNetIncome: "18500", supportPayments: "0", taxableSupportPayments: "0" });
  });

  it("replaces the screener answers, so pruned answers don't come back", () => {
    const before: FormState = {
      ...EMPTY_FORM,
      eligibility: {
        residency: "yes",
        status: "yes",
        otherHealthBenefits: "yes",
      },
    };

    const after = formReducer(before, {
      type: "save-eligibility",
      answers: { residency: "yes", status: "no" },
    });

    expect(after.eligibility.otherHealthBenefits).toBeUndefined();
  });

});

