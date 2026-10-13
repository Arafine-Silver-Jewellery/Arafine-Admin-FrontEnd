import { useState } from "react";
import "../styles/ui-kit.css";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  showFilterButton?: boolean;
  filterCount?: number;
  onFilterClick?: () => void;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search…",
  showFilterButton = false,
  filterCount = 0,
  onFilterClick,
  className = "",
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch?.();
  }

  function handleClear() {
    onChange("");
    onSearch?.();
  }

  return (
    <div className={`ak-searchbar ${className}`}>
      <form onSubmit={handleSubmit} className={`ak-searchbar__form ${isFocused ? "ak-searchbar__form--focused" : ""}`}>
        <svg className="ak-searchbar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="ak-searchbar__input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {value && (
          <button type="button" className="ak-searchbar__clear" onClick={handleClear}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        )}
      </form>
      {showFilterButton && (
        <button
          type="button"
          className={`ak-searchbar__filter ${filterCount > 0 ? "ak-searchbar__filter--active" : ""}`}
          onClick={onFilterClick}
        >
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
          {filterCount > 0 && <span className="ak-searchbar__badge">{filterCount}</span>}
        </button>
      )}
    </div>
  );
}
