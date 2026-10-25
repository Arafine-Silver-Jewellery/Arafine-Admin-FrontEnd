import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MenuItem } from "../../config/menu";
import "./menu-search-dropdown.css";

const GAP = 8;
const MARGIN = 8;

export const MENU_SEARCH_LISTBOX_ID = "menu-search-results";

interface MenuSearchDropdownProps {
  /** The current query — only used for the "no results" message. */
  query: string;
  /** Matching screens, best first. */
  results: MenuItem[];
  /** Index into `results` of the row the keyboard is currently on. */
  activeIndex: number;
  /** Called with the chosen screen. */
  onSelect: (item: MenuItem) => void;
  /** Called when the pointer moves over a row. */
  onHover: (index: number) => void;
  /** The element the panel is anchored to. */
  anchorRef: React.RefObject<HTMLElement | null>;
}

/**
 * The results panel for the menu search.
 *
 * Portaled to <body> and positioned from JS, following the same pattern as
 * `StatusDropdown`: the header is a grid with a sticky, overflow-clipped
 * ancestor, so a panel rendered inside it would be clipped or mis-anchored.
 *
 * The panel never takes focus — the search input keeps it and the active row
 * is pointed at with `aria-activedescendant`. That is what lets the arrow
 * keys work without the caret jumping to the end of the input.
 */
export function MenuSearchDropdown({
  query,
  results,
  activeIndex,
  onSelect,
  onHover,
  anchorRef,
}: MenuSearchDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; minWidth: number } | null>(null);

  // Measure and place the panel against the anchor. `useLayoutEffect` so it
  // is positioned before the browser paints — otherwise it flashes at the
  // top-left of the page for a frame.
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    const place = () => {
      const a = anchorRef.current;
      const p = panelRef.current;
      if (!a || !p) return;

      const rect = a.getBoundingClientRect();
      const panelHeight = p.offsetHeight;
      const panelWidth = p.offsetWidth;

      const spaceBelow = window.innerHeight - rect.bottom - GAP - MARGIN;
      const spaceAbove = rect.top - GAP - MARGIN;

      // Flip up only when the panel will not fit below AND there is more
      // room above. Flipping when both sides are cramped just hides it.
      const openUp = spaceBelow < panelHeight && spaceAbove > spaceBelow;
      const top = openUp ? rect.top - GAP - panelHeight : rect.bottom + GAP;

      // Keep it on screen horizontally, and keep it aligned with the input
      // where there is room to do so.
      const preferredLeft = rect.left;
      const left = Math.min(
        Math.max(preferredLeft, MARGIN),
        window.innerWidth - panelWidth - MARGIN,
      );

      setPos({
        top: Math.max(MARGIN, top),
        left: Math.max(MARGIN, left),
        minWidth: rect.width,
      });
    };

    place();
    // Capture phase so a scroll in any nested container repositions it.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchorRef, results, query]);

  // Drop the stale rect when the panel unmounts so reopening never flashes
  // at the old position.
  useEffect(() => {
    return () => setPos(null);
  }, []);

  // Group the results by their sidebar section, preserving the order the
  // results came in (which is already relevance-ranked).
  const groups = results.reduce<Map<string, MenuItem[]>>((acc, item) => {
    const list = acc.get(item.group);
    if (list) list.push(item);
    else acc.set(item.group, [item]);
    return acc;
  }, new Map());

  // The index of each item in the flat, ranked results — the keyboard moves
  // through this order, not through the grouped order.
  const rankOf = new Map(results.map((item, index) => [item.path, index]));

  const panel = (
    <div
      ref={panelRef}
      id={MENU_SEARCH_LISTBOX_ID}
      role="listbox"
      className="menu-search-dropdown"
      // Measured before it is placed — hold it invisible for that one frame
      // rather than letting it flash at the top-left of the page.
      style={pos ? { top: pos.top, left: pos.left, minWidth: pos.minWidth } : { visibility: "hidden" }}
    >
      {results.length === 0 ? (
        <div className="menu-search-dropdown__empty">
          No menu items match <strong>&ldquo;{query.trim()}&rdquo;</strong>
        </div>
      ) : (
        Array.from(groups.entries()).map(([group, items]) => (
          <div key={group} className="menu-search-dropdown__group">
            <div className="menu-search-dropdown__group-label">{group}</div>
            {items.map((item) => {
              const index = rankOf.get(item.path) ?? -1;
              const isActive = index === activeIndex;
              return (
                <button
                  key={item.path}
                  type="button"
                  id={`menu-search-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  className={`menu-search-dropdown__option ${isActive ? "menu-search-dropdown__option--active" : ""}`}
                  onMouseEnter={() => onHover(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelect(item)}
                >
                  <span className="menu-search-dropdown__label">{item.label}</span>
                  <span className="menu-search-dropdown__path">{item.path}</span>
                </button>
              );
            })}
          </div>
        ))
      )}
    </div>
  );

  return createPortal(panel, document.body);
}
