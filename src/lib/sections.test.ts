import { describe, it, expect } from "vitest";
import { EMPTY_FORM, type FormState } from "./form-state";
import { STEP_IDS as ELIGIBILITY_STEP_IDS } from "../sections/eligibility/rules";
import { ABOUT_YOU_STEP_IDS } from "../sections/about-you/rules";
import { INCOME_STEP_IDS } from "../sections/income/rules";
import {
  SECTIONS,
  sectionById,
  sectionStatus,
  canSubmit,
  completedCount,
  incompleteSections,
  isComplete,
  isConfirmed,
} from "./sections";

const passedScreener: FormState["eligibility"] = {
  residency: "yes",
  status: "yes",
  otherHealthBenefits: "no",
};

const completeAboutYou: FormState["aboutYou"] = {
  hasPartner: "yes",
  children: "2",
  adultConditions: ["none"],
};

const completeIncome: FormState["income"] = {
  yourNetIncome: "18,500",
  partnerNetIncome: "9,000",
  supportPayments: "0",
  taxableSupportPayments: "0",
  annualDrugCosts: "0",
};

const state = (over: Partial<FormState> = {}): FormState => ({ ...EMPTY_FORM, ...over });

const ALL_CONFIRMED: FormState["confirmed"] = [
  "eligibility",
  "about-you",
  "income",
];

describe("locking", () => {
  it("lets a person start the screener straight away", () => {
    expect(sectionStatus(sectionById("eligibility"), state())).toBe("not-started");
  });

  it("keeps the rest of the application shut until the screener passes", () => {
    const fresh = state();
    for (const id of ["about-you", "income"] as const) {
      expect(sectionStatus(sectionById(id), fresh)).toBe("cannot-start");
    }
  });

  it("opens the rest once the screener passes", () => {
    const passed = state({ eligibility: passedScreener });
    for (const id of ["about-you", "income"] as const) {
      expect(sectionStatus(sectionById(id), passed)).toBe("not-started");
    }
  });

  it("keeps the rest shut when the screener finished but failed", () => {
    const failed = state({ eligibility: { residency: "no" } });
    expect(sectionStatus(sectionById("about-you"), failed)).toBe("cannot-start");
  });

  // Locked has to win, whatever is stored against the section.
  it("reports locked even when the section already holds answers", () => {
    const odd = state({ eligibility: { residency: "no" }, aboutYou: completeAboutYou });
    expect(sectionStatus(sectionById("about-you"), odd)).toBe("cannot-start");
  });
});

describe("section progress", () => {
  it("moves the screener from not started to in progress to completed", () => {
    const section = sectionById("eligibility");
    expect(sectionStatus(section, state())).toBe("not-started");
    expect(sectionStatus(section, state({ eligibility: { residency: "yes" } }))).toBe(
      "in-progress",
    );
    expect(
      sectionStatus(
        section,
        state({ eligibility: passedScreener, confirmed: ["eligibility"] }),
      ),
    ).toBe("completed");
  });

  it("counts a failed screener as completed, because there is nothing left to do", () => {
    // The not-eligible page confirms the task on the way through.
    expect(
      sectionStatus(
        sectionById("eligibility"),
        state({ eligibility: { residency: "no" }, confirmed: ["eligibility"] }),
      ),
    ).toBe("completed");
  });

  it("holds Your household at in progress until every required answer is there", () => {
    const partial = state({
      eligibility: passedScreener,
      aboutYou: { hasPartner: "yes" },
    });
    expect(sectionStatus(sectionById("about-you"), partial)).toBe("in-progress");

    const complete = state({
      eligibility: passedScreener,
      aboutYou: completeAboutYou,
      confirmed: ["about-you"],
    });
    expect(sectionStatus(sectionById("about-you"), complete)).toBe("completed");
  });

  it("asks for the partner's income only when there is a partner", () => {
    const { partnerNetIncome: _omit, ...withoutPartner } = completeIncome;
    const single = state({
      eligibility: passedScreener,
      aboutYou: { hasPartner: "no", children: "1", adultConditions: ["none"] },
      income: withoutPartner,
      confirmed: ["income"],
    });
    expect(sectionStatus(sectionById("income"), single)).toBe("completed");

    const couple = state({ ...single, aboutYou: { hasPartner: "yes", children: "1", adultConditions: ["none"] } });
    expect(sectionStatus(sectionById("income"), couple)).toBe("in-progress");
  });
});

