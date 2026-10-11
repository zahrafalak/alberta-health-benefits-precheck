import { useNavigate } from "react-router-dom";
import { GoabButton, GoabButtonGroup, GoabText } from "@abgov/react-components";
import { ResultsPage, ResultContactSection } from "../../components/results-page";
import { useForm } from "../../store/form-store";
import { screenerOutcome } from "./rules";
import { SOURCES } from "../../lib/health-benefits";

/**
 * The screener ruled them out. Says which answer decided it, and offers a way back,
 * because people mistype and a dead end with no exit loses someone who did qualify.
 */
export function NotEligible() {
  const navigate = useNavigate();
  const { state } = useForm();
  const answers = state.eligibility;

  // Name the specific gate rather than saying "you are not eligible" and stopping.
  const reason =
    answers.residency === "no"
      ? "The Alberta Child and Adult Health Benefits are for people who live in Alberta."
      : answers.status === "no"
        ? "The Alberta Child and Adult Health Benefits are for Canadian citizens and permanent residents."
        : answers.otherHealthBenefits === "yes"
          ? "People who get health benefits from Income Support, AISH or the federal Non-Insured Health Benefits program can't also get these benefits. Those programs already cover health costs."
          : "Based on your answers, these benefits may not be for you.";

  // Someone who arrives here without having failed the screener took a wrong turn.
  if (screenerOutcome(answers) !== "ineligible") {
    return (
      <ResultsPage
        heading="Nothing to see here yet"
        status="important"
        statusHeading="You have not finished the eligibility questions"
        actions={
          <GoabButtonGroup alignment="start">
            <GoabButton type="primary" onClick={() => navigate("/eligibility")}>
              Go to the eligibility questions
            </GoabButton>
          </GoabButtonGroup>
        }
      />
    );
  }

  return (
    <ResultsPage
      heading="These benefits may not be for you"
      status="important"
      statusHeading="You may not qualify"
      statusBody={reason}
      actions={
        <GoabButtonGroup alignment="start">
          <GoabButton type="secondary" onClick={() => navigate("/eligibility")}>
            Change your answers
          </GoabButton>
          <GoabButton type="tertiary" onClick={() => navigate("/")}>
            Return to the task list
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabText tag="h2" mt="xl" mb="s">
        Check the official program pages
      </GoabText>
      <GoabText mt="none" mb="none">
        This is an unofficial pre-check. The program pages explain who can apply and how:{" "}
        <a href={SOURCES.child.url}>{SOURCES.child.name}</a> and{" "}
        <a href={SOURCES.adult.url}>{SOURCES.adult.name}</a>.
      </GoabText>

      <ResultContactSection />
    </ResultsPage>
  );
}
