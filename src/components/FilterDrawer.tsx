import { useEffect, useRef } from "react";
import "../styles/ui-kit.css";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  onApply?: () => void;
  onReset?: () => void;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  title = "Filters",
  children,
  onApply,
  onReset,
}: FilterDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="ak-drawer-overlay" onClick={onClose}>
      <div
        ref={drawerRef}
        className="ak-drawer ak-drawer--right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ak-drawer__header">
          <h2 className="ak-drawer__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <circle cx="4" cy="12" r="2" />
              <circle cx="12" cy="10" r="2" />
              <circle cx="20" cy="14" r="2" />
            </svg>
            {title}
          </h2>
          <button type="button" className="ak-drawer__close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="ak-drawer__body">{children}</div>
        {(onApply || onReset) && (
          <div className="ak-drawer__footer">
            {onReset && (
              <button type="button" className="ak-btn ak-btn--ghost ak-btn--block" onClick={onReset}>
                Reset All
              </button>
            )}
            {onApply && (
              <button type="button" className="ak-btn ak-btn--primary ak-btn--block" onClick={onApply}>
                Apply Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
