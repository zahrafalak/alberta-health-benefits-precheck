import { useState, type ReactElement } from "react";
import { Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import {
  GoabCheckbox,
  GoabCheckboxList,
  GoabFormItem,
  GoabInput,
  GoabRadioGroup,
  GoabRadioItem,
} from "@abgov/react-components";
import { ADULT_CONDITIONS } from "../../lib/health-benefits";
import { PublicFormLayout } from "../../components/public-form-layout";
import { TaskReview } from "../../components/task-review";
import { AboutYouSummary } from "./summary";
import { FormSet } from "../../components/form-set";
import { useFormValidation } from "../../components/use-form-validation";
import {
  ABOUT_YOU_STEPS,
  ABOUT_YOU_STEP_IDS,
  ADULT_CONDITION_IDS,
  firstIncompleteStep,
  nextStep,
  previousStep,
  type AboutYouField,
  type AboutYouStepId,
} from "./rules";
import type { AboutYouAnswers } from "../../lib/form-state";
import {
  RETURN_LABELS,
  readReturnTo,
  withReturnTo,
  type ReturnTo,
} from "../../lib/return-to";
import { useForm } from "../../store/form-store";

/**
 * Your household: a partner, how many children, and the Adult Health Benefit's
 * conditions. Hand-written pages rather than one driven from config: different controls.
 */

const SECTION_ROOT = "/about-you";

export const ABOUT_YOU_CHECK_PATH = `${SECTION_ROOT}/check`;

const RETURN_PATHS = {
  review: "/review",
  task: ABOUT_YOU_CHECK_PATH,
} as const;

const SUPPORTED = ["review", "task"] as const;

const stepPath = (step: AboutYouStepId, returnTo: ReturnTo | null) =>
  withReturnTo(`${SECTION_ROOT}/${step}`, returnTo);

/**
 * A draft seeded from the store, validated on submit. Answers reach the store only on a
 * valid submit, so a half-typed answer abandoned with Back is not saved as an answer.
 */
function useStep(step: AboutYouStepId) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, dispatch } = useForm();
  const config = ABOUT_YOU_STEPS[step];

  const returnTo = readReturnTo(params, SUPPORTED);

  const [draft, setDraft] = useState<AboutYouAnswers>(
    () =>
      Object.fromEntries(
        config.fields.map((field) => [field, state.aboutYou[field] ?? ""]),
      ) as AboutYouAnswers,
  );

  const { errors, submit, revalidate } = useFormValidation(config.schema);

  const set = (field: AboutYouField) => (value: string | string[]) =>
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      revalidate(next as Record<string, unknown>);
      return next;
    });

  const errorFor = (field: AboutYouField) =>
    errors.find((e) => e.fieldId === field)?.text;

  const handleContinue = () =>
    submit(draft as Record<string, unknown>, () => {
      dispatch({ type: "save-about-you", answers: draft });

      // Nothing here branches, so a change from a check page goes straight back.
      if (returnTo) {
        navigate(RETURN_PATHS[returnTo]);
        return;
      }

      // The last question leads to the task's check page, not the task list.
      const next = nextStep(step);
      navigate(next ? stepPath(next, null) : ABOUT_YOU_CHECK_PATH);
    });

  const previous = previousStep(step);

  return {
    heading: config.heading,
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

function PartnerPage() {
  const {
    heading,
    draft,
    set,
    errors,
    errorFor,
    handleContinue,
    back,
    backLabel,
    continueLabel,
  } = useStep("partner");

  return (
    <PublicFormLayout back={back} backLabel={backLabel}>
      {/* One question: it is the h1, so the field carries no visible label of its own. */}
      <FormSet
        heading={heading}
        continueLabel={continueLabel}
        onContinue={handleContinue}
        errors={errors}
      >
        <GoabFormItem
          id="hasPartner"
          type="radio-group"
          helpText="A common-law partner is someone you've lived with in a marriage-like relationship."
          error={errorFor("hasPartner")}
        >
          <GoabRadioGroup
            name="hasPartner"
            ariaLabel={heading}
            value={draft.hasPartner ?? ""}
            error={Boolean(errorFor("hasPartner"))}
            onChange={(detail) => set("hasPartner")(String(detail.value))}
          >
            <GoabRadioItem value="yes" label="Yes" />
            <GoabRadioItem value="no" label="No" />
          </GoabRadioGroup>
        </GoabFormItem>
      </FormSet>
    </PublicFormLayout>
  );
}

function ChildrenPage() {
  const {
    heading,
    draft,
    set,
    errors,
    errorFor,
    handleContinue,
    back,
    backLabel,
    continueLabel,
  } = useStep("children");

  return (
    <PublicFormLayout back={back} backLabel={backLabel}>
      <FormSet
        heading={heading}
        continueLabel={continueLabel}
        onContinue={handleContinue}
        errors={errors}
      >
        {/* Who counts, from the program pages: under 18, or 18 and 19 at home and in high school. */}
        <GoabFormItem
          id="children"
          helpText="Count children under 18, and children who are 18 or 19, live at home and attend high school. Enter 0 if there are none."
          error={errorFor("children")}
        >
          <GoabInput
            name="children"
            ariaLabel={heading}
            width="80px"
            value={draft.children ?? ""}
            error={Boolean(errorFor("children"))}
            onChange={(detail) => set("children")(String(detail.value).trim())}
          />
        </GoabFormItem>
      </FormSet>
    </PublicFormLayout>
  );
}

function AdultConditionsPage() {
  const {
    heading,
    draft,
    set,
    errors,
    errorFor,
    handleContinue,
    back,
    backLabel,
    continueLabel,
  } = useStep("adult-conditions");

  return (
    <PublicFormLayout back={back} backLabel={backLabel}>
      <FormSet
        heading={heading}
        continueLabel={continueLabel}
        onContinue={handleContinue}
        errors={errors}
      >
        {/* From the Adult program page: who the Adult Health Benefit is for. */}
        <GoabFormItem
          id="adultConditions"
          type="checkbox-list"
          helpText="The Adult Health Benefit is for people in these situations. Include your spouse or partner if you have one. Select all that apply."
          error={errorFor("adultConditions")}
        >
          <GoabCheckboxList
            name="adultConditions"
            value={draft.adultConditions ?? []}
            error={Boolean(errorFor("adultConditions"))}
            onChange={(detail) => set("adultConditions")(detail.value)}
          >
            {ADULT_CONDITION_IDS.map((id) => (
              <GoabCheckbox key={id} id={`adultConditions-${id}`} name={id} text={ADULT_CONDITIONS[id]} />
            ))}
            {/* In a checkbox list, each box's name is the value it reports, so names must be unique. */}
            <GoabCheckbox id="adultConditions-none" name="none" text="None of these" />
          </GoabCheckboxList>
        </GoabFormItem>
      </FormSet>
    </PublicFormLayout>
  );
}

function CheckPage() {
  return (
    <TaskReview section="about-you">
      <AboutYouSummary returnTo="task" />
    </TaskReview>
  );
}

function SectionEntry() {
  const { state } = useForm();
  const next = firstIncompleteStep(state.aboutYou);
  return <Navigate to={next ? stepPath(next, null) : ABOUT_YOU_CHECK_PATH} replace />;
}

/** Typed over every step id, so adding a step fails the build until it has a page. A lookup, not a renderer. */
const PAGES: Record<AboutYouStepId, () => ReactElement> = {
  partner: PartnerPage,
  children: ChildrenPage,
  "adult-conditions": AdultConditionsPage,
};

export function AboutYouSection() {
  return (
    <Routes>
      <Route index element={<SectionEntry />} />
      <Route path="check" element={<CheckPage />} />

      {ABOUT_YOU_STEP_IDS.map((id) => {
        const Page = PAGES[id];
        return <Route key={id} path={id} element={<Page />} />;
      })}

      <Route path="*" element={<Navigate to={SECTION_ROOT} replace />} />
    </Routes>
  );
}
