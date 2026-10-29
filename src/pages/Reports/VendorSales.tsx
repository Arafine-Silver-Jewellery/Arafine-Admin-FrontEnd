import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import { ChartCard, OrdersTrendChart, type DashboardRange } from "../../components/dashboard";
import type { VendorSalesRow } from "../../types";
import { formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
// `ChartCard` and the recharts components live in the dashboard stylesheet;
// `ak-status` / `ak-table` live in the UI kit.
import "../../styles/dashboard.css";
import "../../styles/ui-kit.css";
import "../../styles/reports.css";

const PAGE_SIZE = 20;

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

/** The status filter, widened with "all" for the "no filter" case. */
type VendorStatusFilter = (typeof STATUS_OPTIONS)[number]["value"];

export default function VendorSales() {
  const [range, setRange] = useState<DashboardRange>("30d");
  const [statusFilter, setStatusFilter] = useState<VendorStatusFilter>("all");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [rows, setRows] = useState<VendorSalesRow[]>([]);
  const [totals, setTotals] = useState({
    totalVendors: 0,
    activeVendors: 0,
    totalOrders: 0,
    totalSales: 0,
  });
  const [vendorNames, setVendorNames] = useState<string[]>([]);
  const [trend, setTrend] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
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
      setTotals(
        response.totals ?? {
          totalVendors: 0,
          activeVendors: 0,
          totalOrders: 0,
          totalSales: 0,
        },
      );
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

  useEffect(() => {
    let cancelled = false;
    setTrendLoading(true);
    api
      .getDashboardTrend({ metric: "orders", range })
      .then((data) => {
        if (!cancelled) setTrend(data?.points ?? []);
      })
      .catch(() => {
        if (!cancelled) setTrend([]);
      })
      .finally(() => {
        if (!cancelled) setTrendLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const totalVendorProducts = useMemo(
    () => rows.reduce((sum, v) => sum + v.totalProducts, 0),
    [rows],
  );

  const handleExport = () => {
    const headers = [
      "SL",
      "Vendor Name",
      "Email",
      "Phone",
      "Total Products",
      "Total Orders",
      "Units Sold",
      "Total Sales",
      "Status",
    ];
    const data = rows.map((vendor, index) => [
      (page - 1) * PAGE_SIZE + index + 1,
      vendor.name,
      vendor.email ?? "",
      vendor.phone ?? "",
      vendor.totalProducts,
      vendor.totalOrders,
      vendor.unitsSold,
      formatPrice(vendor.totalSales),
      vendor.status,
    ]);
    downloadCsv(`vendor-sales-${new Date().toISOString().slice(0, 10)}`, buildCsv(headers, data));
  };

  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "56px",
      align: "center" as const,
      render: (_vendor: VendorSalesRow, index: number) =>
        (page - 1) * PAGE_SIZE + index + 1,
    },
    {
      key: "name",
      header: "Vendor Name",
      render: (vendor: VendorSalesRow) => (
        <div className="vendor-cell">
          <div className="vendor-avatar">🏪</div>
          <div className="vendor-info">
            <span className="vendor-name">{vendor.name}</span>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact Info",
      render: (vendor: VendorSalesRow) => (
        <div className="vendor-info">
          <span style={{ fontSize: "13px" }}>{vendor.email || "—"}</span>
          <span style={{ fontSize: "12px", color: "#888" }}>{vendor.phone || ""}</span>
        </div>
      ),
    },
    {
      key: "totalProducts",
      header: "Total Products",
      align: "right" as const,
      render: (vendor: VendorSalesRow) => vendor.totalProducts,
    },
    {
      key: "totalOrders",
      header: "Total Orders",
      align: "right" as const,
      render: (vendor: VendorSalesRow) => vendor.totalOrders,
    },
    {
      key: "totalSales",
      header: "Total Sales",
      align: "right" as const,
      render: (vendor: VendorSalesRow) => formatPrice(vendor.totalSales),
    },
    {
      key: "status",
      header: "Status",
      render: (vendor: VendorSalesRow) => (
        <span
          className={`ak-status ak-status--${vendor.status === "active" ? "success" : "neutral"}`}
        >
          <span className="ak-status__dot" />
          {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
        </span>
      ),
    },
  ];

  return (
    <div className="reports-container">
      <div className="filter-card">
        <h3>Filter Data</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Vendor</label>
            <select
              value={selectedVendor}
              onChange={(e) => {
                setSelectedVendor(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Vendor</option>
              {vendorNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select
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
          <div className="filter-group">
            <label>Date Type</label>
            <select
              value={range}
              onChange={(e) => {
                setRange(e.target.value as DashboardRange);
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
          <button
            className="btn-filter-secondary"
            onClick={() => {
              setSelectedVendor("");
              setStatusFilter("all");
              setSearchQuery("");
              setPage(1);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="report-card" style={{ borderLeft: "4px solid #f44336" }}>
          <p style={{ margin: 0, color: "#f44336" }}>{error}</p>
        </div>
      )}

      <div className="reports-stats-grid">
        <div className="reports-stat-card">
          <div className="reports-stat-icon blue">🏪</div>
          <div className="reports-stat-content">
            <h2>{totals.totalVendors}</h2>
            <p>Total Vendors</p>
            <div className="reports-stat-breakdown">
              <div className="reports-breakdown-item green">
                <span>{totals.activeVendors}</span>
                <label>Active</label>
              </div>
              <div className="reports-breakdown-item red">
                <span>{totals.totalVendors - totals.activeVendors}</span>
                <label>Inactive</label>
              </div>
            </div>
          </div>
        </div>

        <div className="reports-stat-card">
          <div className="reports-stat-icon green">💰</div>
          <div className="reports-stat-content">
            <h2>{formatPrice(totals.totalSales, { compact: true })}</h2>
            <p>Total Sales</p>
          </div>
        </div>

        <div className="reports-stat-card">
          <div className="reports-stat-icon yellow">📦</div>
          <div className="reports-stat-content">
            <h2>{totals.totalOrders}</h2>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="reports-stat-card">
          <div className="reports-stat-icon purple">🛒</div>
          <div className="reports-stat-content">
            <h2>{totalVendorProducts}</h2>
            <p>Vendor Products (this page)</p>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div style={{ gridColumn: "1 / -1" }}>
          <ChartCard
            title="Order Statistics"
            subtitle="Orders placed over the selected period"
            isLoading={trendLoading}
            empty={!trendLoading && trend.length === 0}
          >
            <OrdersTrendChart data={trend} />
          </ChartCard>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>
            Vendor List <span className="count">{totalItems}</span>
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div className="search-box">
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
            <button className="btn-export" onClick={handleExport} disabled={rows.length === 0}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          loadingText="Loading vendors…"
          emptyIcon="users"
          emptyTitle="No vendors found"
          emptyDescription="Vendors appear here once they exist and have products assigned to them."
          keyExtractor={(vendor) => vendor.vendorId}
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
