import type { ReactNode } from "react";
import Pagination from "./Pagination";
import EmptyState from "./EmptyState";
import "../styles/ui-kit.css";

interface Column<T> {
  key: string;
  header: ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (item: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /**
   * True while a request is in flight. The table picks its own in-flight
   * presentation from the data: full loader when there is nothing to show yet,
   * dimmed rows + progress bar when a refetch is replacing rows already on
   * screen. Callers should not expect `loading` to blank the table.
   */
  loading?: boolean;
  loadingText?: string;
  emptyIcon?: "search" | "box" | "file" | "users" | "cart" | "bell" | "folder" | "image";
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  keyExtractor: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T, index: number) => string;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  loadingText = "Loading…",
  emptyIcon = "box",
  emptyTitle = "No data found",
  emptyDescription,
  emptyAction,
  keyExtractor,
  onRowClick,
  rowClassName,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
  className = "",
}: DataTableProps<T>) {
  const hasPagination = currentPage !== undefined && totalPages !== undefined && onPageChange !== undefined;

  // Two distinct in-flight states, driven off the single `loading` prop:
  //
  //   - Nothing on screen yet  -> full loader, replacing everything. Correct for
  //     the first paint of a page.
  //   - Rows already rendered   -> keep them, dim them, show a progress bar. A
  //     filter/page/search change must not blank the table the user is reading;
  //     replacing 20 rows with one spinner row collapses the table height and
  //     makes the page jump, which reads as a full reload rather than a refresh.
  const showLoader = loading && data.length === 0;
  const showRefresh = loading && data.length > 0;

  return (
    <div className={`ak-table-wrapper ${showRefresh ? "ak-table-wrapper--refreshing" : ""} ${className}`}>
      <div className="ak-table-scroll">
        <table className="ak-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align || "left" }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showLoader ? (
              <tr>
                <td colSpan={columns.length} className="ak-table__loading">
                  <div className="ak-table__loader">
                    <span className="ak-spinner" />
                    <span>{loadingText}</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="ak-table__empty">
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={keyExtractor(item, index)}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={`${onRowClick ? "ak-table__row--clickable" : ""} ${rowClassName ? rowClassName(item, index) : ""}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      data-label={col.header}
                      style={{ textAlign: col.align || "left" }}
                    >
                      {col.render
                        ? col.render(item, index)
                        : (item as Record<string, unknown>)[col.key]?.toString() ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasPagination && data.length > 0 && (
        <div className="ak-table__footer">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
