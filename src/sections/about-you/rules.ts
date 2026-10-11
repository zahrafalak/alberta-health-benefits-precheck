import type { AboutYouAnswers } from "../../lib/form-state";
import type { Household } from "../../lib/health-benefits";
import { all, pattern, required, runSchema, type Schema } from "../../lib/validation";

/**
 * Your household: who the income limit is for. Two pages, in order, no branching. Only
 * what the rules use is asked: whether there is a partner and how many children, never
 * names or dates of birth (privacy by design; see src/lib/health-benefits.ts).
 */

export type AboutYouStepId = "partner" | "children";

export type AboutYouField = keyof AboutYouAnswers;

export type AboutYouStepConfig = {
  heading: string;
  fields: AboutYouField[];
  /** Rules for those answers, in field order so the error summary reads top to bottom. */
  schema: Schema;
};

/** A whole number of children, as typed: up to two digits, no signs or decimals. */
const WHOLE_NUMBER = /^\d{1,2}$/;

export const ABOUT_YOU_STEPS: Record<AboutYouStepId, AboutYouStepConfig> = {
  partner: {
    heading: "Do you have a spouse or common-law partner?",
    fields: ["hasPartner"],
    schema: {
      hasPartner: required("Select yes if you have a spouse or common-law partner"),
    },
  },

  children: {
    heading: "How many children are in your household?",
    fields: ["children"],
    schema: {
      children: all(
        required("Enter the number of children, or 0 if there are none"),
        pattern(WHOLE_NUMBER, "Enter the number of children as a whole number, like 0, 1 or 2"),
      ),
    },
  },
};

export const ABOUT_YOU_STEP_IDS = Object.keys(ABOUT_YOU_STEPS) as AboutYouStepId[];

export const FIRST_ABOUT_YOU_STEP: AboutYouStepId = ABOUT_YOU_STEP_IDS[0];

export const isAboutYouStep = (value: string | undefined): value is AboutYouStepId =>
  ABOUT_YOU_STEP_IDS.includes(value as AboutYouStepId);

export const nextStep = (from: AboutYouStepId): AboutYouStepId | null =>
  ABOUT_YOU_STEP_IDS[ABOUT_YOU_STEP_IDS.indexOf(from) + 1] ?? null;

export const previousStep = (from: AboutYouStepId): AboutYouStepId | null =>
  ABOUT_YOU_STEP_IDS[ABOUT_YOU_STEP_IDS.indexOf(from) - 1] ?? null;

/**
 * A page is done when its own rules pass. One definition of finished, rather than a
 * second list of required answers that would drift from the rules.
 */
export const isStepComplete = (id: AboutYouStepId, answers: AboutYouAnswers): boolean =>
  runSchema(ABOUT_YOU_STEPS[id].schema, answers as Record<string, unknown>).length === 0;

/** The first page still needing work, or null when the section is finished. */
export function firstIncompleteStep(answers: AboutYouAnswers): AboutYouStepId | null {
  return ABOUT_YOU_STEP_IDS.find((id) => !isStepComplete(id, answers)) ?? null;
}

/** Every page's rules pass. */
export const isHouseholdComplete = (answers: AboutYouAnswers): boolean =>
  firstIncompleteStep(answers) === null;

/** The household the income limits use, or null until both questions are answered. */
export function householdFrom(answers: AboutYouAnswers): Household | null {
  if (!isHouseholdComplete(answers)) return null;
  return { hasPartner: answers.hasPartner === "yes", children: Number(answers.children) };
}
