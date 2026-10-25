import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import { useToast } from "../../components/Toast";
import { ChartCard, TopSellingChart } from "../../components/dashboard";
import type { Product, ProductSalesRow, WishlistCountRow } from "../../types";
import { formatDate, formatDateTime, formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
// `ChartCard` and the recharts components live in the dashboard stylesheet;
// `ak-status` / `ak-table` live in the UI kit.
import "../../styles/dashboard.css";
import "../../styles/ui-kit.css";
import "../../styles/reports.css";

type ProductTab = "all" | "stock" | "wishlist";
type DashboardRange = "7d" | "30d" | "90d" | "all";
type StockSort = "stock_asc" | "stock_desc";
type WishlistSort = "count" | "name" | "recent";
type WishlistOrder = "asc" | "desc";

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
  // The limited-stock endpoint sorts by stock ascending and doesn't take a
  // sort direction, so the direction is applied client-side to the page.
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

  // Switching tabs resets each list to page 1 so a stale page number from a
  // differently-sized list doesn't render an empty page.
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
    return { totalAmountPaise, unitsSold, totalStock };
  }, [allRows]);

  // The chart shows the top sellers on the current page, in the same shape
  // the shared `TopSellingChart` expects.
  const topSellingItems = useMemo(
    () =>
      [...allRows]
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 8)
        .map((row) => ({
          productId: row.productId,
          name: row.name,
          sku: row.sku,
          unitsSold: row.unitsSold,
          revenuePaise: row.totalAmountPaise,
          imageUrl: row.imageUrl,
        })),
    [allRows],
  );

  // --- Export ------------------------------------------------------------
  function handleExportAll() {
    downloadCsv(
      `product-report-all-${new Date().toISOString().slice(0, 10)}`,
      buildCsv(
        [
          "SL",
          "Product Name",
          "SKU",
          "Category",
          "Unit Price",
          "Total Amount Sold",
          "Total Quantity Sold",
          "Gross Quantity",
          "Returned Quantity",
          "Average Product Value",
          "Current Stock",
          "Average Rating",
          "Review Count",
        ],
        allRows.map((row, index) => [
          (allPage - 1) * PAGE_SIZE + index + 1,
          row.name,
          row.sku,
          row.categoryName ?? "",
          formatPrice(row.unitPricePaise),
          formatPrice(row.totalAmountPaise),
          row.unitsSold,
          row.grossQuantity,
          row.returnedQuantity,
          formatPrice(row.averageProductValuePaise),
          row.currentStock,
          row.averageRating,
          row.reviewCount,
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
              className="product-img"
              style={{
                background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              📦
            </div>
          )}
          <div className="vendor-info">
            <span className="product-name">{row.name}</span>
            <span className="vendor-email">
              {row.sku}
              {row.categoryName ? ` · ${row.categoryName}` : ""}
            </span>
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
    {
      key: "averageProductValuePaise",
      header: "Average Product Value",
      align: "right" as const,
      render: (row: ProductSalesRow) => formatPrice(row.averageProductValuePaise),
    },
    {
      key: "currentStock",
      header: "Current Stock",
      align: "right" as const,
      render: (row: ProductSalesRow) => row.currentStock,
    },
    {
      key: "averageRating",
      header: "Average Ratings",
      render: (row: ProductSalesRow) => (
        <span className="rating">
          ⭐ {row.averageRating} ({row.reviewCount})
        </span>
      ),
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
  ];

  return (
    <div className="reports-container">
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

      {error && (
        <div className="report-card" style={{ borderLeft: "4px solid #f44336" }}>
          <p style={{ margin: 0, color: "#f44336" }}>{error}</p>
        </div>
      )}

      {activeTab === "all" && (
        <>
          <div className="filter-card">
            <h3>Filter Data</h3>
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="all-date">Date</label>
                <select
                  id="all-date"
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
              </div>
              <button
                className="btn-filter-secondary"
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
          </div>

          <div className="stats-grid product-stats">
            <div className="stat-card">
              <div className="stat-icon yellow">📦</div>
              <div className="stat-content">
                <h2>{allTotal}</h2>
                <p>Total Product</p>
                <div className="stat-breakdown">
                  <div className="breakdown-item blue">
                    <span>{allStats.totalStock}</span>
                    <label>In Stock</label>
                  </div>
                  <div className="breakdown-item green">
                    <span>{allStats.unitsSold}</span>
                    <label>Units Sold</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">🛒</div>
              <div className="stat-content">
                <h2>{formatPrice(allStats.totalAmountPaise, { compact: true })}</h2>
                <p>Total Amount Sold</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">🏷️</div>
              <div className="stat-content">
                <h2>{allStats.unitsSold.toLocaleString()}</h2>
                <p>Total Quantity Sold</p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <ChartCard
              title="Product Statistics"
              subtitle="Top sellers by units sold"
              isLoading={loading}
              empty={!loading && topSellingItems.length === 0}
            >
              <TopSellingChart items={topSellingItems} />
            </ChartCard>
          </div>

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
    </div>
  );
}

/**
 * Classifies a product's stock level against its own threshold. The backend's
 * limited-stock query already filters to `stockQuantity <= lowStockThreshold`,
 * so a product in this list is either at zero or running low.
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
