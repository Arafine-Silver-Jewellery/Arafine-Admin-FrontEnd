import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import { useToast } from "../../components/Toast";
import type {
  ProductSalesRow,
  ProductSalesTotals,
  ProductStockRow,
  ProductStockTotals,
  WishlistCountRow,
  WishlistCountsTotals,
} from "../../types";
import { formatDate, formatDateTime, formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
// `ak-table` lives in the UI kit.
import "../../styles/ui-kit.css";
import "./product-report.css";

type ProductTab = "all" | "stock" | "wishlist";
type ProductRange = "7d" | "30d" | "90d" | "all";
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

const DATE_OPTIONS: { value: ProductRange; label: string }[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
];

const DEFAULT_RANGE: ProductRange = "30d";

const EMPTY_SALES: ProductSalesTotals = {
  totalProducts: 0,
  totalAmount: 0,
  unitsSold: 0,
  totalStock: 0,
  outOfStock: 0,
};

const EMPTY_STOCK: ProductStockTotals = {
  totalProducts: 0,
  outOfStock: 0,
  lowStock: 0,
  totalStock: 0,
  averageStock: 0,
};

const EMPTY_WISHLIST: WishlistCountsTotals = {
  totalProducts: 0,
  totalWishes: 0,
  maxWishlist: 0,
  averageWishlist: 0,
};

function ProductCell({
  name,
  sku,
  imageUrl,
  secondary,
}: {
  name: string;
  sku: string;
  imageUrl: string | null;
  secondary?: string;
}) {
  return (
    <div className="pr-product">
      {imageUrl ? (
        <img className="pr-product-img" src={imageUrl} alt={name} />
      ) : (
        <div className="pr-product-img pr-product-img--placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
      )}
      <div className="pr-product-info">
        <span className="pr-product-name" title={name}>{name}</span>
        <span className="pr-product-sku">
          {sku}
          {secondary ? ` · ${secondary}` : ""}
        </span>
      </div>
    </div>
  );
}

export default function ProductReport() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ProductTab>("all");

  // Shared across the tabs: only one table is ever on screen, so they also
  // share the page number.
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // All Products
  const [range, setRange] = useState<ProductRange>(DEFAULT_RANGE);
  const [allSearch, setAllSearch] = useState("");
  const [allRows, setAllRows] = useState<ProductSalesRow[]>([]);
  const [allTotals, setAllTotals] = useState<ProductSalesTotals>(EMPTY_SALES);
  const [allTotal, setAllTotal] = useState(0);
  const [allTotalPages, setAllTotalPages] = useState(1);

  // Product Stock
  const [stockSort, setStockSort] = useState<StockSort>("stock_asc");
  const [stockSearch, setStockSearch] = useState("");
  const [stockRows, setStockRows] = useState<ProductStockRow[]>([]);
  const [stockTotals, setStockTotals] = useState<ProductStockTotals>(EMPTY_STOCK);
  const [stockTotal, setStockTotal] = useState(0);
  const [stockTotalPages, setStockTotalPages] = useState(1);

  // Wish Listed Products
  const [wishlistSort, setWishlistSort] = useState<WishlistSort>("count");
  const [wishlistOrder, setWishlistOrder] = useState<WishlistOrder>("desc");
  const [wishlistSearch, setWishlistSearch] = useState("");
  const [wishlistRows, setWishlistRows] = useState<WishlistCountRow[]>([]);
  const [wishlistTotals, setWishlistTotals] = useState<WishlistCountsTotals>(EMPTY_WISHLIST);
  const [wishlistTotal, setWishlistTotal] = useState(0);
  const [wishlistTotalPages, setWishlistTotalPages] = useState(1);

  // Wishlist users modal
  const [selectedProduct, setSelectedProduct] = useState<WishlistCountRow | null>(null);
  const [wishlistUsers, setWishlistUsers] = useState<WishlistUser[]>([]);
  const [wishlistUsersLoading, setWishlistUsersLoading] = useState(false);
  const [wishlistUsersPage, setWishlistUsersPage] = useState(1);
  const [wishlistUsersTotalPages, setWishlistUsersTotalPages] = useState(1);
  const [wishlistUsersTotal, setWishlistUsersTotal] = useState(0);

  // --- All Products ------------------------------------------------------
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProductSalesReport({
        page,
        limit: PAGE_SIZE,
        search: allSearch.trim() || undefined,
        range,
      });
      setAllRows(response.data || []);
      setAllTotals(response.totals ?? EMPTY_SALES);
      setAllTotal(response.pagination?.total || 0);
      setAllTotalPages(response.pagination?.totalPages || 1);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product sales");
    }
    finally {
      setLoading(false);
    }
  }, [page, allSearch, range]);

  // --- Product Stock -----------------------------------------------------
  const loadStock = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProductStockReport({
        page,
        limit: PAGE_SIZE,
        search: stockSearch.trim() || undefined,
        sort: stockSort,
      });
      setStockRows(response.data || []);
      setStockTotals(response.totals ?? EMPTY_STOCK);
      setStockTotal(response.pagination?.total || 0);
      setStockTotalPages(response.pagination?.totalPages || 1);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stock");
    }
    finally {
      setLoading(false);
    }
  }, [page, stockSearch, stockSort]);

  // --- Wish Listed Products ----------------------------------------------
  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getWishlistCountsReport({
        page,
        limit: PAGE_SIZE,
        search: wishlistSearch.trim() || undefined,
        sort: wishlistSort,
        order: wishlistOrder,
      });
      setWishlistRows(response.data || []);
      setWishlistTotals(response.totals ?? EMPTY_WISHLIST);
      setWishlistTotal(response.pagination?.total || 0);
      setWishlistTotalPages(response.pagination?.totalPages || 1);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wishlist counts");
    }
    finally {
      setLoading(false);
    }
  }, [page, wishlistSearch, wishlistSort, wishlistOrder]);

  useEffect(() => {
    if (activeTab === "stock") loadStock();
    else if (activeTab === "wishlist") loadWishlist();
    else loadAll();
  }, [activeTab, loadAll, loadStock, loadWishlist]);

  // --- Wishlist users modal ----------------------------------------------
  const loadWishlistUsers = useCallback(async (productId: string, nextPage: number) => {
    setWishlistUsersLoading(true);
    try {
      const response = await api.getWishlistUsersReport(productId, {
        page: nextPage,
        limit: 10,
      });
      setWishlistUsers(response.data || []);
      setWishlistUsersTotal(response.pagination?.total || 0);
      setWishlistUsersTotalPages(response.pagination?.totalPages || 1);
      setWishlistUsersPage(nextPage);
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    }
    finally {
      setWishlistUsersLoading(false);
    }
  }, [toast]);

  const openWishlistUsers = (row: WishlistCountRow) => {
    setSelectedProduct(row);
    setWishlistUsersPage(1);
    loadWishlistUsers(row.productId, 1);
  };

  const closeWishlistUsers = () => {
    setSelectedProduct(null);
    setWishlistUsers([]);
  };

  // --- Filters -----------------------------------------------------------
  const switchTab = (tab: ProductTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const clearFilters = () => {
    setRange(DEFAULT_RANGE);
    setAllSearch("");
    setStockSort("stock_asc");
    setStockSearch("");
    setWishlistSort("count");
    setWishlistOrder("desc");
    setWishlistSearch("");
    setPage(1);
  };

  // --- Export ------------------------------------------------------------
  const stamp = new Date().toISOString().slice(0, 10);

  const handleExport = () => {
    if (activeTab === "stock") {
      downloadCsv(
        `product-report-stock-${stamp}`,
        buildCsv(
          ["#", "Product Name", "SKU", "Last Updated", "Current Stock", "Level"],
          stockRows.map((row, index) => [
            (page - 1) * PAGE_SIZE + index + 1,
            row.name,
            row.sku,
            formatDateTime(row.updatedAt),
            row.stockQuantity,
            row.stockQuantity <= 0 ? "Out of Stock" : "Low Stock",
          ]),
        ),
      );
      return;
    }

    if (activeTab === "wishlist") {
      downloadCsv(
        `product-report-wishlist-${stamp}`,
        buildCsv(
          ["#", "Product Name", "SKU", "Last Wishlisted", "Wishlist Count"],
          wishlistRows.map((row, index) => [
            (page - 1) * PAGE_SIZE + index + 1,
            row.name,
            row.sku,
            row.lastWishlistedAt ? formatDate(row.lastWishlistedAt) : "",
            row.wishlistCount,
          ]),
        ),
      );
      return;
    }

    downloadCsv(
      `product-report-sales-${stamp}`,
      buildCsv(
        ["#", "Product Name", "SKU", "Category", "Unit Price", "Units Sold", "Total Sale", "Current Stock"],
        allRows.map((row, index) => [
          (page - 1) * PAGE_SIZE + index + 1,
          row.name,
          row.sku,
          row.categoryName ?? "",
          formatPrice(row.unitPrice),
          row.unitsSold,
          formatPrice(row.totalAmount),
          row.currentStock,
        ]),
      ),
    );
  };

  // --- Columns -----------------------------------------------------------
  const allColumns = [
    {
      key: "no",
      header: "#",
      width: "56px",
      align: "center" as const,
      render: (_row: ProductSalesRow, index: number) => (
        <span className="pr-row-no">{(page - 1) * PAGE_SIZE + index + 1}</span>
      ),
    },
    {
      key: "name",
      header: "Product",
      render: (row: ProductSalesRow) => (
        <ProductCell name={row.name} sku={row.sku} imageUrl={row.imageUrl} />
      ),
    },
    {
      key: "categoryName",
      header: "Category",
      render: (row: ProductSalesRow) => (
        <span className="pr-secondary">{row.categoryName ?? "—"}</span>
      ),
    },
    {
      key: "unitPrice",
      header: "Unit Price",
      align: "right" as const,
      render: (row: ProductSalesRow) => <span className="pr-money">{formatPrice(row.unitPrice)}</span>,
    },
    {
      key: "unitsSold",
      header: "Units Sold",
      align: "right" as const,
      render: (row: ProductSalesRow) => row.unitsSold.toLocaleString(),
    },
    {
      key: "totalAmount",
      header: "Total Sale",
      align: "right" as const,
      render: (row: ProductSalesRow) => (
        <span className="pr-amount">{formatPrice(row.totalAmount)}</span>
      ),
    },
    {
      key: "currentStock",
      header: "Stock",
      align: "right" as const,
      render: (row: ProductSalesRow) => (
        <span className={row.currentStock <= 0 ? "pr-amount--out" : "pr-money"}>
          {row.currentStock.toLocaleString()}
        </span>
      ),
    },
  ];

  const stockColumns = [
    {
      key: "no",
      header: "#",
      width: "56px",
      align: "center" as const,
      render: (_row: ProductStockRow, index: number) => (
        <span className="pr-row-no">{(page - 1) * PAGE_SIZE + index + 1}</span>
      ),
    },
    {
      key: "name",
      header: "Product",
      render: (row: ProductStockRow) => (
        <ProductCell
          name={row.name}
          sku={row.sku}
          imageUrl={row.imageUrl}
          secondary={formatPrice(row.price)}
        />
      ),
    },
    {
      key: "updatedAt",
      header: "Last Updated",
      render: (row: ProductStockRow) => (
        <span className="pr-secondary">{formatDateTime(row.updatedAt)}</span>
      ),
    },
    {
      key: "stockQuantity",
      header: "Current Stock",
      align: "right" as const,
      render: (row: ProductStockRow) => (
        <span className="pr-stock-value">
          {row.stockQuantity.toLocaleString()}
          <span className="pr-secondary"> / {row.lowStockThreshold}</span>
        </span>
      ),
    },
    {
      key: "level",
      header: "Status",
      render: (row: ProductStockRow) => (
        <span
          className={`pr-status ${
            row.stockQuantity <= 0 ? "pr-status--out" : "pr-status--low"
          }`}
        >
          {row.stockQuantity <= 0 ? "Out of Stock" : "Low Stock"}
        </span>
      ),
    },
  ];

  const wishlistColumns = [
    {
      key: "no",
      header: "#",
      width: "56px",
      align: "center" as const,
      render: (_row: WishlistCountRow, index: number) => (
        <span className="pr-row-no">{(page - 1) * PAGE_SIZE + index + 1}</span>
      ),
    },
    {
      key: "name",
      header: "Product",
      render: (row: WishlistCountRow) => (
        <ProductCell
          name={row.name}
          sku={row.sku}
          imageUrl={row.imageUrl}
          secondary={formatPrice(row.price)}
        />
      ),
    },
    {
      key: "lastWishlistedAt",
      header: "Last Wishlisted",
      render: (row: WishlistCountRow) => (
        <span className="pr-secondary">
          {row.lastWishlistedAt ? formatDate(row.lastWishlistedAt) : "—"}
        </span>
      ),
    },
    {
      key: "wishlistCount",
      header: "Wishlist Count",
      align: "right" as const,
      render: (row: WishlistCountRow) => (
        <span className="pr-wish-count">{row.wishlistCount.toLocaleString()}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "96px",
      align: "right" as const,
      render: (row: WishlistCountRow) => (
        <button
          type="button"
          className="pr-view-btn"
          onClick={(event) => {
            event.stopPropagation();
            openWishlistUsers(row);
          }}
        >
          View
        </button>
      ),
    },
  ];

  const tableTitle
    = activeTab === "all"
      ? "Products Sold"
      : activeTab === "stock"
        ? "Limited Stock Products"
        : "Wish Listed Products";

  const tableCount
    = activeTab === "all" ? allTotal : activeTab === "stock" ? stockTotal : wishlistTotal;

  const searchValue
    = activeTab === "all" ? allSearch : activeTab === "stock" ? stockSearch : wishlistSearch;

  const setSearchValue = (value: string) => {
    if (activeTab === "all") setAllSearch(value);
    else if (activeTab === "stock") setStockSearch(value);
    else setWishlistSearch(value);
    setPage(1);
  };

  const exportDisabled
    = activeTab === "all"
      ? allRows.length === 0
      : activeTab === "stock"
        ? stockRows.length === 0
        : wishlistRows.length === 0;

  return (
    <div className="product-report">
      <nav className="pr-breadcrumb">
        <span>Sales &amp; Transaction Report</span>
        <span className="pr-breadcrumb-sep">/</span>
        <span className="pr-breadcrumb-current">Product Report</span>
      </nav>

      <h1 className="pr-title">Product Report</h1>

      <div className="pr-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "all"}
          className={`pr-tab ${activeTab === "all" ? "pr-tab--active" : ""}`}
          onClick={() => switchTab("all")}
        >
          All Products
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "stock"}
          className={`pr-tab ${activeTab === "stock" ? "pr-tab--active" : ""}`}
          onClick={() => switchTab("stock")}
        >
          Product Stock
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "wishlist"}
          className={`pr-tab ${activeTab === "wishlist" ? "pr-tab--active" : ""}`}
          onClick={() => switchTab("wishlist")}
        >
          Wish Listed Products
        </button>
      </div>

      {error && (
        <div className="pr-error-card">
          <p>{error}</p>
        </div>
      )}

      {/* --- Stat cards --------------------------------------------------- */}
      {activeTab === "all" && (
        <div className="pr-stats-grid">
          <div className="pr-stat-card">
            <div className="pr-stat-icon pr-stat-icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <div className="pr-stat-body">
              <div className="pr-stat-value">{allTotals.totalProducts.toLocaleString()}</div>
              <div className="pr-stat-label">Products Sold</div>
            </div>
          </div>

          <div className="pr-stat-card">
            <div className="pr-stat-icon pr-stat-icon--green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <div className="pr-stat-body">
              <div className="pr-stat-value pr-stat-value--green">
                {formatPrice(allTotals.totalAmount, { compact: true })}
              </div>
              <div className="pr-stat-label">Total Sale</div>
            </div>
          </div>

          <div className="pr-stat-card">
            <div className="pr-stat-icon pr-stat-icon--teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div className="pr-stat-body">
              <div className="pr-stat-value">{allTotals.unitsSold.toLocaleString()}</div>
              <div className="pr-stat-label">Units Sold</div>
            </div>
          </div>

          <div className="pr-stat-card">
            <div className="pr-stat-icon pr-stat-icon--amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="pr-stat-body">
              <div className="pr-stat-value">{allTotals.outOfStock.toLocaleString()}</div>
              <div className="pr-stat-label">Out of Stock</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "stock" && (
        <div className="pr-stats-grid">
          <div className="pr-stat-card">
            <div className="pr-stat-icon pr-stat-icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="pr-stat-body">
              <div className="pr-stat-value">{stockTotals.totalProducts.toLocaleString()}</div>
              <div className="pr-stat-label">Limited Stock Products</div>
            </div>
          </div>

          <div className="pr-stat-card">
            <div className="pr-stat-icon pr-stat-icon--red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="pr-stat-body">
              <div className="pr-stat-value pr-stat-value--red">
                {stockTotals.outOfStock.toLocaleString()}
              </div>
              <div className="pr-stat-label">Out of Stock</div>
            </div>
          </div>

          <div className="pr-stat-card">
            <div className="pr-stat-icon pr-stat-icon--teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="pr-stat-body">
              <div className="pr-stat-value">{stockTotals.totalStock.toLocaleString()}</div>
              <div className="pr-stat-label">Total Stock Quantity</div>
            </div>
          </div>

          <div className="pr-stat-card">
            <div className="pr-stat-icon pr-stat-icon--amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15.5 14" />
              </svg>
            </div>
            <div className="pr-stat-body">
              <div className="pr-stat-value">{stockTotals.averageStock.toLocaleString()}</div>
              <div className="pr-stat-label">Average Stock Level</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "wishlist" && (
        <div className="pr-stats-grid">
          <div className="pr-stat-card">
            <div className="pr-stat-icon pr-stat-icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div className="pr-stat-body">
              <div className="pr-stat-value">{wishlistTotals.totalProducts.toLocaleString()}</div>
              <div className="pr-stat-label">Wishlisted Products</div>
            </div>
          </div>

          <div className="pr-stat-card">
            <div className="pr-stat-icon pr-stat-icon--green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="pr-stat-body">
              <div className="pr-stat-value">{wishlistTotals.totalWishes.toLocaleString()}</div>
              <div className="pr-stat-label">Total Wishlist Entries</div>
            </div>
          </div>

          <div className="pr-stat-card">
            <div className="pr-stat-icon pr-stat-icon--teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className="pr-stat-body">
              <div className="pr-stat-value">{wishlistTotals.maxWishlist.toLocaleString()}</div>
              <div className="pr-stat-label">Most Wishlisted Count</div>
            </div>
          </div>

          <div className="pr-stat-card">
            <div className="pr-stat-icon pr-stat-icon--amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div className="pr-stat-body">
              <div className="pr-stat-value">{wishlistTotals.averageWishlist.toLocaleString()}</div>
              <div className="pr-stat-label">Avg. Wishlist per Product</div>
            </div>
          </div>
        </div>
      )}

      {/* --- Filter bar ---------------------------------------------------- */}
      <div className="pr-filter-card">
        {activeTab === "all" && (
          <div className="pr-filter-group">
            <label htmlFor="pr-date">Date Range</label>
            <select
              id="pr-date"
              value={range}
              onChange={(event) => {
                setRange(event.target.value as ProductRange);
                setPage(1);
              }}
            >
              {DATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === "stock" && (
          <div className="pr-filter-group">
            <label htmlFor="pr-stock-sort">Sort By Stock</label>
            <select
              id="pr-stock-sort"
              value={stockSort}
              onChange={(event) => {
                setStockSort(event.target.value as StockSort);
                setPage(1);
              }}
            >
              <option value="stock_asc">Low to High</option>
              <option value="stock_desc">High to Low</option>
            </select>
          </div>
        )}

        {activeTab === "wishlist" && (
          <>
            <div className="pr-filter-group">
              <label htmlFor="pr-wishlist-sort">Sort By</label>
              <select
                id="pr-wishlist-sort"
                value={wishlistSort}
                onChange={(event) => {
                  setWishlistSort(event.target.value as WishlistSort);
                  setPage(1);
                }}
              >
                <option value="count">Wishlist Count</option>
                <option value="name">Product Name</option>
                <option value="recent">Last Wishlisted</option>
              </select>
            </div>

            <div className="pr-filter-group">
              <label htmlFor="pr-wishlist-order">Order</label>
              <select
                id="pr-wishlist-order"
                value={wishlistOrder}
                onChange={(event) => {
                  setWishlistOrder(event.target.value as WishlistOrder);
                  setPage(1);
                }}
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>
          </>
        )}

        <button type="button" className="pr-clear-btn" onClick={clearFilters}>
          Clear
        </button>

        <div className="pr-filter-actions">
          <div className="pr-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="pr-export-btn"
            onClick={handleExport}
            disabled={exportDisabled}
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

      {/* --- Table --------------------------------------------------------- */}
      <div className="pr-table-card">
        <div className="pr-table-header">
          <h2>
            {tableTitle}
            <span className="pr-table-count">{tableCount.toLocaleString()}</span>
          </h2>
        </div>

        {activeTab === "all" && (
          <DataTable
            columns={allColumns}
            data={allRows}
            loading={loading}
            loadingText="Loading products…"
            emptyIcon="box"
            emptyTitle="No products sold in this range"
            emptyDescription="Try a wider date range or a different search."
            keyExtractor={(row) => row.productId}
            currentPage={page}
            totalPages={allTotalPages}
            totalItems={allTotal}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="products"
          />
        )}

        {activeTab === "stock" && (
          <DataTable
            columns={stockColumns}
            data={stockRows}
            loading={loading}
            loadingText="Loading stock…"
            emptyIcon="box"
            emptyTitle="No low-stock products"
            emptyDescription="Every product is above its own low-stock threshold."
            keyExtractor={(row) => row.productId}
            currentPage={page}
            totalPages={stockTotalPages}
            totalItems={stockTotal}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="products"
          />
        )}

        {activeTab === "wishlist" && (
          <DataTable
            columns={wishlistColumns}
            data={wishlistRows}
            loading={loading}
            loadingText="Loading wishlist counts…"
            emptyIcon="cart"
            emptyTitle="No wishlisted products"
            emptyDescription="Products appear here once a customer adds them to their wishlist."
            keyExtractor={(row) => row.productId}
            currentPage={page}
            totalPages={wishlistTotalPages}
            totalItems={wishlistTotal}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="products"
          />
        )}
      </div>

      {/* --- Wishlist users modal ------------------------------------------ */}
      {selectedProduct && (
        <div className="pr-modal-overlay" onClick={closeWishlistUsers}>
          <div
            className="pr-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Users who wishlisted this product"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pr-modal-header">
              <div>
                <h2>Wishlisted By</h2>
                <p className="pr-modal-subtitle">
                  {selectedProduct.name} ({selectedProduct.sku})
                </p>
              </div>
              <button
                type="button"
                className="pr-modal-close"
                onClick={closeWishlistUsers}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="pr-modal-body">
              {wishlistUsersLoading ? (
                <div className="pr-modal-note">Loading users…</div>
              ) : wishlistUsers.length === 0 ? (
                <div className="pr-modal-note">No users found</div>
              ) : (
                <>
                  <div className="pr-modal-note">
                    {wishlistUsersTotal.toLocaleString()} customer
                    {wishlistUsersTotal === 1 ? "" : "s"} have this product in their wishlist
                  </div>
                  <table className="pr-users-table">
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
                          <td>{[user.firstName, user.lastName].filter(Boolean).join(" ")}</td>
                          <td>{user.mobileNumber}</td>
                          <td>{user.email || "—"}</td>
                          <td>{formatDate(user.addedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            {wishlistUsersTotalPages > 1 && (
              <div className="pr-modal-footer">
                <button
                  type="button"
                  disabled={wishlistUsersPage <= 1}
                  onClick={() => loadWishlistUsers(selectedProduct.productId, wishlistUsersPage - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {wishlistUsersPage} of {wishlistUsersTotalPages}
                </span>
                <button
                  type="button"
                  disabled={wishlistUsersPage >= wishlistUsersTotalPages}
                  onClick={() => loadWishlistUsers(selectedProduct.productId, wishlistUsersPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
