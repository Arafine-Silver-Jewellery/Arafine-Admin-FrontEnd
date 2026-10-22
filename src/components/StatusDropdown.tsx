import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/ui-kit.css";

interface StatusOption {
  value: string;
  label: string;
  color?: "success" | "warning" | "danger" | "info" | "neutral" | "brand";
  icon?: React.ReactNode;
}

interface StatusDropdownProps {
  options: StatusOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
  className?: string;
}

const GAP = 4;
const MARGIN = 8;

export default function StatusDropdown({
  options,
  value,
  onChange,
  placeholder = "Select status",
  disabled = false,
  size = "md",
  showDot = true,
  className = "",
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; minWidth: number } | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // The menu renders into a portal on <body>, positioned against the trigger's
  // viewport rect. It has to live outside the DOM tree: the toolbar sits in
  // `.ak-page-body`, which is `overflow: hidden` to clip the table to the
  // card's rounded corners, and that clipped the bottom of an open menu. The
  // card is sized by its own content, so the cut moved with the result count —
  // a long list left room for the menu, a short one (e.g. a Draft filter with a
  // single row) clipped it.
  useLayoutEffect(() => {
    if (!isOpen) return;

    const place = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;

      const rect = trigger.getBoundingClientRect();
      const menuHeight = menu.offsetHeight;
      const menuWidth = menu.offsetWidth;
      const spaceBelow = window.innerHeight - rect.bottom - GAP - MARGIN;
      const spaceAbove = rect.top - GAP - MARGIN;

      // Flip upward only when the list won't fit below AND there's more room
      // above — flipping when both are cramped just hides the menu.
      const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      const top = openUp ? rect.top - GAP - menuHeight : rect.bottom + GAP;
      const left = Math.min(Math.max(rect.left, MARGIN), window.innerWidth - menuWidth - MARGIN);

      setPos({
        top: Math.max(MARGIN, top),
        left: Math.max(MARGIN, left),
        minWidth: rect.width,
      });
    };

    place();
    // `true` so the capture phase catches scrolls in any nested container.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [isOpen, options, value]);

  // Drop the stale rect on close so reopening never flashes the old position.
  useEffect(() => {
    if (!isOpen) setPos(null);
  }, [isOpen]);

  // Close on outside click. The menu is portaled, so it is no longer a DOM
  // descendant of this component and has to be tested separately.
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setIsOpen(false);
  }

  const colorClasses: Record<string, string> = {
    success: "ak-dropdown-opt--success",
    warning: "ak-dropdown-opt--warning",
    danger: "ak-dropdown-opt--danger",
    info: "ak-dropdown-opt--info",
    neutral: "ak-dropdown-opt--neutral",
    brand: "ak-dropdown-opt--brand",
  };

  return (
    <div
      className={`ak-status-dropdown ak-status-dropdown--${size} ${isOpen ? "ak-status-dropdown--open" : ""} ${disabled ? "ak-status-dropdown--disabled" : ""} ${className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        className="ak-status-dropdown__trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {selectedOption ? (
          <span className={`ak-status-dropdown__selected ${selectedOption.color ? colorClasses[selectedOption.color] : ""}`}>
            {showDot && selectedOption.color && (
              <span className={`ak-status-dropdown__dot ak-status-dropdown__dot--${selectedOption.color}`} />
            )}
            {selectedOption.icon && <span className="ak-status-dropdown__icon">{selectedOption.icon}</span>}
            <span className="ak-status-dropdown__text">{selectedOption.label}</span>
          </span>
        ) : (
          <span className="ak-status-dropdown__placeholder">{placeholder}</span>
        )}
        <svg
          className={`ak-status-dropdown__chevron ${isOpen ? "ak-status-dropdown__chevron--open" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="ak-status-dropdown__menu"
            // Measured before it's placed, so hold it invisible for that one
            // frame rather than letting it flash at the top-left of the page.
            style={
              pos
                ? { top: pos.top, left: pos.left, minWidth: pos.minWidth }
                : { visibility: "hidden" }
            }
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`ak-status-dropdown__option ${option.value === value ? "ak-status-dropdown__option--selected" : ""} ${option.color ? colorClasses[option.color] : ""}`}
                onClick={() => handleSelect(option.value)}
              >
                {showDot && option.color && (
                  <span className={`ak-status-dropdown__dot ak-status-dropdown__dot--${option.color}`} />
                )}
                {option.icon && <span className="ak-status-dropdown__icon">{option.icon}</span>}
                <span className="ak-status-dropdown__text">{option.label}</span>
                {option.value === value && (
                  <svg className="ak-status-dropdown__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}