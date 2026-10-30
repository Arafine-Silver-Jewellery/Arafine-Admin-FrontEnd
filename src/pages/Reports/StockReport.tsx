import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import { useToast } from "../../components/Toast";
import type { StockMovementRow, StockMovementType } from "../../types";
import { formatDateTime } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
import "../../styles/dashboard.css";
import "../../styles/ui-kit.css";
import "../../styles/reports.css";

type Range = "all" | "7d" | "30d" | "90d";

const PAGE_SIZE = 20;

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

const TYPE_OPTIONS: { value: StockMovementType | ""; label: string }[] = [
  { value: "", label: "All Movements" },
  { value: "in", label: "Stock In" },
  { value: "out", label: "Stock Out" },
  { value: "reserve", label: "Reserved" },
  { value: "release", label: "Released" },
  { value: "adjustment", label: "Adjustment" },
];

const TYPE_LABELS: Record<StockMovementType, string> = {
  in: "Stock In",
  out: "Stock Out",
  reserve: "Reserved",
  release: "Released",
  adjustment: "Adjustment",
};

const TYPE_VARIANTS: Record<StockMovementType, string> = {
  in: "success",
  out: "danger",
  reserve: "info",
  release: "warning",
  adjustment: "neutral",
};

const EMPTY_TOTALS = {
  count: 0,
  stockIn: 0,
  stockOut: 0,
  reserved: 0,
  released: 0,
  netChange: 0,
};

function rangeDates(range: Range): { dateFrom?: string; dateTo?: string } {
  if (range === "all") return {};
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const from = new Date();
  from.setDate(from.getDate() - days);
  const to = new Date();
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
}

export default function StockReport() {
  const toast = useToast();

  const [range, setRange] = useState<Range>("30d");
  const [type, setType] = useState<StockMovementType | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<StockMovementRow[]>([]);
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getStockMovementsReport({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        type: type || undefined,
        ...rangeDates(range),
      });
      setRows(response.data || []);
      setTotals(response.totals ?? EMPTY_TOTALS);
      setTotalItems(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 1);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stock movements");
    }
    finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, type, range]);

  useEffect(() => {
    load();
  }, [load]);

  function handleExport() {
    downloadCsv(
      `stock-movements-${new Date().toISOString().slice(0, 10)}`,
      buildCsv(
        ["SL", "Date", "Product", "SKU", "Type", "Qty", "Stock Before", "Stock After", "Reserved Before", "Reserved After", "Reference", "Note"],
        rows.map((row, index) => [
          (page - 1) * PAGE_SIZE + index + 1,
          formatDateTime(row.createdAt),
          row.productName,
          row.productSku,
          TYPE_LABELS[row.type],
          row.quantity,
          row.stockBefore,
          row.stockAfter,
          row.reservedBefore,
          row.reservedAfter,
          row.referenceType ? `${row.referenceType}${row.referenceId ? ` (${row.referenceId.slice(0, 8)})` : ""}` : "—",
          row.note ?? "—",
        ]),
      ),
    );
    toast.success(`Exported ${rows.length} movement${rows.length === 1 ? "" : "s"}`);
  }

  const columns = useMemo(() => [
    {
      key: "date",
      header: "When",
      width: "150px",
      render: (row: StockMovementRow) => (
        <span className="ak-text-sm">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "product",
      header: "Product",
      render: (row: StockMovementRow) => (
        <div className="vendor-info">
          <span className="product-name">{row.productName}</span>
          <span className="vendor-email">{row.productSku}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Movement",
      width: "120px",
      render: (row: StockMovementRow) => (
        <span className={`ak-status ak-status--${TYPE_VARIANTS[row.type]}`}>
          <span className="ak-status__dot" />
          {TYPE_LABELS[row.type]}
        </span>
      ),
    },
    {
      key: "quantity",
      header: "Qty",
      width: "80px",
      align: "right" as const,
      render: (row: StockMovementRow) => row.quantity,
    },
    {
      key: "stock",
      header: "Stock",
      width: "130px",
      align: "right" as const,
      render: (row: StockMovementRow) => (
        <span className="ak-text-sm">{row.stockBefore} → {row.stockAfter}</span>
      ),
    },
    {
      key: "reserved",
      header: "Reserved",
      width: "130px",
      align: "right" as const,
      render: (row: StockMovementRow) => (
        <span className="ak-text-sm">{row.reservedBefore} → {row.reservedAfter}</span>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      render: (row: StockMovementRow) => (
        <span className="ak-text-sm ak-text-muted">
          {row.referenceType ?? "—"}
          {row.referenceId ? ` · ${row.referenceId.slice(0, 8)}` : ""}
          {row.note ? ` · ${row.note}` : ""}
        </span>
      ),
    },
  ], []);

  return (
    <div className="reports-container">
      <div className="filter-card">
        <h3>Filter Data</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Period</label>
            <select
              value={range}
              onChange={(e) => {
                setRange(e.target.value as Range);
                setPage(1);
              }}
            >
              {RANGE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Movement</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as StockMovementType | "");
                setPage(1);
              }}
            >
              {TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Product</label>
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by product name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button
            className="btn-filter-secondary"
            onClick={() => {
              setRange("all");
              setType("");
              setSearch("");
              setPage(1);
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="report-card" style={{ borderLeft: "4px solid #f44336" }}>
          <p style={{ margin: 0, color: "#f44336" }}>{error}</p>
        </div>
      )}

      <div className="reports-stats-grid">
        <div className="reports-stat-card wide">
          <div className="reports-stat-icon blue">📦</div>
          <div className="reports-stat-content">
            <h2>{totals.count.toLocaleString()}</h2>
            <p>Movements in range</p>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon green">📥</div>
          <div className="reports-stat-content">
            <h2>{totals.stockIn.toLocaleString()}</h2>
            <p>Stock In</p>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon red">📤</div>
          <div className="reports-stat-content">
            <h2>{totals.stockOut.toLocaleString()}</h2>
            <p>Stock Out</p>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon teal">🔒</div>
          <div className="reports-stat-content">
            <h2>{totals.reserved.toLocaleString()}</h2>
            <p>Reserved</p>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon purple">📈</div>
          <div className="reports-stat-content">
            <h2>{totals.netChange >= 0 ? "+" : ""}{totals.netChange.toLocaleString()}</h2>
            <p>Net Stock Change</p>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>
            Stock Movements <span className="count">{totalItems}</span>
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button className="btn-export" onClick={handleExport} disabled={rows.length === 0}>
              Export CSV
            </button>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          loadingText="Loading stock movements…"
          emptyIcon="box"
          emptyTitle="No stock movements yet"
          emptyDescription="Stock changes from orders and manual updates will show up here."
          keyExtractor={(row: StockMovementRow) => row.id}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
