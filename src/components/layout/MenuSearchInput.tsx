import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MenuItem } from "../../config/menu";
import { searchMenu } from "../../utils/menuSearch";
import { MenuSearchDropdown, MENU_SEARCH_LISTBOX_ID } from "./MenuSearchDropdown";

interface MenuSearchInputProps {
  /** The current query. */
  query: string;
  /** Called with the new query. */
  onQueryChange: (value: string) => void;
  /** Every screen the admin panel can reach. */
  items: MenuItem[];
  /** Whether the user may open a screen — the same `hasPermission` the nav uses. */
  hasPermission: (permission: string | string[]) => boolean;
  /** Extra class for the wrapper, so the drawer can reuse this component. */
  className?: string;
  /** Called after a result is chosen — lets the drawer close itself. */
  onNavigate?: () => void;
}

/**
 * The menu search box.
 *
 * A combobox: DOM focus never leaves the input, and the highlighted result
 * is pointed at with `aria-activedescendant`. That is what lets the arrow
 * keys move through the results without the caret jumping to the end of the
 * input, and it is what screen readers expect.
 */
export function MenuSearchInput({
  query,
  onQueryChange,
  items,
  hasPermission,
  className,
  onNavigate,
}: MenuSearchInputProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Only the screens that match what was typed. An empty query matches
  // nothing — the panel stays closed rather than dumping the whole menu
  // on screen.
  const results = searchMenu(items, query, hasPermission);

  // The panel opens only for a real query. It stays open even when nothing
  // matched, so a typo gets a "no match" message rather than silence.
  const showPanel = isOpen && query.trim() !== "";

  // A new result set starts at the top — Enter then jumps to the best match.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Ctrl/Cmd+K focuses the search from anywhere in the app. The intent
  // existed once already — there was a dead "<kbd>Ctrl+K</kbd>" chip in the
  // header that is no longer rendered — but it was never wired up.
  //
  // Two of these inputs can be mounted at once (the header one and the
  // drawer's), so only a *visible* one takes the shortcut. Otherwise the
  // drawer's hidden input would steal the keypress on desktop and focus
  // something the user cannot see.
  useEffect(() => {
    function onShortcut(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "k") return;

      const input = inputRef.current;
      if (!input || !input.offsetParent) return; // hidden or detached

      e.preventDefault();
      input.focus();
      input.select();
      setIsOpen(true);
    }
    document.addEventListener("keydown", onShortcut);
    return () => document.removeEventListener("keydown", onShortcut);
  }, []);

  // Clicking away closes the panel. The dropdown is portaled to <body>, so
  // it is not a DOM descendant of this component and has to be checked
  // separately.
  //
  // There can be two of these inputs on the page at once (the header one
  // and the drawer's), so every open panel is checked — `querySelector`
  // would only ever see the first.
  useEffect(() => {
    if (!isOpen) return;

    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      for (const panel of document.querySelectorAll(".menu-search-dropdown")) {
        if (panel.contains(target)) return;
      }
      setIsOpen(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [isOpen]);

  function select(item: MenuItem) {
    navigate(item.path);
    setIsOpen(false);
    onQueryChange("");
    inputRef.current?.blur();
    onNavigate?.();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        // Nothing to move through until something has been typed.
        if (query.trim() !== "") setIsOpen(true);
        return;
      }
      if (results.length > 0) {
        setActiveIndex((i) => (i + 1) % results.length);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        if (query.trim() !== "") setIsOpen(true);
        return;
      }
      if (results.length > 0) {
        setActiveIndex((i) => (i - 1 + results.length) % results.length);
      }
      return;
    }

    if (e.key === "Enter") {
      // Never submit a surrounding form, even when there is nothing to pick.
      e.preventDefault();
      const item = results[activeIndex];
      if (item) select(item);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      if (isOpen) {
        // First Escape closes the panel and keeps the text.
        setIsOpen(false);
      } else {
        // Second Escape clears it.
        onQueryChange("");
        inputRef.current?.blur();
      }
      return;
    }

    if (e.key === "Tab") {
      setIsOpen(false);
    }
  }

  function clear() {
    onQueryChange("");
    inputRef.current?.focus();
    setIsOpen(true);
  }

  return (
    <div className={`app-header__search ${className ?? ""}`} ref={anchorRef}>

      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label="Search menu"
        aria-expanded={showPanel}
        aria-controls={MENU_SEARCH_LISTBOX_ID}
        aria-autocomplete="list"
        aria-activedescendant={
          showPanel && results.length > 0 && activeIndex >= 0
            ? `menu-search-option-${activeIndex}`
            : undefined
        }
        aria-keyshortcuts="Control+K Meta+K"
        placeholder="Search menu"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {query && (
        <button
          type="button"
          className="app-header__search-clear"
          aria-label="Clear search"
          onMouseDown={(e) => e.preventDefault()}
          onClick={clear}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Announces the result count to screen readers without showing it. */}
      <span className="sr-only" aria-live="polite">
        {showPanel
          ? results.length === 0
            ? "No menu items match"
            : `${results.length} menu ${results.length === 1 ? "item" : "items"} available`
          : ""}
      </span>

      {showPanel && (
        <MenuSearchDropdown
          query={query}
          results={results}
          activeIndex={activeIndex}
          onSelect={select}
          onHover={setActiveIndex}
          anchorRef={anchorRef}
        />
      )}
    </div>
  );
}
