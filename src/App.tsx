import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  GoabOneColumnLayout,
  GoabAppHeader,
  GoabButton,
  GoabAppFooter,
  GoabAppFooterMetaSection,
  GoabPageBlock,
  GoabText,
} from "@abgov/react-components";

import { SERVICE_NAME } from "./lib/service";
import { CHECKED_ON, SOURCES } from "./lib/health-benefits";
import { useForm, startNewApplication } from "./store/form-store";

/** A sliver of footer above the fold, so a short page reads as finished rather than clipped. */
const FOOTER_HAIRLINE = "3px";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Publishes the header's height as --pf-header-height so the content region can subtract
 * it. Observed rather than hardcoded: GoabAppHeader grows when a fork adds nav links or
 * opens its menu on a small screen.
 */
function useHeaderHeight() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = ref.current;
    if (!header) return;

    const publish = () => {
      const { height } = header.getBoundingClientRect();
      document.documentElement.style.setProperty(
        "--pf-header-height",
        `${Math.round(height)}px`,
      );
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return ref;
}

export function App() {
  // GoabAppHeader takes a plain href, so it needs the deploy's base path; BASE_URL is
  // what CI derived from the repository name, so the logo link is right in every fork.
  const home = import.meta.env.BASE_URL;
  const headerRef = useHeaderHeight();
  const { dispatch } = useForm();
  const navigate = useNavigate();

  // Answers live only in this browser; this removes them, for example on a shared device.
  async function clearMyAnswers() {
    await startNewApplication(dispatch);
    navigate("/");
  }

  return (
    <GoabOneColumnLayout>
      <section slot="header" ref={headerRef}>
        <GoabAppHeader url={home} heading={SERVICE_NAME} maxContentWidth="704px">
          <div slot="utilities">
            <GoabButton type="tertiary" size="compact" onClick={clearMyAnswers}>
              Clear my answers
            </GoabButton>
          </div>
        </GoabAppHeader>
      </section>

      <GoabPageBlock width="640px">
        {/*
          The first viewport belongs to the question: hold the content region to one
          viewport minus the header, so the footer starts at the fold instead of sitting
          beside a one-question page. vh rather than dvh, so mobile browser chrome showing
          and hiding does not reflow the page under someone's finger. See docs/design-notes.md.
        */}
        <div
          style={{
            minHeight: `calc(100vh - var(--pf-header-height, 0px) - ${FOOTER_HAIRLINE})`,
            paddingTop: "var(--goa-space-2xl)",
            paddingBottom: "var(--goa-space-3xl)",
          }}
        >
          <ScrollToTop />
          <Outlet />
          {/* The footer only takes links, so the disclaimer sits at the end of every page. */}
          <GoabText size="body-s" mt="3xl" mb="none" color="secondary">
            Unofficial tool. Rules from alberta.ca as of {CHECKED_ON}. Always check the official
            program page.
          </GoabText>
        </div>
      </GoabPageBlock>

      <section slot="footer">
        {/* The meta section lays links out horizontally; the nav section would stack them. */}
        <GoabAppFooter>
          <GoabAppFooterMetaSection>
            <a href={SOURCES.child.url}>{SOURCES.child.name}</a>
            <a href={SOURCES.adult.url}>{SOURCES.adult.name}</a>
            <a href="https://github.com/zahrafalak/alberta-health-benefits-precheck">Source code</a>
          </GoabAppFooterMetaSection>
        </GoabAppFooter>
      </section>
    </GoabOneColumnLayout>
  );
}
