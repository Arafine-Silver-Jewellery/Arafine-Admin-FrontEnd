import { useMemo, useState } from "react";
import { useToast } from "../../components/Toast";
import "../../styles/reports.css";

type ProductTab = "all" | "stock" | "wishlist";
type DateFilter = "all" | "thisYear" | "thisMonth" | "thisWeek" | "today";
type StockSort = "stock_asc" | "stock_desc";
type WishlistSort = "wishlist_asc" | "wishlist_desc";

interface ProductData {
  sl: number;
  productName: string;
  productUnitPrice: number;
  totalAmountSold: number;
  totalQuantitySold: number;
  averageProductValue: number;
  currentStockAmount: number;
  averageRatings: number;
  reviewCount: number;
}

interface StockData {
  sl: number;
  productName: string;
  lastUpdatedStock: string;
  currentStock: number;
  status: "in_stock" | "out_of_stock" | "low_stock";
}

interface WishlistData {
  sl: number;
  productName: string;
  date: string;
  totalInWishlist: number;
}

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "thisYear", label: "This Year" },
  { value: "thisMonth", label: "This Month" },
  { value: "thisWeek", label: "This Week" },
  { value: "today", label: "Today" },
];

const DEFAULT_DATE: DateFilter = "thisYear";

const CATEGORY_OPTIONS = [
  "All category",
  "Grocery & Staples",
  "Dairy Products",
  "Snacks & Beverages",
];

const mockProducts: ProductData[] = [
  { sl: 1, productName: "Luna Butterfly Cluster Studs", productUnitPrice: 4318.80, totalAmountSold: 0, totalQuantitySold: 0, averageProductValue: 0, currentStockAmount: 1, averageRatings: 0, reviewCount: 0 },
  { sl: 2, productName: "Aria Split Shank Solitaire", productUnitPrice: 4078.80, totalAmountSold: 0, totalQuantitySold: 0, averageProductValue: 0, currentStockAmount: 0, averageRatings: 0, reviewCount: 0 },
  { sl: 3, productName: "Sunset Sorbet Crisscross Ring", productUnitPrice: 4078.80, totalAmountSold: 0, totalQuantitySold: 0, averageProductValue: 0, currentStockAmount: 0, averageRatings: 0, reviewCount: 0 },
  { sl: 4, productName: "Pearl Whisper Baguette Ring", productUnitPrice: 3958.80, totalAmountSold: 0, totalQuantitySold: 0, averageProductValue: 0, currentStockAmount: 1, averageRatings: 0, reviewCount: 0 },
  { sl: 5, productName: "Meadow Glow Sideways Ring", productUnitPrice: 3598.80, totalAmountSold: 0, totalQuantitySold: 0, averageProductValue: 0, currentStockAmount: 1, averageRatings: 0, reviewCount: 0 },
  { sl: 6, productName: "Premium Basmati Rice 5kg", productUnitPrice: 450, totalAmountSold: 125000, totalQuantitySold: 278, averageProductValue: 449.64, currentStockAmount: 150, averageRatings: 4.5, reviewCount: 45 },
  { sl: 7, productName: "Organic Coconut Oil 1L", productUnitPrice: 380, totalAmountSold: 98500, totalQuantitySold: 259, averageProductValue: 380.31, currentStockAmount: 85, averageRatings: 4.3, reviewCount: 32 },
  { sl: 8, productName: "Fresh Farm Eggs (30 pcs)", productUnitPrice: 210, totalAmountSold: 75200, totalQuantitySold: 358, averageProductValue: 210.06, currentStockAmount: 200, averageRatings: 4.7, reviewCount: 89 },
];

const mockStockData: StockData[] = [
  { sl: 1, productName: "The Imperial Garden Pendant", lastUpdatedStock: "26 Sep 2026, 06:04:06 pm", currentStock: 0, status: "out_of_stock" },
  { sl: 2, productName: "Bow Heart Pendant and Chain", lastUpdatedStock: "26 Sep 2026, 06:19:40 pm", currentStock: 0, status: "out_of_stock" },
  { sl: 3, productName: "Fairy Star Drop Pendant", lastUpdatedStock: "26 Sep 2026, 06:16:24 pm", currentStock: 0, status: "out_of_stock" },
  { sl: 4, productName: "Reindeer and Star Studs", lastUpdatedStock: "26 Sep 2026, 06:19:23 pm", currentStock: 0, status: "out_of_stock" },
  { sl: 5, productName: "Juste Nail Pendant and Chain", lastUpdatedStock: "19 Aug 2026, 11:07:25 am", currentStock: 0, status: "out_of_stock" },
  { sl: 6, productName: "Leaf Pendant and Chain", lastUpdatedStock: "12 Aug 2026, 08:08:33 pm", currentStock: 0, status: "out_of_stock" },
  { sl: 7, productName: "Bunny Crescent Pendant", lastUpdatedStock: "26 Sep 2026, 06:21:20 pm", currentStock: 0, status: "out_of_stock" },
  { sl: 8, productName: "Ballerina Pendant and Chain", lastUpdatedStock: "26 Sep 2026, 06:20:57 pm", currentStock: 0, status: "out_of_stock" },
];

