import { useState, type ReactElement } from "react";
import { Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { GoabFormItem, GoabInput } from "@abgov/react-components";
import { PublicFormLayout } from "../../components/public-form-layout";
import { TaskReview } from "../../components/task-review";
import { IncomeSummary } from "./summary";
import { FormSet } from "../../components/form-set";
import { useFormValidation } from "../../components/use-form-validation";
import {
  INCOME_STEPS,
  INCOME_STEP_IDS,
  firstIncompleteStep,
  incomeSchema,
  nextStep,
  previousStep,
  type IncomeField,
  type IncomeStepId,
} from "./rules";
import type { IncomeAnswers } from "../../lib/form-state";
import { RETURN_LABELS, readReturnTo, withReturnTo, type ReturnTo } from "../../lib/return-to";
import { useForm } from "../../store/form-store";

/**
 * Your income: three pages of amounts, each field with help on where the number is
 * found on a tax return. Same shape as src/sections/about-you/pages.tsx.
 *
 * Help text sources: the line numbers and wording come from the "How to calculate your
 * income" steps on both program pages (src/lib/health-benefits.ts). Line 23600 on the
 * Notice of Assessment: canada.ca, Canada Disability Benefit, "Apply".
 */

const SECTION_ROOT = "/income";

export const INCOME_CHECK_PATH = `${SECTION_ROOT}/check`;

const RETURN_PATHS = {
  review: "/review",
  task: INCOME_CHECK_PATH,
} as const;

const SUPPORTED = ["review", "task"] as const;

const stepPath = (step: IncomeStepId, returnTo: ReturnTo | null) =>
  withReturnTo(`${SECTION_ROOT}/${step}`, returnTo);

/** A draft seeded from the store, saved only on a valid submit. */
function useStep(step: IncomeStepId) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, dispatch } = useForm();
  const config = INCOME_STEPS[step];
  const hasPartner = state.aboutYou.hasPartner === "yes";
  const returnTo = readReturnTo(params, SUPPORTED);

  const [draft, setDraft] = useState<IncomeAnswers>(
    () =>
      Object.fromEntries(
        config.fields.map((field) => [field, state.income[field] ?? ""]),
      ) as IncomeAnswers,
  );

  const { errors, submit, revalidate } = useFormValidation(incomeSchema(step, hasPartner));

  const set = (field: IncomeField) => (value: string) =>
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      revalidate(next as Record<string, unknown>);
      return next;
    });

  const errorFor = (field: IncomeField) => errors.find((e) => e.fieldId === field)?.text;

  const handleContinue = () =>
    submit(draft as Record<string, unknown>, () => {
      dispatch({ type: "save-income", answers: draft });
      if (returnTo) {
        navigate(RETURN_PATHS[returnTo]);
        return;
      }
      const next = nextStep(step);
      navigate(next ? stepPath(next, null) : INCOME_CHECK_PATH);
    });

  const previous = previousStep(step);

  return {
    heading: config.heading,
    hasPartner,
    draft,
    set,
    errors,
    errorFor,
    handleContinue,
    back: returnTo ? RETURN_PATHS[returnTo] : previous ? stepPath(previous, null) : "/",
    backLabel: returnTo ? RETURN_LABELS[returnTo] : "Back",
    continueLabel: returnTo ? "Save and return" : "Save and continue",
  };
}

type AmountProps = {
  field: IncomeField;
  label: string;
  helpText: string;
  draft: IncomeAnswers;
  set: (field: IncomeField) => (value: string) => void;
  errorFor: (field: IncomeField) => string | undefined;
  mt?: "l";
};

/** A dollar amount: typed as text, so "18,500" and "$18,500" both work. */
function AmountField({ field, label, helpText, draft, set, errorFor, mt }: AmountProps) {
  return (
    <GoabFormItem label={label} id={field} helpText={helpText} error={errorFor(field)} mt={mt}>
      <GoabInput
        name={field}
        ariaLabel={label}
        width="200px"
        value={draft[field] ?? ""}
        error={Boolean(errorFor(field))}
        onChange={(detail) => set(field)(String(detail.value))}
      />
    </GoabFormItem>
  );
}

