import { describe, it, expect } from "vitest";
import {
  resolveNext,
  reachable,
  pruneUnreachable,
  remainingQuestions,
  screenerOutcome,
  firstUnansweredStep,
} from "./rules";
import type { EligibilityAnswers } from "../../lib/form-state";

const passed: EligibilityAnswers = {
  residency: "yes",
  status: "yes",
  otherHealthBenefits: "no",
};

describe("walking forward", () => {
  it("goes to the next question when the gate is passed", () => {
    expect(resolveNext("residency", { residency: "yes" })).toEqual({ question: "status" });
  });

  it("ends the screener when someone doesn't live in Alberta", () => {
    expect(resolveNext("residency", { residency: "no" })).toEqual({ outcome: "ineligible" });
  });

  it("ends the screener when someone isn't a citizen or permanent resident", () => {
    expect(resolveNext("status", { residency: "yes", status: "no" })).toEqual({
      outcome: "ineligible",
    });
  });

  it("goes to review when nobody gets health benefits from the other programs", () => {
    expect(resolveNext("otherHealthBenefits", passed)).toEqual({ outcome: "review" });
  });
});

describe("changing an answer from the review page", () => {
  it("goes straight back to review when the change opens nothing new", () => {
    expect(resolveNext("residency", passed)).toEqual({ outcome: "review" });
  });

  it("routes to a different outcome when a change flips a gate", () => {
    expect(resolveNext("status", { ...passed, status: "no" })).toEqual({ outcome: "ineligible" });
  });

  it("counts the questions still to answer", () => {
    expect(remainingQuestions("status", { residency: "yes", status: "yes" })).toBe(1);
    expect(remainingQuestions("residency", passed)).toBe(0);
  });
});

describe("reachable", () => {
  it("includes every step on a passed path", () => {
    expect([...reachable(passed)]).toEqual(["residency", "status", "otherHealthBenefits"]);
  });

  it("stops at the first unanswered question", () => {
    expect([...reachable({ residency: "yes" })]).toEqual(["residency", "status"]);
  });

  it("stops at a failed gate, so later steps are never reachable", () => {
    expect([...reachable({ residency: "no", status: "yes" })]).toEqual(["residency"]);
  });
});

describe("pruneUnreachable", () => {
  it("discards answers after an early gate flips to no", () => {
    expect(pruneUnreachable({ ...passed, residency: "no" })).toEqual({ residency: "no" });
  });

  it("keeps every answer on a passed path", () => {
    expect(pruneUnreachable(passed)).toEqual(passed);
  });
});

describe("screenerOutcome", () => {
  it("is null when nothing has been answered", () => {
    expect(screenerOutcome({})).toBeNull();
  });

  it("is null while the screener is unfinished", () => {
    expect(screenerOutcome({ residency: "yes", status: "yes" })).toBeNull();
  });

  it("is ineligible when someone in the household gets AISH health benefits", () => {
    expect(screenerOutcome({ residency: "yes", status: "yes", otherHealthBenefits: "yes" })).toBe("ineligible");
  });

  // Passing the screener isn't qualifying: income is still to be checked
  it("goes on to the questions when every gate is passed", () => {
    expect(screenerOutcome({ residency: "yes", status: "yes", otherHealthBenefits: "no" })).toBe("review");
  });
});

describe("where someone re-entering the screener lands", () => {
  it("starts at the beginning when nothing has been answered", () => {
    expect(firstUnansweredStep({})).toBe("residency");
  });

  it("stops at the first question still unanswered", () => {
    expect(firstUnansweredStep({ residency: "yes" })).toBe("status");
    expect(firstUnansweredStep({ residency: "yes", status: "yes" })).toBe("otherHealthBenefits");
  });

  it("is finished when every question is answered", () => {
    expect(firstUnansweredStep(passed)).toBeNull();
  });

  it("is finished when a gate failed, because there is nothing further to ask", () => {
    expect(firstUnansweredStep({ residency: "no" })).toBeNull();
  });
});
