// This section's answers shown back, on the review page and on its own check page. One
// card per question page, so a Change link lands on the page that asked; see docs/design-notes.md.
import { FormSummary, SummarySection, SummaryItem, answer, type SummaryProps } from "../../components/form-summary";
import { useForm } from "../../store/form-store";
import { withReturnTo } from "../../lib/return-to";
import { INCOME_STEPS, INCOME_STEP_IDS, parseAmount } from "./rules";

/** What each Change link changes, in its accessible name. */
const CHANGE_CONTEXT = {
  "net-income": "net income",
  "support-payments": "support payments",
  "drug-costs": "annual drug costs",
} as const;

/** "$18,500.00" for a valid amount; the text as typed otherwise. */
const dollars = (value: string | undefined) => {
  const n = parseAmount(value);
  return n === null ? value : n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
};

export function IncomeSummary({ returnTo }: SummaryProps) {
  const { state } = useForm();
  const a = state.income;
  const hasPartner = state.aboutYou.hasPartner === "yes";

  const rows = {
    "net-income": (
      <>
        <SummaryItem question="Your net income">{answer(dollars(a.yourNetIncome))}</SummaryItem>
        {hasPartner && (
          <SummaryItem question="Your spouse's or partner's net income">
            {answer(dollars(a.partnerNetIncome))}
          </SummaryItem>
        )}
      </>
    ),
    "support-payments": (
      <>
        <SummaryItem question="Total support payments received">{answer(dollars(a.supportPayments))}</SummaryItem>
        <SummaryItem question="Taxable part of those payments">{answer(dollars(a.taxableSupportPayments))}</SummaryItem>
      </>
    ),
    "drug-costs": <SummaryItem question="Annual drug costs">{answer(dollars(a.annualDrugCosts))}</SummaryItem>,
  };

  return (
    <FormSummary title="Your income">
      {INCOME_STEP_IDS.map((step) => (
        <SummarySection
          key={step}
          heading={INCOME_STEPS[step].heading}
          changeTo={withReturnTo(`/income/${step}`, returnTo)}
          changeContext={CHANGE_CONTEXT[step]}
        >
          {rows[step]}
        </SummarySection>
      ))}
    </FormSummary>
  );
}