function NetIncomePage() {
  const { heading, hasPartner, draft, set, errors, errorFor, handleContinue, back, backLabel, continueLabel } =
    useStep("net-income");

  return (
    <PublicFormLayout back={back} backLabel={backLabel}>
      <FormSet heading={heading} continueLabel={continueLabel} onContinue={handleContinue} errors={errors}>
        <AmountField
          field="yourNetIncome"
          label="Your net income"
          helpText="Line 23600 of your 2025 income tax return. It's also on the Notice of Assessment from the Canada Revenue Agency. Enter 0 if you had no income."
          {...{ draft, set, errorFor }}
        />
        {hasPartner && (
          <AmountField
            field="partnerNetIncome"
            label="Your spouse's or partner's net income"
            helpText="Line 23600 of their 2025 income tax return. Enter 0 if they had no income."
            mt="l"
            {...{ draft, set, errorFor }}
          />
        )}
      </FormSet>
    </PublicFormLayout>
  );
}

function SupportPaymentsPage() {
  const { heading, draft, set, errors, errorFor, handleContinue, back, backLabel, continueLabel } =
    useStep("support-payments");

  return (
    <PublicFormLayout back={back} backLabel={backLabel}>
      <FormSet heading={heading} continueLabel={continueLabel} onContinue={handleContinue} errors={errors}>
        <AmountField
          field="supportPayments"
          label="Total support payments received"
          helpText="Line 12799 of your 2025 return, added to your partner's if you have one. Enter 0 if none."
          {...{ draft, set, errorFor }}
        />
        <AmountField
          field="taxableSupportPayments"
          label="Taxable part of those payments"
          helpText="Line 12800 of your 2025 return, added to your partner's if you have one. Enter 0 if none."
          mt="l"
          {...{ draft, set, errorFor }}
        />
      </FormSet>
    </PublicFormLayout>
  );
}

function DrugCostsPage() {
  const { heading, draft, set, errors, errorFor, handleContinue, back, backLabel, continueLabel } =
    useStep("drug-costs");

  return (
    <PublicFormLayout back={back} backLabel={backLabel}>
      {/* One question: it is the h1, so the field's label repeats it only for screen readers. */}
      <FormSet heading={heading} continueLabel={continueLabel} onContinue={handleContinue} errors={errors}>
        <AmountField
          field="annualDrugCosts"
          label="Annual drug costs"
          helpText="Your household's total annual drug costs. Enter 0 if none."
          {...{ draft, set, errorFor }}
        />
      </FormSet>
    </PublicFormLayout>
  );
}

function CheckPage() {
  return (
    <TaskReview section="income">
      <IncomeSummary returnTo="task" />
    </TaskReview>
  );
}

function SectionEntry() {
  const { state } = useForm();
  const next = firstIncompleteStep(state.income, state.aboutYou.hasPartner === "yes");
  return <Navigate to={next ? stepPath(next, null) : INCOME_CHECK_PATH} replace />;
}

/** Typed over every step id, so adding a step fails the build until it has a page. */
const PAGES: Record<IncomeStepId, () => ReactElement> = {
  "net-income": NetIncomePage,
  "support-payments": SupportPaymentsPage,
  "drug-costs": DrugCostsPage,
};

export function IncomeSection() {
  return (
    <Routes>
      <Route index element={<SectionEntry />} />
      <Route path="check" element={<CheckPage />} />
      {INCOME_STEP_IDS.map((id) => {
        const Page = PAGES[id];
        return <Route key={id} path={id} element={<Page />} />;
      })}
      <Route path="*" element={<Navigate to={SECTION_ROOT} replace />} />
    </Routes>
  );
}
