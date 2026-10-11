// This section's answers shown back, on the review page and on its own check page. One
// card per question page, so a Change link lands on the page that asked; see docs/design-notes.md.
import {
  FormSummary,
  SummarySection,
  SummaryItem,
  answer,
  type SummaryProps,
} from "../../components/form-summary";
import { useForm } from "../../store/form-store";
import { withReturnTo } from "../../lib/return-to";
import { formatYesNo } from "../../lib/format";
import { ABOUT_YOU_STEPS, ABOUT_YOU_STEP_IDS, adultConditionsFrom } from "./rules";
import { ADULT_CONDITIONS } from "../../lib/health-benefits";

/** What each Change link changes, in its accessible name: destinations rather than page headings. */
const CHANGE_CONTEXT = {
  partner: "whether you have a partner",
  children: "the number of children",
  "adult-conditions": "which situations apply to you",
} as const;

export function AboutYouSummary({ returnTo }: SummaryProps) {
  const { state } = useForm();
  const a = state.aboutYou;

  const values = {
    partner: answer(formatYesNo(a.hasPartner)),
    children: answer(a.children),
    "adult-conditions": !a.adultConditions?.length
      ? answer(undefined)
      : a.adultConditions.includes("none")
        ? "None of these"
        : adultConditionsFrom(a).map((c) => <div key={c}>{ADULT_CONDITIONS[c]}</div>),
  };

  return (
    <FormSummary title="Your household">
      {ABOUT_YOU_STEP_IDS.map((step) => (
        <SummarySection
          key={step}
          changeTo={withReturnTo(`/about-you/${step}`, returnTo)}
          changeContext={CHANGE_CONTEXT[step]}
        >
          <SummaryItem question={ABOUT_YOU_STEPS[step].heading}>{values[step]}</SummaryItem>
        </SummarySection>
      ))}
    </FormSummary>
  );
}
