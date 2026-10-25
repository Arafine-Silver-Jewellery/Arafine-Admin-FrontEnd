/**
 * CSV export for the Sales & Transaction Report screens.
 *
 * Every report screen has an "Export" button, so the escaping and download
 * logic lives here once instead of being copy-pasted per screen. The column
 * order is whatever the caller passes in — the header row and the data rows
 * are built from the same array, so they can never drift apart.
 */

/** Quotes a cell if it contains a comma, quote, or newline. */
export function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/**
 * Builds a CSV string from a header row and a list of rows.
 * `rows` holds the already-formatted cell values (strings, numbers, or
 * `null` for an empty cell).
 */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }
  return lines.join("\n");
}

/**
 * Triggers a browser download of `content` as a CSV file.
 * `filename` is given without the extension — ".csv" is appended here.
 */
export function downloadCsv(filename: string, content: string): void {
  // The BOM makes Excel open the file as UTF-8 instead of mangling the
  // ₹ sign and any non-ASCII product name.
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
