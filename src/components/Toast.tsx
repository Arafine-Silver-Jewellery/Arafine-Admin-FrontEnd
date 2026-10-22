import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import "../styles/toast.css";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  /** Set when the toast is on its way out. It stays mounted for the length of
   *  the exit animation, then gets dropped — removing it outright would make
   *  the toasts below it jump instead of move. */
  leaving: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

/** How many toasts stay on screen at once. */
const MAX_VISIBLE = 4;
/** Must match the `slideOut` animation in toast.css. */
const EXIT_MS = 220;
const AUTO_DISMISS_MS = 4000;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // The queue is mirrored in a ref because trimming and dismissal both need to
  // read the current list and schedule timers. A `setToasts` updater can't do
  // that: it runs during the render phase, where starting timers is a side
  // effect (and in StrictMode it runs twice). Every toast in the app flows
  // through this one provider, so replacing the array in a single place is
  // safe.
  const toastsRef = useRef<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const commit = useCallback((next: Toast[]) => {
    toastsRef.current = next;
    setToasts(next);
  }, []);

  /** Clear and replace a toast's pending timer so two can never race. */
  const schedule = useCallback((id: string, run: () => void, ms: number) => {
    const pending = timers.current.get(id);
    if (pending !== undefined) window.clearTimeout(pending);
    timers.current.set(id, window.setTimeout(run, ms));
  }, []);

  /** Remove the node outright. Runs after the exit animation has played. */
  const drop = useCallback(
    (id: string) => {
      const pending = timers.current.get(id);
      if (pending !== undefined) {
        window.clearTimeout(pending);
        timers.current.delete(id);
      }
      commit(toastsRef.current.filter((t) => t.id !== id));
    },
    [commit],
  );

  /** Start the exit animation. Guards against a double-call from both the
   *  auto-dismiss timer and an overflow trim landing on the same toast. */
  const dismiss = useCallback(
    (id: string) => {
      if (toastsRef.current.some((t) => t.id === id && t.leaving)) return;
      commit(toastsRef.current.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      schedule(id, () => drop(id), EXIT_MS);
    },
    [commit, schedule, drop],
  );

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const next: Toast[] = [...toastsRef.current, { id, message, type, leaving: false }];

      // Newest lands at the bottom of the column. Once the stack is full, the
      // oldest visible toast starts animating out and the ones below it slide
      // up to fill the gap.
      const visible = next.filter((t) => !t.leaving);
      const overflow = visible.slice(0, Math.max(0, visible.length - MAX_VISIBLE));
      const overflowIds = new Set(overflow.map((t) => t.id));

      commit(
        overflowIds.size > 0
          ? next.map((t) => (overflowIds.has(t.id) ? { ...t, leaving: true } : t))
          : next,
      );

      for (const stale of overflow) schedule(stale.id, () => drop(stale.id), EXIT_MS);
      schedule(id, () => dismiss(id), AUTO_DISMISS_MS);
    },
    [commit, schedule, dismiss, drop],
  );

  const success = useCallback((message: string) => showToast(message, "success"), [showToast]);
  const error = useCallback((message: string) => showToast(message, "error"), [showToast]);
  const warning = useCallback((message: string) => showToast(message, "warning"), [showToast]);
  const info = useCallback((message: string) => showToast(message, "info"), [showToast]);

  // Timers outlive the provider if it unmounts mid-flight.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => window.clearTimeout(t));
      pending.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}${toast.leaving ? " toast--leaving" : ""}`}
          >
            <div className="toast-icon">
              {toast.type === "success" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
              {toast.type === "error" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
              {toast.type === "warning" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
              {toast.type === "info" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </div>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}