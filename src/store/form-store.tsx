import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_FORM,
  formReducer,
  type FormAction,
  type FormState,
} from "../lib/form-state";
import { clearDraft, loadDraft, saveDraft } from "./persistence";
import type { Receipt } from "./submission";

/**
 * The application's answers, held in one place so the task list and the review page
 * read the same state every question page writes. The state and its rules live in
 * src/lib with no React; this file only holds and saves.
 */

type FormContextValue = {
  state: FormState;
  dispatch: (action: FormAction) => void;
  /** Record the receipt and save it before returning: the record has to exist before the person can leave the page. */
  recordSubmission: (receipt: Receipt) => Promise<void>;
};

const FormContext = createContext<FormContextValue | null>(null);

export function FormProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(formReducer, EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadDraft().then((saved) => {
      if (cancelled) return;
      // A visitor with nothing saved starts on an empty form.
      dispatch({ type: "hydrate", state: saved ?? EMPTY_FORM });
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Save on every change, but not before the draft has been read, or the first render
  // saves the empty starting state over a real draft.
  const canSave = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    if (!canSave.current) {
      canSave.current = true;
      return;
    }
    // An untouched form is not a draft, so after "Clear my answers" nothing is saved.
    // `reset` returns the EMPTY_FORM object itself, so this identity check is exact.
    if (state === EMPTY_FORM) return;

    void saveDraft(state);
  }, [state, hydrated]);

  // Render nothing until the draft is read, so the task list never flashes "Not started"
  // over real progress.
  if (!hydrated) return null;

  // The save effect above runs after the next render, and a page can be unloaded before
  // that: a refresh in the moment after submit would land on a draft with no reference.
  // So submitting saves first, and only then updates the state.
  async function recordSubmission(receipt: Receipt): Promise<void> {
    const action: FormAction = {
      type: "submit",
      at: receipt.submittedAt,
      reference: receipt.reference,
    };
    await saveDraft(formReducer(state, action));
    dispatch(action);
  }

  return (
    <FormContext.Provider value={{ state, dispatch, recordSubmission }}>
      {children}
    </FormContext.Provider>
  );
}

export function useForm(): FormContextValue {
  const value = useContext(FormContext);
  if (!value) {
    throw new Error("useForm must be used inside a <FormProvider>");
  }
  return value;
}

/**
 * Forget everything and begin an empty application. Clear the stored draft first, then
 * reset: with a draft held on a server, resetting first would leave the record behind.
 */
export async function startNewApplication(
  dispatch: (action: FormAction) => void,
): Promise<void> {
  await clearDraft();
  dispatch({ type: "reset" });
}

export function newId(): string {
  return crypto.randomUUID();
}
