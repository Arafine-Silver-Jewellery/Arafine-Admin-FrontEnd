import { useState, useEffect, useRef } from "react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
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
      ref={dropdownRef}
      className={`ak-status-dropdown ak-status-dropdown--${size} ${isOpen ? "ak-status-dropdown--open" : ""} ${disabled ? "ak-status-dropdown--disabled" : ""} ${className}`}
    >
      <button
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

      {isOpen && (
        <div className="ak-status-dropdown__menu">
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
        </div>
      )}
    </div>
  );
}
