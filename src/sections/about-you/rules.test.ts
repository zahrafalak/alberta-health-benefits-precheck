import { describe, it, expect } from "vitest";
import { runSchema } from "../../lib/validation";
import type { AboutYouAnswers } from "../../lib/form-state";
import {
  ABOUT_YOU_STEPS,
  ABOUT_YOU_STEP_IDS,
  FIRST_ABOUT_YOU_STEP,
  firstIncompleteStep,
  householdFrom,
  isAboutYouStep,
  isStepComplete,
  nextStep,
  previousStep,
  type AboutYouStepId,
} from "./rules";

const COMPLETE: AboutYouAnswers = { hasPartner: "no", children: "2" };

const errorsFor = (step: AboutYouStepId, answers: AboutYouAnswers) =>
  runSchema(ABOUT_YOU_STEPS[step].schema, answers as Record<string, unknown>).map((e) => e.text);

describe("the household pages", () => {
  it("asks about a partner first, then children", () => {
    expect(ABOUT_YOU_STEP_IDS).toEqual(["partner", "children"]);
    expect(FIRST_ABOUT_YOU_STEP).toBe("partner");
    expect(nextStep("partner")).toBe("children");
    expect(nextStep("children")).toBeNull();
    expect(previousStep("children")).toBe("partner");
  });

  it("recognises its own step ids only", () => {
    expect(isAboutYouStep("children")).toBe(true);
    expect(isAboutYouStep("address")).toBe(false);
  });

  it("collects no names or dates of birth", () => {
    const fields = ABOUT_YOU_STEP_IDS.flatMap((id) => ABOUT_YOU_STEPS[id].fields);
    expect(fields).toEqual(["hasPartner", "children"]);
  });
});

describe("validation", () => {
  it("needs an answer about a partner", () => {
    expect(errorsFor("partner", {})).toEqual(["Select yes if you have a spouse or common-law partner"]);
  });

  it("needs a number of children, and accepts 0", () => {
    expect(errorsFor("children", {})).toEqual(["Enter the number of children, or 0 if there are none"]);
    expect(errorsFor("children", { children: "0" })).toEqual([]);
  });

  it.each(["two", "-1", "1.5", "2 kids", "100"])("rejects %p as a number of children", (children) => {
    expect(errorsFor("children", { children })).toEqual([
      "Enter the number of children as a whole number, like 0, 1 or 2",
    ]);
  });
});

describe("progress", () => {
  it("starts at the partner question", () => {
    expect(firstIncompleteStep({})).toBe("partner");
  });

  it("moves on to children once the partner question is answered", () => {
    expect(isStepComplete("partner", { hasPartner: "yes" })).toBe(true);
    expect(firstIncompleteStep({ hasPartner: "yes" })).toBe("children");
  });

  it("is finished when both are answered", () => {
    expect(firstIncompleteStep(COMPLETE)).toBeNull();
  });
});

describe("householdFrom", () => {
  it("is null until both questions are answered", () => {
    expect(householdFrom({ hasPartner: "yes" })).toBeNull();
  });

  it("turns the answers into the household the income limits use", () => {
    expect(householdFrom({ hasPartner: "yes", children: "3" })).toEqual({ hasPartner: true, children: 3 });
    expect(householdFrom({ hasPartner: "no", children: "0" })).toEqual({ hasPartner: false, children: 0 });
  });
});
