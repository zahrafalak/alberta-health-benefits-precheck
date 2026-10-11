import { Link, useNavigate } from "react-router-dom";
import { GoabText, GoabCallout, GoabButton, GoabLink } from "@abgov/react-components";
import { useForm } from "../store/form-store";
import { incompleteSections, sectionById, type SectionId } from "../lib/sections";
import { EligibilitySummary } from "../sections/eligibility/summary";
import { AboutYouSummary } from "../sections/about-you/summary";
import { IncomeSummary } from "../sections/income/summary";

/**
 * Check your answers, then see the result: the check over the whole pre-check, where each
 * task's own check page is the check over one. Nothing is submitted; the result page works
 * it out in the browser. The cards are each section's summary.tsx in src/sections.
 */
export function ReviewPage() {
  const { state } = useForm();
  const navigate = useNavigate();

  const outstanding = incompleteSections(state);
  const ready = outstanding.length === 0;
  const unlocked = (id: SectionId) => sectionById(id).isUnlocked(state);

  return (
    <div>
      <GoabText tag="h1" mt="none" mb="l">
        Check your answers
      </GoabText>

      {/* Arriving unfinished is normal, not an error: the task list's button is always
          live, and this page says what is left, by name, each one a link. */}
      {!ready && (
        <GoabCallout type="important" heading="You can't see your result yet" mb="xl">
          <GoabText mt="none" mb="s">
            {outstanding.length === 1
              ? "One part is unfinished:"
              : `${outstanding.length} parts are unfinished:`}
          </GoabText>
          <ul style={{ margin: 0, paddingLeft: "var(--goa-space-l)" }}>
            {outstanding.map((section) => (
              <li key={section.id} style={{ marginBottom: "var(--goa-space-2xs)" }}>
                {/* A locked section is listed but not linked: a link to a page they cannot
                    open yet invites them to try. The task list makes the same distinction. */}
                {section.isUnlocked(state) ? (
                  <GoabLink mt="none" mb="none">
                    <Link
                      to={section.route}
                    >{`Finish ${section.title.toLowerCase()}`}</Link>
                  </GoabLink>
                ) : (
                  <span style={{ color: "var(--goa-color-text-secondary)" }}>
                    {section.title} — check if you can apply first
                  </span>
                )}
              </li>
            ))}
          </ul>
        </GoabCallout>
      )}

      {/* A locked section is not shown at all: cards of "Not answered" with Change links
          into a section the person cannot open would contradict the task list. */}
      <EligibilitySummary returnTo="review" />
      {unlocked("about-you") && <AboutYouSummary returnTo="review" />}
      {unlocked("income") && <IncomeSummary returnTo="review" />}

      {ready && (
        <GoabButton type="primary" mt="2xl" onClick={() => navigate("/result")}>
          See my result
        </GoabButton>
      )}
    </div>
  );
}
