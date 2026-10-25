import type { MenuItem } from "../config/menu";

/**
 * Matching a menu search query against the admin menu.
 *
 * Deliberately not fuzzy: a predictable token match is easier to reason
 * about than subsequence matching, needs no dependency, and behaves the way
 * people expect from a menu search ("limited stock" should find Limited
 * Stock and not every screen that mentions stock).
 */

/** What the haystack for an item looks like — label, path and extra terms. */
function haystack(item: MenuItem): string {
  return `${item.label} ${item.path} ${(item.keywords ?? []).join(" ")}`.toLowerCase();
}

/**
 * How well an item matches. Higher is better.
 *
 * The tiers matter: typing "limited" should put "Limited Stock" above a
 * screen that merely has "limited" somewhere in its path.
 */
function score(item: MenuItem, query: string, termCount: number): number {
  const label = item.label.toLowerCase();

  let score: number;
  if (label === query) score = 100;            // exact label
  else if (label.startsWith(query)) score = 50; // label starts with the query
  else if (label.includes(query)) score = 25;   // label contains the query
  else score = 5;                               // matched only via path/keyword

  // A multi-word query that matched every term is a stronger signal than a
  // single word that happened to appear somewhere.
  if (termCount > 1) score += 10;

  return score;
}

/**
 * Whether the user may open a screen.
 *
 * `MenuItem.permission` is a string or an array of strings, and
 * `hasPermission` already implements OR semantics for an array — so an item
 * with `["storage", "storage-settings"]` is reachable with either key.
 */
function permitted(
  item: MenuItem,
  hasPermission: (permission: string | string[]) => boolean,
): boolean {
  return hasPermission(item.permission);
}

/**
 * The screens matching `query`, best first.
 *
 * Every whitespace-separated term must match somewhere (AND semantics), so
 * "limited stock" narrows rather than widens. Screens the user cannot open
 * are removed before matching, so a result never leads to "Access Denied".
 *
 * An empty query matches nothing — the search shows only what was typed,
 * never the whole menu.
 */
export function searchMenu(
  items: MenuItem[],
  query: string,
  hasPermission: (permission: string | string[]) => boolean,
): MenuItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const terms = q.split(/\s+/);

  return items
    .filter((item) => permitted(item, hasPermission))
    .filter((item) => {
      const hay = haystack(item);
      return terms.every((term) => hay.includes(term));
    })
    .map((item) => ({ item, score: score(item, q, terms.length) }))
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .map((entry) => entry.item);
}
