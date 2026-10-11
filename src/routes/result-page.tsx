import { Link, useNavigate } from "react-router-dom";
import { GoabButton, GoabButtonGroup, GoabCallout, GoabLink, GoabText } from "@abgov/react-components";
import { ResultsPage, ResultContactSection } from "../components/results-page";
import { useForm, startNewApplication } from "../store/form-store";
import { canSubmit } from "../lib/sections";
import { householdFrom, adultConditionsFrom } from "../sections/about-you/rules";
import { incomeAnswersFrom } from "../sections/income/rules";
import {
  APPLICATION_FORM,
  BENEFIT_YEAR,
  SOURCES,
  assess,
  familyIncome,
  formatDollars,
  type ProgramResult,
} from "../lib/health-benefits";

/**
 * The pre-check's answer, in place of the template's submit and confirmation. Nothing is
 * sent anywhere: the result is worked out in the browser from the answers, by the rules
 * in src/lib/health-benefits.ts.
 */
export function ResultPage() {
  const { state, dispatch } = useForm();
  const navigate = useNavigate();

  const household = householdFrom(state.aboutYou);
  const amounts = household ? incomeAnswersFrom(state.income, household.hasPartner) : null;

  // Someone who arrives before finishing is sent to the page that says what's left.
  if (!canSubmit(state) || !household || !amounts) {
    return (
      <ResultsPage
        heading="Your result isn't ready yet"
        status="important"
        statusHeading="Some of your answers are missing"
        actions={
          <GoabButton type="primary" onClick={() => navigate("/review")}>
            See what's left
          </GoabButton>
        }
      />
    );
  }

  const income = familyIncome(amounts);
  const results = assess(household, income, adultConditionsFrom(state.aboutYou));
  const qualifying = results.filter((r) => r.mayQualify);

  async function startAgain() {
    await startNewApplication(dispatch);
    navigate("/");
  }

  return (
    <ResultsPage
      heading="Your result"
      status={qualifying.length > 0 ? "success" : "important"}
      statusHeading={
        qualifying.length > 0
          ? `You may qualify for the ${qualifying.map((r) => SOURCES[r.program].name).join(" and the ")}`
          : "You may not qualify for these benefits"
      }
      statusBody={`This is a pre-check, not a decision. The program decides using the income the Canada Revenue Agency confirms. Your family income, worked out the program's way: ${formatDollars(income)}.`}
      actions={
        <GoabButtonGroup alignment="start">
          <GoabButton type="secondary" onClick={() => navigate("/review")}>
            Change your answers
          </GoabButton>
          <GoabButton type="tertiary" onClick={startAgain}>
            Clear my answers and start again
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      {results.map((result) => (
        <ProgramSection key={result.program} result={result} />
      ))}

      <GoabText tag="h2" mt="xl" mb="s">
        How to apply
      </GoabText>
      <ol style={{ marginTop: 0 }}>
        <li>
          Fill out the application form{" "}
          <a href={APPLICATION_FORM.url}>{APPLICATION_FORM.number}</a>. It's the same form for both
          benefits.
        </li>
        <li>Sign and date the declaration and the consent for the Canada Revenue Agency to check your income.</li>
        <li>Send it to the Health Benefits Contact Centre by email, mail or fax (details below).</li>
      </ol>
      <GoabText mt="none" mb="none">
        If you are leaving Income Support or AISH, speak to your case worker. Rules for the{" "}
        {BENEFIT_YEAR} benefit year.
      </GoabText>

      <ResultContactSection />

      <GoabText mt="xl" mb="none" size="body-s">
        <GoabLink>
          <Link to="/review">Check your answers again</Link>
        </GoabLink>
      </GoabText>
    </ResultsPage>
  );
}

function ProgramSection({ result }: { result: ProgramResult }) {
  const source = SOURCES[result.program];
  return (
    <>
      <GoabText tag="h2" mt="xl" mb="s">
        {source.name}
      </GoabText>
      <GoabCallout
        type={result.mayQualify ? "success" : "information"}
        heading={result.mayQualify ? "You may qualify" : "You may not qualify"}
        mb="s"
      >
        {result.reasons.join(" ")}
        {result.program === "adult" &&
          " People who get health benefits from the Alberta Seniors Benefit can't also get the Adult Health Benefit."}
      </GoabCallout>
      <GoabText mt="none" mb="none">
        <a href={source.url}>Read about the {source.name}</a> (rules checked {source.checkedOn}).
      </GoabText>
    </>
  );
}
