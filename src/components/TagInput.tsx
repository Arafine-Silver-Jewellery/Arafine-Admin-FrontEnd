import { useState, useRef, useEffect } from "react";
import "../styles/tag-input.css";

interface Option {
  id: string;
  name: string;
}

interface TagInputProps {
  label?: string;
  placeholder?: string;
  selectedTags: Option[];
  onTagsChange: (tags: Option[]) => void;
  options?: Option[]; // For dropdown-based tag selection
  allowCustomTags?: boolean; // For free-form tag entry (like search tags)
  disabled?: boolean;
}

export default function TagInput({
  label,
  placeholder = "Type and press Enter",
  selectedTags,
  onTagsChange,
  options = [],
  allowCustomTags = false,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on input and exclude already selected
  useEffect(() => {
    if (options.length > 0) {
      const selectedIds = selectedTags.map((t) => t.id);
      const filtered = options.filter(
        (opt) =>
          !selectedIds.includes(opt.id) &&
          opt.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [inputValue, options, selectedTags]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    if (options.length > 0) {
      setShowDropdown(true);
    }
  }

  function handleInputFocus() {
    if (options.length > 0) {
      setShowDropdown(true);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (allowCustomTags && inputValue.trim()) {
        // Add custom tag
        const newTag: Option = {
          id: inputValue.trim().toLowerCase().replace(/\s+/g, "-"),
          name: inputValue.trim(),
        };
        // Check if already exists
        if (!selectedTags.some((t) => t.name.toLowerCase() === newTag.name.toLowerCase())) {
          onTagsChange([...selectedTags, newTag]);
        }
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && selectedTags.length > 0) {
      // Remove last tag on backspace when input is empty
      onTagsChange(selectedTags.slice(0, -1));
    }
  }

  function selectOption(option: Option) {
    onTagsChange([...selectedTags, option]);
    setInputValue("");
    setShowDropdown(false);
    inputRef.current?.focus();
  }

  function removeTag(tagId: string) {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  }

  return (
    <div className="tag-input-container" ref={containerRef}>
      {label && <label className="tag-input-label">{label}</label>}
      <div 
        className={`tag-input-wrapper ${disabled ? "disabled" : ""}`}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Tags inline with input */}
        {selectedTags.map((tag) => (
          <span key={tag.id} className="tag-chip">
            {tag.name}
            {!disabled && (
              <button
                type="button"
                className="tag-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag.id);
                }}
              >
                ×
              </button>
            )}
          </span>
        ))}
        
        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          className="tag-input-field"
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
      </div>
      
      {/* Dropdown for selecting from options */}
      {showDropdown && filteredOptions.length > 0 && (
        <div className="tag-input-dropdown">
          {filteredOptions.map((option) => (
            <div
              key={option.id}
              className="tag-input-option"
              onClick={() => selectOption(option)}
            >
              {option.name}
            </div>
          ))}
        </div>
      )}
      
      {/* Show "no results" when filtering yields nothing */}
      {showDropdown && options.length > 0 && filteredOptions.length === 0 && inputValue && (
        <div className="tag-input-dropdown">
          <div className="tag-input-no-results">No results found</div>
        </div>
      )}
    </div>
  );
}
