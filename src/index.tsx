import React from "react";
import * as ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Registers the goa-* custom elements the React wrappers render.
import "@abgov/web-components";

import { App } from "./App";
import { FormProvider } from "./store/form-store";
import { TaskList } from "./routes/task-list";
import { EligibilitySection } from "./sections/eligibility/pages";
import { AboutYouSection } from "./sections/about-you/pages";
import { IncomeSection } from "./sections/income/pages";
import { NotEligible } from "./sections/eligibility/not-eligible";
import { UnlockedOnly } from "./routes/guards";
import { ReviewPage } from "./routes/review-page";
import { ResultPage } from "./routes/result-page";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/* basename is the value CI wrote into VITE_BASE_PATH, so the router and the asset
        paths never disagree and a fork needs no edits. */}
    <BrowserRouter
      basename={import.meta.env.BASE_URL.replace(/\/$/, "")}
      // v7 behaviours opted into now, so a fork does not start life with deprecation warnings.
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <FormProvider>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<TaskList />} />

            {/* The sections the screener gates. The task list and the review stay outside:
                they are how a person finds out what is shut and why. */}
            <Route element={<UnlockedOnly />}>
              <Route path="eligibility/*" element={<EligibilitySection />} />
              <Route path="about-you/*" element={<AboutYouSection />} />
              <Route path="income/*" element={<IncomeSection />} />
            </Route>

            <Route path="review" element={<ReviewPage />} />
            <Route path="result" element={<ResultPage />} />
            <Route path="not-eligible" element={<NotEligible />} />
          </Route>
        </Routes>
      </FormProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
