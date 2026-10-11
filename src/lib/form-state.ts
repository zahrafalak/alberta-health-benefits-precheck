/**
 * The shape of a part-finished application, and the only ways it can change. Typed
 * per section rather than a bag of strings: the shape is the clearest description of
 * what the service asks, and the first thing a fork edits.
 */

export type YesNo = "yes" | "no";

export type SectionId = "eligibility" | "about-you" | "income";

/** Screener answers. See src/sections/eligibility/rules.ts for how they branch. */
export type EligibilityAnswers = {
  residency?: YesNo;
  status?: YesNo;
  otherHealthBenefits?: YesNo;
};

/** Your household. See src/sections/about-you/rules.ts. */
export type AboutYouAnswers = {
  hasPartner?: YesNo;
  /** Number of children, as typed; validated as a whole number before it is saved. */
  children?: string;
};

/** Your income, as typed. See src/sections/income/rules.ts for how it is parsed. */
export type IncomeAnswers = {
  /** Line 23600 on your 2025 return. */
  yourNetIncome?: string;
  /** Line 23600 on your spouse's or partner's 2025 return. */
  partnerNetIncome?: string;
  /** Line 12799: support payments received. */
  supportPayments?: string;
  /** Line 12800: the taxable part of those payments. */
  taxableSupportPayments?: string;
  annualDrugCosts?: string;
};

export type FormState = {
  eligibility: EligibilityAnswers;
  aboutYou: AboutYouAnswers;
  income: IncomeAnswers;
  /**
   * ISO timestamp, set on submit. Non-null means no longer editable, enforced by the
   * guard in src/routes/guards.tsx that sends a submitted application to its confirmation.
   */
  submittedAt: string | null;
  /**
   * Tasks whose check-answers page the person has passed through. Necessary, never
   * sufficient: nothing removes an id, because a change that reopens a question makes
   * the answers incomplete on their own and the task drops back to In progress.
   */
  confirmed: SectionId[];
  /**
   * The receipt, set with submittedAt and saved with the draft: refreshing the
   * confirmation page is the likeliest next thing, and losing the reference then is
   * unforgivable.
   */
  reference: string | null;
};

export const EMPTY_FORM: FormState = {
  eligibility: {},
  aboutYou: {},
  income: {},
  submittedAt: null,
  confirmed: [],
  reference: null,
};

export type FormAction =
  | { type: "save-eligibility"; answers: EligibilityAnswers }
  | { type: "save-about-you"; answers: AboutYouAnswers }
  | { type: "save-income"; answers: IncomeAnswers }
  | { type: "confirm-section"; id: SectionId }
  | { type: "submit"; at: string; reference: string }
  | { type: "hydrate"; state: FormState }
  | { type: "reset" };

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "save-eligibility":
      // Replaces rather than merges: pruning unreachable answers is the screener's job
      // (src/sections/eligibility/rules.ts), and a merge would quietly resurrect them.
      return { ...state, eligibility: action.answers };

    case "save-about-you":
      return { ...state, aboutYou: { ...state.aboutYou, ...action.answers } };

    case "save-income":
      return { ...state, income: { ...state.income, ...action.answers } };

    case "confirm-section":
      return state.confirmed.includes(action.id)
        ? state
        : { ...state, confirmed: [...state.confirmed, action.id] };

    case "submit":
      return { ...state, submittedAt: action.at, reference: action.reference };

    case "hydrate":
      return action.state;

    case "reset":
      return EMPTY_FORM;
  }
}
