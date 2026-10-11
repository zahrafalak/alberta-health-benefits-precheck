import { describe, it, expect } from "vitest";
import { EMPTY_FORM, formReducer, type FormState } from "./form-state";

describe("submitting", () => {
  // A submitted application with no reference locks every page and shows nothing to
  // write down.
  it("records the time and the reference together", () => {
    const after = formReducer(EMPTY_FORM, {
      type: "submit",
      at: "2026-08-14T10:00:00.000Z",
      reference: "FSA-4KMQ-7XTC",
    });

    expect(after.submittedAt).toBe("2026-08-14T10:00:00.000Z");
    expect(after.reference).toBe("FSA-4KMQ-7XTC");
  });

  // Keeping the reference would leave every editable page redirecting to a
  // confirmation for an application that no longer exists.
  it("clears the submission when starting a new application", () => {
    const submitted = formReducer(EMPTY_FORM, {
      type: "submit",
      at: "2026-08-14T10:00:00.000Z",
      reference: "FSA-4KMQ-7XTC",
    });

    const after = formReducer(submitted, { type: "reset" });

    expect(after.submittedAt).toBeNull();
    expect(after.reference).toBeNull();
  });
});

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

