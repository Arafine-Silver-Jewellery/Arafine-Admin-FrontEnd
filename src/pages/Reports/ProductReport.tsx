import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import { useToast } from "../../components/Toast";
import type { Product, ProductSalesRow, WishlistCountRow } from "../../types";
import { formatDate, formatDateTime, formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
import "../../styles/dashboard.css";
import "../../styles/ui-kit.css";
import "../../styles/reports.css";

type ProductTab = "all" | "stock" | "wishlist";
type DashboardRange = "7d" | "30d" | "90d" | "all";
type StockSort = "stock_asc" | "stock_desc";
type WishlistSort = "count" | "name" | "recent";
type WishlistOrder = "asc" | "desc";

interface WishlistUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  mobileNumber: string;
  addedAt: string;
}

const PAGE_SIZE = 20;

const DATE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

const DEFAULT_RANGE: DashboardRange = "30d";

export default function ProductReport() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ProductTab>("all");

  // All tab state
  const [range, setRange] = useState<DashboardRange>(DEFAULT_RANGE);
  const [search, setSearch] = useState("");
  const [allRows, setAllRows] = useState<ProductSalesRow[]>([]);
  const [allTotal, setAllTotal] = useState(0);
  const [allPage, setAllPage] = useState(1);
  const [allTotalPages, setAllTotalPages] = useState(1);

  // Stock tab state
  const [stockSort, setStockSort] = useState<StockSort>("stock_asc");
  const [stockSearch, setStockSearch] = useState("");
  const [stockRows, setStockRows] = useState<Product[]>([]);
  const [stockTotal, setStockTotal] = useState(0);
  const [stockPage, setStockPage] = useState(1);
  const [stockTotalPages, setStockTotalPages] = useState(1);

  // Wishlist tab state
  const [wishlistSort, setWishlistSort] = useState<WishlistSort>("count");
  const [wishlistOrder, setWishlistOrder] = useState<WishlistOrder>("desc");
  const [wishlistSearch, setWishlistSearch] = useState("");
  const [wishlistRows, setWishlistRows] = useState<WishlistCountRow[]>([]);
  const [wishlistTotal, setWishlistTotal] = useState(0);
  const [wishlistPage, setWishlistPage] = useState(1);
  const [wishlistTotalPages, setWishlistTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wishlist users modal state
  const [selectedProduct, setSelectedProduct] = useState<WishlistCountRow | null>(null);
  const [wishlistUsers, setWishlistUsers] = useState<WishlistUser[]>([]);
  const [wishlistUsersLoading, setWishlistUsersLoading] = useState(false);
  const [wishlistUsersPage, setWishlistUsersPage] = useState(1);
  const [wishlistUsersTotalPages, setWishlistUsersTotalPages] = useState(1);
  const [wishlistUsersTotal, setWishlistUsersTotal] = useState(0);

  // --- All tab -----------------------------------------------------------
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProductSalesReport({
        page: allPage,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        range,
      });
      setAllRows(response.data || []);
      setAllTotal(response.pagination?.total || 0);
      setAllTotalPages(response.pagination?.totalPages || 1);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product sales");
    }
    finally {
      setLoading(false);
    }
  }, [allPage, search, range]);

  // --- Stock tab ---------------------------------------------------------
  const loadStock = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getLimitedStockProducts({
        page: stockPage,
        limit: PAGE_SIZE,
        search: stockSearch.trim() || undefined,
      });
      const rows = response.data || [];
      const sorted = [...rows].sort((a, b) =>
        stockSort === "stock_asc"
          ? a.stockQuantity - b.stockQuantity
          : b.stockQuantity - a.stockQuantity,
      );
      setStockRows(sorted);
      setStockTotal(response.pagination?.total || 0);
      setStockTotalPages(response.pagination?.totalPages || 1);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stock");
    }
    finally {
      setLoading(false);
    }
  }, [stockPage, stockSearch, stockSort]);

  // --- Wishlist tab ------------------------------------------------------
  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getWishlistCountsReport({
        page: wishlistPage,
        limit: PAGE_SIZE,
        search: wishlistSearch.trim() || undefined,
        sort: wishlistSort,
        order: wishlistOrder,
      });
      setWishlistRows(response.data || []);
      setWishlistTotal(response.pagination?.total || 0);
      setWishlistTotalPages(response.pagination?.totalPages || 1);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wishlist counts");
    }
    finally {
      setLoading(false);
    }
  }, [wishlistPage, wishlistSearch, wishlistSort, wishlistOrder]);

  // --- Wishlist users modal -------------------------------------------
  const loadWishlistUsers = useCallback(async (productId: string, page: number = 1) => {
    setWishlistUsersLoading(true);
    try {
      const response = await api.getWishlistUsersReport(productId, {
        page,
        limit: 10,
      });
      setWishlistUsers(response.data || []);
      setWishlistUsersTotal(response.pagination?.total || 0);
      setWishlistUsersTotalPages(response.pagination?.totalPages || 1);
      setWishlistUsersPage(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setWishlistUsersLoading(false);
    }
  }, [toast]);

  const handleViewWishlistUsers = (row: WishlistCountRow) => {
    setSelectedProduct(row);
    setWishlistUsersPage(1);
    loadWishlistUsers(row.productId, 1);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setWishlistUsers([]);
  };

  useEffect(() => {
    setAllPage(1);
    setStockPage(1);
    setWishlistPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "all") loadAll();
    else if (activeTab === "stock") loadStock();
    else loadWishlist();
  }, [activeTab, loadAll, loadStock, loadWishlist]);

  // --- Derived values ----------------------------------------------------
  const allStats = useMemo(() => {
    const totalAmountPaise = allRows.reduce((sum, r) => sum + r.totalAmountPaise, 0);
    const unitsSold = allRows.reduce((sum, r) => sum + r.unitsSold, 0);
    const totalStock = allRows.reduce((sum, r) => sum + r.currentStock, 0);
    const outOfStock = allRows.filter((r) => r.currentStock <= 0).length;
    return { totalAmountPaise, unitsSold, totalStock, outOfStock };
  }, [allRows]);

  // Top sellers for the Product Statistics section
  const topSellers = useMemo(
    () =>
      [...allRows]
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 6),
    [allRows],
  );

  // Stock alerts - out of stock and low stock products
  const stockAlerts = useMemo(() => {
    return allRows
      .filter((r) => r.currentStock <= 10)
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 5)
      .map((r) => ({
        ...r,
        status: r.currentStock <= 0 ? "out" : "low",
        stockLeft: r.currentStock,
      }));
  }, [allRows]);

  // --- Export ------------------------------------------------------------
  function handleExportAll() {
    downloadCsv(
      `product-report-all-${new Date().toISOString().slice(0, 10)}`,
      buildCsv(
        [
          "SL",
          "Product Name",
          "SKU",
          "Unit Price",
          "Total Amount Sold",
          "Total Quantity Sold",
        ],
        allRows.map((row, index) => [
          (allPage - 1) * PAGE_SIZE + index + 1,
          row.name,
          row.sku,
          formatPrice(row.unitPricePaise),
          formatPrice(row.totalAmountPaise),
          row.unitsSold,
        ]),
      ),
    );
    toast.success(`Exported ${allRows.length} product${allRows.length === 1 ? "" : "s"}`);
  }

  function handleExportStock() {
    downloadCsv(
      `product-report-stock-${new Date().toISOString().slice(0, 10)}`,
      buildCsv(
        ["SL", "Product Name", "SKU", "Last Updated Stock", "Current Stock", "Status"],
        stockRows.map((product, index) => [
          (stockPage - 1) * PAGE_SIZE + index + 1,
          product.name,
          product.sku,
          formatDateTime(product.updatedAt),
          product.stockQuantity,
          stockStatus(product).label,
        ]),
      ),
    );
    toast.success(`Exported ${stockRows.length} stock row${stockRows.length === 1 ? "" : "s"}`);
  }

  function handleExportWishlist() {
    downloadCsv(
      `product-report-wishlist-${new Date().toISOString().slice(0, 10)}`,
      buildCsv(
        ["SL", "Product Name", "SKU", "Date", "Total In Wishlist"],
        wishlistRows.map((row, index) => [
          (wishlistPage - 1) * PAGE_SIZE + index + 1,
          row.name,
          row.sku,
          row.lastWishlistedAt ? formatDate(row.lastWishlistedAt) : "—",
          row.wishlistCount,
        ]),
      ),
    );
    toast.success(
      `Exported ${wishlistRows.length} wishlist row${wishlistRows.length === 1 ? "" : "s"}`,
    );
  }

  // --- Column definitions ------------------------------------------------
  const allColumns = [
    {
      key: "sl",
      header: "SL",
      width: "56px",
      align: "center" as const,
      render: (_row: ProductSalesRow, index: number) =>
        (allPage - 1) * PAGE_SIZE + index + 1,
    },
    {
      key: "name",
      header: "Product Name",
      render: (row: ProductSalesRow) => (
        <div className="product-cell">
          {row.imageUrl ? (
            <img className="product-img" src={row.imageUrl} alt={row.name} />
          ) : (
            <div
              className="product-img product-img-placeholder"
            >
              📦
            </div>
          )}
          <div className="vendor-info">
            <span className="product-name">{row.name}</span>
            <span className="vendor-email">{row.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: "unitPricePaise",
      header: "Unit Price",
      align: "right" as const,
      render: (row: ProductSalesRow) => formatPrice(row.unitPricePaise),
    },
    {
      key: "totalAmountPaise",
      header: "Total Amount Sold",
      align: "right" as const,
      render: (row: ProductSalesRow) => formatPrice(row.totalAmountPaise),
    },
    {
      key: "unitsSold",
      header: "Total Quantity Sold",
      align: "right" as const,
      render: (row: ProductSalesRow) => row.unitsSold,
    },
  ];

  const stockColumns = [
    {
      key: "sl",
      header: "SL",
      width: "56px",
      align: "center" as const,
      render: (_row: Product, index: number) =>
        (stockPage - 1) * PAGE_SIZE + index + 1,
    },
    {
      key: "name",
      header: "Product Name",
      render: (product: Product) => (
        <div className="vendor-info">
          <span className="product-name">{product.name}</span>
          <span className="vendor-email">{product.sku}</span>
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Last Updated Stock",
      render: (product: Product) => formatDateTime(product.updatedAt),
    },
    {
      key: "stockQuantity",
      header: "Current Stock",
      align: "right" as const,
      render: (product: Product) => product.stockQuantity,
    },
    {
      key: "status",
      header: "Status",
      render: (product: Product) => {
        const status = stockStatus(product);
        return <span className={`status-text ${status.cssClass}`}>{status.label}</span>;
      },
    },
  ];

  const wishlistColumns = [
    {
      key: "sl",
      header: "SL",
      width: "56px",
      align: "center" as const,
      render: (_row: WishlistCountRow, index: number) =>
        (wishlistPage - 1) * PAGE_SIZE + index + 1,
    },
    {
      key: "name",
      header: "Product Name",
      render: (row: WishlistCountRow) => (
        <div className="vendor-info">
          <span className="product-name">{row.name}</span>
          <span className="vendor-email">
            {row.sku} · {formatPrice(row.pricePaise)}
          </span>
        </div>
      ),
    },
    {
      key: "lastWishlistedAt",
      header: "Date",
      render: (row: WishlistCountRow) =>
        row.lastWishlistedAt ? formatDate(row.lastWishlistedAt) : "—",
    },
    {
      key: "wishlistCount",
      header: "Total In Wishlist",
      align: "right" as const,
      render: (row: WishlistCountRow) => row.wishlistCount,
    },
    {
      key: "actions",
      header: "Actions",
      width: "100px",
      align: "center" as const,
      render: (row: WishlistCountRow) => (
        <button
          className="btn-view-users"
          onClick={(e) => {
            e.stopPropagation();
            handleViewWishlistUsers(row);
          }}
          title="View users"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          View
        </button>
      ),
    },
  ];

  return (
    <div className="reports-container">
      {/* Tabs and Filter Row */}
      <div className="product-report-header">
        <div className="report-tabs">
          <button
            className={activeTab === "all" ? "active" : ""}
            onClick={() => setActiveTab("all")}
          >
            All Products
          </button>
          <button
            className={activeTab === "stock" ? "active" : ""}
            onClick={() => setActiveTab("stock")}
          >
            Product Stock
          </button>
          <button
            className={activeTab === "wishlist" ? "active" : ""}
            onClick={() => setActiveTab("wishlist")}
          >
            Wish Listed Products
          </button>
        </div>

        {activeTab === "all" && (
          <div className="product-report-filter-inline">
            <span className="filter-label">Filter Data</span>
            <span className="filter-date-label">DATE</span>
            <select
              value={range}
              onChange={(e) => {
                setRange(e.target.value as DashboardRange);
                setAllPage(1);
              }}
            >
              {DATE_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <button
              className="btn-reset"
              type="button"
              onClick={() => {
                setRange(DEFAULT_RANGE);
                setSearch("");
                setAllPage(1);
              }}
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="report-card" style={{ borderLeft: "4px solid #f44336" }}>
          <p style={{ margin: 0, color: "#f44336" }}>{error}</p>
        </div>
      )}

      {activeTab === "all" && (
        <>
          {/* Stats Grid - 2x2 layout */}
          <div className="product-report-stats-grid">
            {/* Total Product Card */}
            <div className="product-report-stat-card">
              <div className="product-report-stat-icon yellow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <div className="product-report-stat-content">
                <h2>{allTotal}</h2>
                <p>Total Product</p>
                <div className="product-report-stat-breakdown">
                  <div className="product-report-breakdown-item blue">
                    <span>{allStats.totalStock}</span>
                    <label>In Stock</label>
                  </div>
                  <div className="product-report-breakdown-item green">
                    <span>{allStats.unitsSold}</span>
                    <label>Units Sold</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Amount Sold Card */}
            <div className="product-report-stat-card">
              <div className="product-report-stat-icon green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <div className="product-report-stat-content">
                <h2>{formatPrice(allStats.totalAmountPaise, { compact: true })}</h2>
                <p>Total Amount Sold</p>
              </div>
            </div>

            {/* Total Quantity Sold Card */}
            <div className="product-report-stat-card">
              <div className="product-report-stat-icon teal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <div className="product-report-stat-content">
                <h2>{allStats.unitsSold.toLocaleString()}</h2>
                <p>Total Quantity Sold</p>
              </div>
            </div>

            {/* Out of Stock Card */}
            <div className="product-report-stat-card">
              <div className="product-report-stat-icon orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="product-report-stat-content">
                <h2>{allStats.outOfStock}</h2>
                <p>Out of Stock</p>
              </div>
            </div>
          </div>

          {/* Product Statistics & Stock Alerts Row */}
          <div className="product-report-cards-row">
            {/* Product Statistics */}
            <div className="product-report-card">
              <h3>Product Statistics</h3>
              <p className="product-report-card-subtitle">Top sellers by units sold</p>
              <div className="product-stats-list">
                {loading ? (
                  <div className="product-stats-loading">Loading...</div>
                ) : topSellers.length === 0 ? (
                  <div className="product-stats-empty">No sales data available</div>
                ) : (
                  topSellers.map((item) => (
                    <div key={item.productId} className="product-stats-item">
                      <div className="product-stats-info">
                        <span className="product-stats-name">{item.name}</span>
                        <span className="product-stats-sku">{item.sku}</span>
                      </div>
                      <div className="product-stats-values">
                        <span className="product-stats-units">{item.unitsSold} units</span>
                        <span className="product-stats-revenue">{formatPrice(item.totalAmountPaise, { compact: true })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Stock Alerts */}
            <div className="product-report-card">
              <h3>Stock Alerts</h3>
              <p className="product-report-card-subtitle">Out of stock and low stock products</p>
              <div className="stock-alerts-list">
                {loading ? (
                  <div className="product-stats-loading">Loading...</div>
                ) : stockAlerts.length === 0 ? (
                  <div className="product-stats-empty">All products are well-stocked</div>
                ) : (
                  stockAlerts.map((item) => (
                    <div key={item.productId} className="stock-alert-item">
                      <div className="stock-alert-info">
                        <span className="stock-alert-name">{item.name}</span>
                        <span className="stock-alert-sku">{item.sku}</span>
                      </div>
                      <span className={`stock-alert-status ${item.status === "out" ? "out-of-stock" : "low-stock"}`}>
                        {item.status === "out" ? "Out of stock" : `${item.stockLeft} left`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="table-card">
            <div className="table-header">
              <h3>
                Total Products <span className="count">{allTotal}</span>
              </h3>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div className="search-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search product name"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setAllPage(1);
                    }}
                  />
                </div>
                <button
                  className="btn-export"
                  type="button"
                  onClick={handleExportAll}
                  disabled={allRows.length === 0}
                >
                  Export
                </button>
              </div>
            </div>

            <DataTable
              columns={allColumns}
              data={allRows}
              loading={loading}
              loadingText="Loading products…"
              emptyIcon="box"
              emptyTitle="No products match your search"
              emptyDescription="Try a different name or widen the date range."
              keyExtractor={(row) => row.productId}
              currentPage={allPage}
              totalPages={allTotalPages}
              totalItems={allTotal}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setAllPage}
            />
          </div>
        </>
      )}

      {activeTab === "stock" && (
        <>
          <div className="filter-card">
            <h3>Filter Data</h3>
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="stock-sort">Sort by stock</label>
                <select
                  id="stock-sort"
                  value={stockSort}
                  onChange={(e) => {
                    setStockSort(e.target.value as StockSort);
                    setStockPage(1);
                  }}
                >
                  <option value="stock_asc">Stock: low to high</option>
                  <option value="stock_desc">Stock: high to low</option>
                </select>
              </div>
              <button
                className="btn-filter-secondary"
                type="button"
                onClick={() => {
                  setStockSort("stock_asc");
                  setStockSearch("");
                  setStockPage(1);
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>
                Limited Stock Products <span className="count">{stockTotal}</span>
              </h3>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div className="search-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search Product Name"
                    value={stockSearch}
                    onChange={(e) => {
                      setStockSearch(e.target.value);
                      setStockPage(1);
                    }}
                  />
                </div>
                <button
                  className="btn-export"
                  type="button"
                  onClick={handleExportStock}
                  disabled={stockRows.length === 0}
                >
                  Export
                </button>
              </div>
            </div>

            <DataTable
              columns={stockColumns}
              data={stockRows}
              loading={loading}
              loadingText="Loading stock…"
              emptyIcon="box"
              emptyTitle="No low-stock products"
              emptyDescription="Every product is above its low-stock threshold."
              keyExtractor={(product) => product.id}
              currentPage={stockPage}
              totalPages={stockTotalPages}
              totalItems={stockTotal}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setStockPage}
            />
          </div>
        </>
      )}

      {activeTab === "wishlist" && (
        <>
          <div className="filter-card">
            <h3>Filter Data</h3>
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="wishlist-sort">Sort by</label>
                <select
                  id="wishlist-sort"
                  value={wishlistSort}
                  onChange={(e) => {
                    setWishlistSort(e.target.value as WishlistSort);
                    setWishlistPage(1);
                  }}
                >
                  <option value="count">Wishlist count</option>
                  <option value="name">Product name</option>
                  <option value="recent">Last wishlisted</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="wishlist-order">Order</label>
                <select
                  id="wishlist-order"
                  value={wishlistOrder}
                  onChange={(e) => {
                    setWishlistOrder(e.target.value as WishlistOrder);
                    setWishlistPage(1);
                  }}
                >
                  <option value="desc">High to low</option>
                  <option value="asc">Low to high</option>
                </select>
              </div>
              <button
                className="btn-filter-secondary"
                type="button"
                onClick={() => {
                  setWishlistSort("count");
                  setWishlistOrder("desc");
                  setWishlistSearch("");
                  setWishlistPage(1);
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>
                Wish Listed Products <span className="count">{wishlistTotal}</span>
              </h3>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div className="search-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search Product Name"
                    value={wishlistSearch}
                    onChange={(e) => {
                      setWishlistSearch(e.target.value);
                      setWishlistPage(1);
                    }}
                  />
                </div>
                <button
                  className="btn-export"
                  type="button"
                  onClick={handleExportWishlist}
                  disabled={wishlistRows.length === 0}
                >
                  Export
                </button>
              </div>
            </div>

            <DataTable
              columns={wishlistColumns}
              data={wishlistRows}
              loading={loading}
              loadingText="Loading wishlist counts…"
              emptyIcon="cart"
              emptyTitle="No wishlisted products"
              emptyDescription="Products appear here once a customer adds them to their wishlist."
              keyExtractor={(row) => row.productId}
              currentPage={wishlistPage}
              totalPages={wishlistTotalPages}
              totalItems={wishlistTotal}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setWishlistPage}
            />
          </div>
        </>
      )}

      {/* Wishlist Users Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content wishlist-users-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Users who wishlisted this product</h2>
                <p className="modal-subtitle">
                  {selectedProduct.name} ({selectedProduct.sku})
                </p>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {wishlistUsersLoading ? (
                <div className="modal-loading">Loading users...</div>
              ) : wishlistUsers.length === 0 ? (
                <div className="modal-empty">No users found</div>
              ) : (
                <>
                  <div className="wishlist-users-count">
                    {wishlistUsersTotal} user{wishlistUsersTotal !== 1 ? "s" : ""} have this product in their wishlist
                  </div>
                  <table className="wishlist-users-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Email</th>
                        <th>Added On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wishlistUsers.map((user) => (
                        <tr key={user.userId}>
                          <td>{user.firstName} {user.lastName}</td>
                          <td>{user.mobileNumber}</td>
                          <td>{user.email || "—"}</td>
                          <td>{formatDate(user.addedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {wishlistUsersTotalPages > 1 && (
                    <div className="modal-pagination">
                      <button
                        disabled={wishlistUsersPage <= 1}
                        onClick={() => {
                          const newPage = wishlistUsersPage - 1;
                          loadWishlistUsers(selectedProduct.productId, newPage);
                        }}
                      >
                        Previous
                      </button>
                      <span>Page {wishlistUsersPage} of {wishlistUsersTotalPages}</span>
                      <button
                        disabled={wishlistUsersPage >= wishlistUsersTotalPages}
                        onClick={() => {
                          const newPage = wishlistUsersPage + 1;
                          loadWishlistUsers(selectedProduct.productId, newPage);
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Classifies a product's stock level against its own threshold.
 */
function stockStatus(product: Product): { label: string; cssClass: string } {
  if (product.stockQuantity <= 0) {
    return { label: "Out of Stock", cssClass: "out-of-stock" };
  }
  if (product.stockQuantity <= product.lowStockThreshold) {
    return { label: "Low Stock", cssClass: "low-stock" };
  }
  return { label: "In Stock", cssClass: "in-stock" };
}