const mockWishlistData: WishlistData[] = [
  { sl: 1, productName: "Hearts in Bloom Ring", date: "27 Jul 2026", totalInWishlist: 0 },
  { sl: 2, productName: "Seraphine Solitaire", date: "07 Aug 2026", totalInWishlist: 0 },
  { sl: 3, productName: "Eternal Twist Radiant", date: "06 Aug 2026", totalInWishlist: 0 },
  { sl: 4, productName: "Wavelet Solitaire Ring", date: "06 Aug 2026", totalInWishlist: 0 },
  { sl: 5, productName: "Celeste Solitaire Silver", date: "05 Aug 2026", totalInWishlist: 0 },
  { sl: 6, productName: "Rosette Bloom Silver", date: "05 Aug 2026", totalInWishlist: 0 },
  { sl: 7, productName: "Celestine Grand Solitaire", date: "31 Jul 2026", totalInWishlist: 0 },
  { sl: 8, productName: "Seraphine Solitaire", date: "31 Jul 2026", totalInWishlist: 0 },
];

// Stats for the All-tab cards. The mock data shows only 3 of the 8 products have
// non-zero sales, so we hard-code the rolled-up numbers from the mock.
const totalProducts = 8;
const totalProductSale = 3;
const rejected = 0;
const pending = 0;
const active = 8;
const totalDiscountGiven = 3771.48;

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map(row => row.map(escapeCsvCell).join(",")),
  ];
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ProductReport() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ProductTab>("all");

  // All tab state
  const [allDateFilter, setAllDateFilter] = useState<DateFilter>(DEFAULT_DATE);
  const [allSearch, setAllSearch] = useState("");

  // Stock tab state
  const [stockCategory, setStockCategory] = useState("All category");
  const [stockSort, setStockSort] = useState<StockSort>("stock_asc");
  const [stockSearch, setStockSearch] = useState("");

  // Wishlist tab state
  const [wishlistSort, setWishlistSort] = useState<WishlistSort>("wishlist_asc");
  const [wishlistSearch, setWishlistSearch] = useState("");

  const filteredAll = useMemo(() => {
    const q = allSearch.trim().toLowerCase();
    if (!q) return mockProducts;
    return mockProducts.filter(p => p.productName.toLowerCase().includes(q));
  }, [allSearch]);

  const filteredStock = useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    const list = q
      ? mockStockData.filter(p => p.productName.toLowerCase().includes(q))
      : [...mockStockData];
    list.sort((a, b) => (stockSort === "stock_asc" ? a.currentStock - b.currentStock : b.currentStock - a.currentStock));
    return list;
  }, [stockSearch, stockSort]);

  const filteredWishlist = useMemo(() => {
    const q = wishlistSearch.trim().toLowerCase();
    const list = q
      ? mockWishlistData.filter(p => p.productName.toLowerCase().includes(q))
      : [...mockWishlistData];
    list.sort((a, b) => (wishlistSort === "wishlist_asc" ? a.totalInWishlist - b.totalInWishlist : b.totalInWishlist - a.totalInWishlist));
    return list;
  }, [wishlistSearch, wishlistSort]);

  function handleResetAll() {
    setAllDateFilter(DEFAULT_DATE);
    setAllSearch("");
  }

  function handleResetStock() {
    setStockCategory("All category");
    setStockSort("stock_asc");
    setStockSearch("");
  }

  function handleResetWishlist() {
    setWishlistSort("wishlist_asc");
    setWishlistSearch("");
  }

  function handleExportAll() {
    downloadCsv(
      "product-report-all.csv",
      ["SL", "Product Name", "Unit Price (INR)", "Total Amount Sold (INR)", "Total Quantity Sold", "Average Product Value (INR)", "Current Stock", "Average Rating", "Review Count"],
      filteredAll.map(p => [
        p.sl,
        p.productName,
        p.productUnitPrice,
        p.totalAmountSold,
        p.totalQuantitySold,
        p.averageProductValue,
        p.currentStockAmount,
        p.averageRatings,
        p.reviewCount,
      ]),
    );
    toast.success(`Exported ${filteredAll.length} product${filteredAll.length === 1 ? "" : "s"}`);
  }

  function handleExportStock() {
    downloadCsv(
      "product-report-stock.csv",
      ["SL", "Product Name", "Last Updated Stock", "Current Stock", "Status"],
      filteredStock.map(p => [
        p.sl,
        p.productName,
        p.lastUpdatedStock,
        p.currentStock,
        p.status === "out_of_stock" ? "Out of Stock" : p.status === "low_stock" ? "Low Stock" : "In Stock",
      ]),
    );
    toast.success(`Exported ${filteredStock.length} stock row${filteredStock.length === 1 ? "" : "s"}`);
  }

  function handleExportWishlist() {
    downloadCsv(
      "product-report-wishlist.csv",
      ["SL", "Product Name", "Date", "Total In Wishlist"],
      filteredWishlist.map(p => [p.sl, p.productName, p.date, p.totalInWishlist]),
    );
    toast.success(`Exported ${filteredWishlist.length} wishlist row${filteredWishlist.length === 1 ? "" : "s"}`);
  }

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

      {activeTab === "all" && (
        <>
          <div className="filter-card">
            <h3>Filter Data</h3>
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="all-date">Date</label>
                <select
                  id="all-date"
                  value={allDateFilter}
                  onChange={(e) => setAllDateFilter(e.target.value as DateFilter)}
                >
                  {DATE_OPTIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <button className="btn-filter-primary" type="button" disabled>Filter</button>
              <button className="btn-filter-secondary" type="button" onClick={handleResetAll}>Reset</button>
            </div>
          </div>

          <div className="stats-grid product-stats">
            <div className="stat-card">
              <div className="stat-icon yellow">📦</div>
              <div className="stat-content">
                <h2>{totalProducts}</h2>
                <p>Total Product</p>
                <div className="stat-breakdown">
                  <div className="breakdown-item red">
                    <span>{rejected}</span>
                    <label>Rejected</label>
                  </div>
                  <div className="breakdown-item blue">
                    <span>{pending}</span>
                    <label>Pending</label>
                  </div>
                  <div className="breakdown-item green">
                    <span>{active}</span>
                    <label>Active</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">🛒</div>
              <div className="stat-content">
                <h2>{totalProductSale}</h2>
                <p>Total Product Sale</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon yellow">🏷️</div>
              <div className="stat-content">
                <h2>₹{totalDiscountGiven.toLocaleString()}</h2>
                <p>Total Discount Given ⓘ</p>
              </div>
            </div>
          </div>

          <div className="chart-card" style={{ marginBottom: "24px" }}>
            <h3>Product Statistics</h3>
            <p className="chart-subtitle">Demo chart — connect a backend to see real data</p>
            <div className="chart-placeholder" style={{ height: "300px" }}>
              <div className="line-chart-visual">
                <svg viewBox="0 0 800 200" className="line-chart-svg">
                  <polyline
                    fill="none"
                    stroke="#0d6efd"
                    strokeWidth="2"
                    points="0,180 50,180 100,180 150,140 200,100 250,60 300,80 350,180 400,180 450,180 500,120 550,180 600,180 650,180 700,180 750,180 800,180"
                  />
                  <polyline
                    fill="rgba(13,110,253,0.1)"
                    stroke="none"
                    points="0,200 0,180 50,180 100,180 150,140 200,100 250,60 300,80 350,180 400,180 450,180 500,120 550,180 600,180 650,180 700,180 750,180 800,180 800,200"
                  />
                </svg>
                <div className="chart-x-axis">
                  {["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026", "Nov 2026", "Dec 2026"].map((month) => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>
                Total Products <span className="count">{filteredAll.length}</span>
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
                    value={allSearch}
                    onChange={(e) => setAllSearch(e.target.value)}
                  />
                </div>
                <button className="btn-export" type="button" onClick={handleExportAll}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export
                </button>
              </div>
            </div>
            <div className="table-container">
              {filteredAll.length === 0 ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21,15 16,10 5,21" />
                  </svg>
                  <h3>No products match your search</h3>
                  <p>Try a different name or clear the search box.</p>
                </div>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>SL</th>
                      <th>Product Name</th>
                      <th>Product Unit Price</th>
                      <th>Total Amount Sold</th>
                      <th>Total Quantity Sold</th>
                      <th>Average Product Value</th>
                      <th>Current Stock Amount</th>
                      <th>Average Ratings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAll.map((product, index) => (
                      <tr key={product.sl}>
                        <td>{index + 1}</td>
                        <td>{product.productName}</td>
                        <td>₹{product.productUnitPrice.toLocaleString()}</td>
                        <td>₹{product.totalAmountSold.toLocaleString()}</td>
                        <td>{product.totalQuantitySold}</td>
                        <td>₹{product.averageProductValue.toLocaleString()}</td>
                        <td>{product.currentStockAmount}</td>
                        <td>
                          <span className="rating">
                            ⭐ {product.averageRatings} ({product.reviewCount})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "stock" && (
        <>
          <div className="filter-card">
            <h3>Filter Data</h3>
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="stock-category">Category</label>
                <select
                  id="stock-category"
                  value={stockCategory}
                  onChange={(e) => setStockCategory(e.target.value)}
                >
                  {CATEGORY_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="stock-sort">Sort by stock</label>
                <select
                  id="stock-sort"
                  value={stockSort}
                  onChange={(e) => setStockSort(e.target.value as StockSort)}
                >
                  <option value="stock_asc">Stock: low to high</option>
                  <option value="stock_desc">Stock: high to low</option>
                </select>
              </div>
              <button className="btn-filter-primary" type="button" disabled>Filter</button>
              <button className="btn-filter-secondary" type="button" onClick={handleResetStock}>Reset</button>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>
                Total Products <span className="count">{filteredStock.length}</span>
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
                    onChange={(e) => setStockSearch(e.target.value)}
                  />
                </div>
                <button className="btn-export" type="button" onClick={handleExportStock}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export
                </button>
              </div>
            </div>
            <div className="table-container">
              {filteredStock.length === 0 ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21,15 16,10 5,21" />
                  </svg>
                  <h3>No products match your search</h3>
                  <p>Try a different name or clear the search box.</p>
                </div>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>SL</th>
                      <th>Product Name</th>
                      <th>Last Updated Stock</th>
                      <th>Current Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.map((item, index) => (
                      <tr key={item.sl}>
                        <td>{index + 1}</td>
                        <td>{item.productName}</td>
                        <td>{item.lastUpdatedStock}</td>
                        <td>{item.currentStock}</td>
                        <td>
                          <span className={`status-text ${item.status === "out_of_stock" ? "out-of-stock" : item.status === "low_stock" ? "low-stock" : "in-stock"}`}>
                            {item.status === "out_of_stock" ? "Out of Stock" : item.status === "low_stock" ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "wishlist" && (
        <>
          <div className="filter-card">
            <h3>Filter Data</h3>
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="wishlist-sort">Sort by wishlist count</label>
                <select
                  id="wishlist-sort"
                  value={wishlistSort}
                  onChange={(e) => setWishlistSort(e.target.value as WishlistSort)}
                >
                  <option value="wishlist_asc">Wishlist: low to high</option>
                  <option value="wishlist_desc">Wishlist: high to low</option>
                </select>
              </div>
              <button className="btn-filter-primary" type="button" disabled>Filter</button>
              <button className="btn-filter-secondary" type="button" onClick={handleResetWishlist}>Reset</button>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>
                Total Products <span className="count">{filteredWishlist.length}</span>
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
                    onChange={(e) => setWishlistSearch(e.target.value)}
                  />
                </div>
                <button className="btn-export" type="button" onClick={handleExportWishlist}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export
                </button>
              </div>
            </div>
            <div className="table-container">
              {filteredWishlist.length === 0 ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21,15 16,10 5,21" />
                  </svg>
                  <h3>No products match your search</h3>
                  <p>Try a different name or clear the search box.</p>
                </div>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>SL</th>
                      <th>Product Name</th>
                      <th>Date</th>
                      <th>Total In Wishlist</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWishlist.map((item, index) => (
                      <tr key={item.sl}>
                        <td>{index + 1}</td>
                        <td>{item.productName}</td>
                        <td>{item.date}</td>
                        <td>{item.totalInWishlist}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
