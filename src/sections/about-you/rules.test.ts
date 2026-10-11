import { describe, it, expect } from "vitest";
import { runSchema } from "../../lib/validation";
import type { AboutYouAnswers } from "../../lib/form-state";
import {
  adultConditionsFrom,
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

const COMPLETE: AboutYouAnswers = { hasPartner: "no", children: "2", adultConditions: ["none"] };

const errorsFor = (step: AboutYouStepId, answers: AboutYouAnswers) =>
  runSchema(ABOUT_YOU_STEPS[step].schema, answers as Record<string, unknown>).map((e) => e.text);

describe("the household pages", () => {
  it("asks about a partner, then children, then the Adult benefit's conditions", () => {
    expect(ABOUT_YOU_STEP_IDS).toEqual(["partner", "children", "adult-conditions"]);
    expect(FIRST_ABOUT_YOU_STEP).toBe("partner");
    expect(nextStep("partner")).toBe("children");
    expect(nextStep("adult-conditions")).toBeNull();
    expect(previousStep("children")).toBe("partner");
  });

  it("recognises its own step ids only", () => {
    expect(isAboutYouStep("children")).toBe(true);
    expect(isAboutYouStep("address")).toBe(false);
  });

  it("collects no names or dates of birth", () => {
    const fields = ABOUT_YOU_STEP_IDS.flatMap((id) => ABOUT_YOU_STEPS[id].fields);
    expect(fields).toEqual(["hasPartner", "children", "adultConditions"]);
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

describe("the Adult Health Benefit's conditions", () => {
  it("needs at least one box ticked", () => {
    expect(errorsFor("adult-conditions", { adultConditions: [] })).toEqual(["Select all that apply, or None of these"]);
  });

  it("doesn't allow None of these together with a condition", () => {
    expect(errorsFor("adult-conditions", { adultConditions: ["pregnant", "none"] })).toEqual([
      "Select the conditions that apply, or None of these, not both",
    ]);
  });

  it("lists the conditions that apply, leaving out None of these", () => {
    expect(adultConditionsFrom({ adultConditions: ["pregnant", "drug-needs"] })).toEqual(["pregnant", "drug-needs"]);
    expect(adultConditionsFrom({ adultConditions: ["none"] })).toEqual([]);
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

  it("is finished when every page is answered", () => {
    expect(firstIncompleteStep(COMPLETE)).toBeNull();
  });
});

describe("householdFrom", () => {
  it("is null until every question is answered", () => {
    expect(householdFrom({ hasPartner: "yes" })).toBeNull();
  });

  it("turns the answers into the household the income limits use", () => {
    expect(householdFrom({ hasPartner: "yes", children: "3", adultConditions: ["none"] })).toEqual({ hasPartner: true, children: 3 });
    expect(householdFrom({ hasPartner: "no", children: "0", adultConditions: ["pregnant"] })).toEqual({ hasPartner: false, children: 0 });
  });
});