describe("confirming a task", () => {
  const answeredAboutYou = state({
    eligibility: passedScreener,
    aboutYou: completeAboutYou,
  });

  it("holds a fully answered task at in progress until it has been checked", () => {
    expect(sectionById("about-you").isAnswered(answeredAboutYou)).toBe(true);
    expect(sectionStatus(sectionById("about-you"), answeredAboutYou)).toBe("in-progress");
  });

  it("completes it once it has", () => {
    const checked = state({ ...answeredAboutYou, confirmed: ["about-you"] });
    expect(sectionStatus(sectionById("about-you"), checked)).toBe("completed");
  });

  it("is necessary and never sufficient", () => {
    // Confirming can only hold a task back, never carry one over the line.
    const half = state({
      eligibility: passedScreener,
      aboutYou: { hasPartner: "yes" },
      confirmed: ["about-you"],
    });
    expect(isConfirmed("about-you", half)).toBe(true);
    expect(sectionStatus(sectionById("about-you"), half)).toBe("in-progress");
  });

  it("survives a change that reopens a question, without re-confirming", () => {
    const finished = state({
      eligibility: passedScreener,
      aboutYou: { hasPartner: "no", children: "1", adultConditions: ["none"] },
      income: completeIncome,
      confirmed: ["income"],
    });
    expect(sectionStatus(sectionById("income"), finished)).toBe("completed");

    // Saying there is a partner opens their income question
    const reopened = state({ ...finished, aboutYou: { hasPartner: "yes", children: "1", adultConditions: ["none"] }, income: { ...completeIncome, partnerNetIncome: undefined } });
    expect(sectionStatus(sectionById("income"), reopened)).toBe("in-progress");

    const reanswered = state({ ...reopened, income: completeIncome });
    expect(sectionStatus(sectionById("income"), reanswered)).toBe("completed");
  });

  it("is the same rule the review page and the task list both read", () => {
    const checked = state({ ...answeredAboutYou, confirmed: ["about-you"] });
    expect(isComplete(sectionById("about-you"), checked)).toBe(true);
    expect(incompleteSections(checked).map((s) => s.id)).not.toContain("about-you");
    expect(incompleteSections(answeredAboutYou).map((s) => s.id)).toContain("about-you");
  });
});

describe("submitting", () => {
  const everything = state({
    eligibility: passedScreener,
    aboutYou: completeAboutYou,
    income: completeIncome,
    confirmed: ALL_CONFIRMED,
  });

  it("cannot submit an empty application", () => {
    expect(canSubmit(state())).toBe(false);
  });

  it("cannot submit with one section left", () => {
    const nearly = state({ ...everything, aboutYou: {} });
    expect(canSubmit(nearly)).toBe(false);
  });

  it("can submit once every section is complete", () => {
    expect(canSubmit(everything)).toBe(true);
  });

  it("cannot submit an application whose last task was never checked", () => {
    const unchecked = state({
      ...everything,
      confirmed: ["eligibility", "about-you"],
    });
    expect(sectionById("income").isAnswered(unchecked)).toBe(true);
    expect(canSubmit(unchecked)).toBe(false);
    expect(incompleteSections(unchecked).map((s) => s.id)).toEqual(["income"]);
  });

  it("counts completed sections for the progress line", () => {
    expect(completedCount(state())).toBe(0);
    expect(
      completedCount(state({ eligibility: passedScreener, confirmed: ["eligibility"] })),
    ).toBe(1);
    expect(completedCount(everything)).toBe(SECTIONS.length);
  });

  // By name, not count: a list of the right length naming the wrong sections is the
  // real failure.
  it("names every unfinished section, in task list order", () => {
    expect(incompleteSections(state()).map((s) => s.id)).toEqual([
      "eligibility",
      "about-you",
      "income",
    ]);
  });

  it("names only the section that is actually unfinished", () => {
    const nearly = state({ ...everything, aboutYou: {} });
    expect(incompleteSections(nearly).map((s) => s.id)).toEqual(["about-you"]);
  });

  it("has nothing outstanding once the application is complete", () => {
    expect(incompleteSections(everything)).toEqual([]);
  });
});

describe("the check route", () => {
  // React Router ranks the static /check segment above :step, so a question with the
  // id "check" would become unreachable silently.
  it("cannot be shadowed by a question with the same id", () => {
    expect(ELIGIBILITY_STEP_IDS).not.toContain("check");
    expect(ABOUT_YOU_STEP_IDS).not.toContain("check");
    expect(INCOME_STEP_IDS).not.toContain("check");
  });

  it("is expected by every task that has not opted out", () => {
    // A task with hasCheckPage true and no check route can never be completed.
    expect(SECTIONS.filter((s) => s.hasCheckPage).map((s) => s.id)).toEqual([
      "eligibility",
      "about-you",
      "income",
    ]);
  });
});

describe("the registry itself", () => {
  it("throws on an unknown section rather than returning undefined", () => {
    // @ts-expect-error deliberately passing an id that is not in the union
    expect(() => sectionById("nope")).toThrow();
  });
});
