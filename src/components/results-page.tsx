import { ReactNode } from "react";
import { GoabText, GoabCallout } from "@abgov/react-components";

type ResultsPageProps = {
  heading: string;
  status: "success" | "important";
  statusHeading: string;
  statusBody?: ReactNode;
  children?: ReactNode;
  actions: ReactNode;
};

/**
 * The terminal outcome screen: eligible, not eligible, or submitted. No back link and
 * it leads with a status Callout, so it renders in the app shell directly rather than
 * through PublicFormLayout.
 */
export function ResultsPage({
  heading,
  status,
  statusHeading,
  statusBody,
  children,
  actions,
}: ResultsPageProps) {
  return (
    <>
      <GoabText tag="h1" mt="none" mb="xl">
        {heading}
      </GoabText>

      {/* mb none: the next section's heading owns the gap, so the rhythm holds with or without a Callout body. */}
      <GoabCallout type={status} heading={statusHeading} mb="none">
        {statusBody}
      </GoabCallout>

      {children}

      <div style={{ marginTop: "var(--goa-space-2xl)" }}>{actions}</div>
    </>
  );
}

/**
 * The contact block on every result page: the Health Benefits Contact Centre, from the
 * "Contact" section of both program pages (src/lib/health-benefits.ts has the sources).
 * The pages hide their email address behind a link, so it isn't copied here.
 */
export function ResultContactSection() {
  return (
    <>
      <GoabText tag="h2" mt="xl" mb="s">
        Health Benefits Contact Centre
      </GoabText>
      <GoabText mt="none" mb="2xs">
        <strong>Phone:</strong> 780-427-6848, toll-free 1-877-469-5437
      </GoabText>
      <GoabText mt="none" mb="2xs">
        <strong>Fax:</strong> 780-415-8386, toll-free 1-855-415-8386
      </GoabText>
      <GoabText mt="none" mb="2xs">
        <strong>Mail:</strong> Health Benefits Contact Centre, PO Box 2222 Station Main, Edmonton,
        Alberta T5J 5H3
      </GoabText>
      <GoabText mt="none" mb="none">
        For the email address, see the contact section of the program pages.
      </GoabText>
    </>
  );
}
