import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import type { VendorSalesRow } from "../../types";
import { formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
// `ak-table` lives in the UI kit.
import "../../styles/ui-kit.css";
import "./vendor-sales.css";

const PAGE_SIZE = 20;

/** How many vendors the leaderboard at the top of the screen shows. */
const LEADERBOARD_SIZE = 6;

const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
] as const;

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

type Range = (typeof RANGE_OPTIONS)[number]["value"];
type VendorStatusFilter = (typeof STATUS_OPTIONS)[number]["value"];

const EMPTY_TOTALS = {
  totalVendors: 0,
  activeVendors: 0,
  totalOrders: 0,
  totalSales: 0,
  totalProducts: 0,
};

export default function VendorSales() {
  const [range, setRange] = useState<Range>("30d");
  const [statusFilter, setStatusFilter] = useState<VendorStatusFilter>("all");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [rows, setRows] = useState<VendorSalesRow[]>([]);
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [vendorNames, setVendorNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getVendorSalesReport({
        page,
        limit: PAGE_SIZE,
        // The dropdown and the search box both narrow by vendor name; the
        // backend only takes one search term, so the dropdown wins when set.
        search: selectedVendor || searchQuery.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        range,
      });
      setRows(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
      setTotals(response.totals ?? EMPTY_TOTALS);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendor sales");
    }
    finally {
      setLoading(false);
    }
  }, [page, selectedVendor, searchQuery, statusFilter, range]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  // The dropdown lists every vendor, so it needs an unfiltered read. It is
  // fetched once per range change — the vendor list itself doesn't move.
  useEffect(() => {
    let cancelled = false;
    api
      .getVendorSalesReport({ page: 1, limit: 100, range })
      .then((response) => {
        if (cancelled) return;
        setVendorNames((response.data || []).map((v) => v.name));
      })
      .catch(() => {
        if (!cancelled) setVendorNames([]);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  // The sales-share bar is scaled against the leading vendor on the page,
  // so the top seller always reads as a full bar.
  const topSale = useMemo(
    () => rows.reduce((max, row) => Math.max(max, row.totalSales), 0),
    [rows],
  );

  // The leaderboard is the same rows, ranked by sales.
  const leaderboard = useMemo(
    () =>
      [...rows]
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, LEADERBOARD_SIZE),
    [rows],
  );

  const clearFilters = () => {
    setRange("30d");
    setStatusFilter("all");
    setSelectedVendor("");
    setSearchQuery("");
    setPage(1);
  };

  const handleExport = () => {
    const headers = [
      "Rank",
      "Vendor Name",
      "Email",
      "Phone",
      "Status",
      "Products",
      "Orders",
      "Units Sold",
      "Total Sales",
    ];
    const data = rows.map((vendor, index) => [
      (page - 1) * PAGE_SIZE + index + 1,
      vendor.name,
      vendor.email ?? "",
      vendor.phone ?? "",
      vendor.status,
      vendor.totalProducts,
      vendor.totalOrders,
      vendor.unitsSold,
      formatPrice(vendor.totalSales),
    ]);
    downloadCsv(`vendor-sales-${new Date().toISOString().slice(0, 10)}`, buildCsv(headers, data));
  };

  const columns = [
    {
      key: "rank",
      header: "Rank",
      width: "72px",
      align: "center" as const,
      render: (_vendor: VendorSalesRow, index: number) => (
        <span className="vs-rank">{(page - 1) * PAGE_SIZE + index + 1}</span>
      ),
    },
    {
      key: "name",
      header: "Vendor",
      render: (vendor: VendorSalesRow) => (
        <div className="vs-vendor">
          <div className="vs-vendor-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 9l1.5-5h15L21 9" />
              <path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
              <path d="M9 20v-6h6v6" />
            </svg>
          </div>
          <div className="vs-vendor-text">
            <span className="vs-vendor-name">{vendor.name}</span>
            <span className="vs-vendor-email">{vendor.email || vendor.phone || "—"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      render: (vendor: VendorSalesRow) => (
        <span className={`vs-status vs-status--${vendor.status === "active" ? "active" : "inactive"}`}>
          {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
        </span>
      ),
    },
    {
      key: "totalProducts",
      header: "Products",
      align: "right" as const,
      render: (vendor: VendorSalesRow) => vendor.totalProducts.toLocaleString(),
    },
    {
      key: "totalOrders",
      header: "Orders",
      align: "right" as const,
      render: (vendor: VendorSalesRow) => vendor.totalOrders.toLocaleString(),
    },
    {
      key: "unitsSold",
      header: "Units Sold",
      align: "right" as const,
      render: (vendor: VendorSalesRow) => vendor.unitsSold.toLocaleString(),
    },
    {
      key: "share",
      header: "Sales Share",
      width: "180px",
      render: (vendor: VendorSalesRow) => (
        <div className="vs-share">
          <div
            className="vs-share-fill"
            style={{ width: `${topSale > 0 ? (vendor.totalSales / topSale) * 100 : 0}%` }}
          />
        </div>
      ),
    },
    {
      key: "totalSales",
      header: "Total Sale",
      align: "right" as const,
      render: (vendor: VendorSalesRow) => formatPrice(vendor.totalSales),
    },
  ];

  return (
    <div className="vendor-sales">
      <nav className="vs-breadcrumb">
        <span>Sales &amp; Transaction Report</span>
        <span className="vs-breadcrumb-sep">/</span>
        <span className="vs-breadcrumb-current">Vendor Sales</span>
      </nav>

      <h1 className="vs-title">Vendor Sales</h1>

      {error && (
        <div className="vs-error-card">
          <p>{error}</p>
        </div>
      )}

      <div className="vs-stats-grid">
        <div className="vs-stat-card">
          <div className="vs-stat-icon vs-stat-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 9l1.5-5h15L21 9" />
              <path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
              <path d="M9 20v-6h6v6" />
            </svg>
          </div>
          <div className="vs-stat-body">
            <div className="vs-stat-value">{totals.totalVendors.toLocaleString()}</div>
            <div className="vs-stat-label">Total Vendors</div>
            <div className="vs-stat-split">
              <span className="active">
                {totals.activeVendors.toLocaleString()}
                <em>active</em>
              </span>
              <span className="inactive">
                {(totals.totalVendors - totals.activeVendors).toLocaleString()}
                <em>inactive</em>
              </span>
            </div>
          </div>
        </div>

        <div className="vs-stat-card">
          <div className="vs-stat-icon vs-stat-icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 9h6M9 13h6M12 9v7" />
            </svg>
          </div>
          <div className="vs-stat-body">
            <div className="vs-stat-value">{formatPrice(totals.totalSales, { compact: true })}</div>
            <div className="vs-stat-label">Total Vendor Sales</div>
          </div>
        </div>

        <div className="vs-stat-card">
          <div className="vs-stat-icon vs-stat-icon--amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
              <rect x="3" y="4" width="18" height="4" rx="1" />
              <path d="M10 12h4" />
            </svg>
          </div>
          <div className="vs-stat-body">
            <div className="vs-stat-value">{totals.totalOrders.toLocaleString()}</div>
            <div className="vs-stat-label">Total Orders</div>
          </div>
        </div>

        <div className="vs-stat-card">
          <div className="vs-stat-icon vs-stat-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" />
            </svg>
          </div>
          <div className="vs-stat-body">
            <div className="vs-stat-value">{totals.totalProducts.toLocaleString()}</div>
            <div className="vs-stat-label">Vendor Products</div>
          </div>
        </div>
      </div>

      <div className="vs-filter-card">
        <div className="vs-filter-group">
          <label htmlFor="vs-vendor">Vendor</label>
          <select
            id="vs-vendor"
            value={selectedVendor}
            onChange={(e) => {
              setSelectedVendor(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Vendors</option>
            {vendorNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="vs-filter-group">
          <label htmlFor="vs-status">Status</label>
          <select
            id="vs-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as VendorStatusFilter);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="vs-filter-group">
          <label htmlFor="vs-range">Date Range</label>
          <select
            id="vs-range"
            value={range}
            onChange={(e) => {
              setRange(e.target.value as Range);
              setPage(1);
            }}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="vs-clear-btn" onClick={clearFilters}>
          Clear
        </button>

        <div className="vs-filter-actions">
          <div className="vs-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by vendor name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <button
            type="button"
            className="vs-export-btn"
            onClick={handleExport}
            disabled={rows.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {leaderboard.length > 0 && (
        <div className="vs-leaderboard">
          <div className="vs-leaderboard-head">
            <h2>Top Vendors by Sales</h2>
            <p>The vendors that sold most over the selected period</p>
          </div>
          <ol className="vs-leaderboard-list">
            {leaderboard.map((vendor, index) => (
              <li key={vendor.vendorId} className="vs-leaderboard-item">
                <span className="vs-leaderboard-rank">{index + 1}</span>
                <span className="vs-leaderboard-name" title={vendor.name}>
                  {vendor.name}
                </span>
                <span className="vs-leaderboard-track">
                  <span
                    className="vs-leaderboard-fill"
                    style={{
                      display: "block",
                      width: `${topSale > 0 ? (vendor.totalSales / topSale) * 100 : 0}%`,
                    }}
                  />
                </span>
                <span className="vs-leaderboard-value">
                  {formatPrice(vendor.totalSales, { compact: true })}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="vs-table-card">
        <div className="vs-table-header">
          <h2>
            Vendor List
            <span className="vs-table-count">{totalItems.toLocaleString()}</span>
          </h2>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          loadingText="Loading vendors…"
          emptyIcon="users"
          emptyTitle="No vendor sales yet"
          emptyDescription="A vendor shows up here once it owns products that have been sold and paid for. Until then there is nothing to report."
          keyExtractor={(vendor) => vendor.vendorId}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="vendors"
        />
      </div>
    </div>
  );
}
