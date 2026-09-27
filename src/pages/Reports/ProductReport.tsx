import { useState } from "react";
import "../../styles/reports.css";

type ProductTab = "all" | "stock" | "wishlist";

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

const mockProducts: ProductData[] = [
  { sl: 1, productName: "Luna Butterfly Clust...", productUnitPrice: 4318.80, totalAmountSold: 0, totalQuantitySold: 0, averageProductValue: 0, currentStockAmount: 1, averageRatings: 0, reviewCount: 0 },
  { sl: 2, productName: "Aria Split Shank Sol...", productUnitPrice: 4078.80, totalAmountSold: 0, totalQuantitySold: 0, averageProductValue: 0, currentStockAmount: 0, averageRatings: 0, reviewCount: 0 },
  { sl: 3, productName: "Sunset Sorbet Crissc...", productUnitPrice: 4078.80, totalAmountSold: 0, totalQuantitySold: 0, averageProductValue: 0, currentStockAmount: 0, averageRatings: 0, reviewCount: 0 },
  { sl: 4, productName: "Pearl Whisper Baguet...", productUnitPrice: 3958.80, totalAmountSold: 0, totalQuantitySold: 0, averageProductValue: 0, currentStockAmount: 1, averageRatings: 0, reviewCount: 0 },
  { sl: 5, productName: "Meadow Glow Sideways...", productUnitPrice: 3598.80, totalAmountSold: 0, totalQuantitySold: 0, averageProductValue: 0, currentStockAmount: 1, averageRatings: 0, reviewCount: 0 },
  { sl: 6, productName: "Premium Basmati Rice 5kg", productUnitPrice: 450, totalAmountSold: 125000, totalQuantitySold: 278, averageProductValue: 449.64, currentStockAmount: 150, averageRatings: 4.5, reviewCount: 45 },
  { sl: 7, productName: "Organic Coconut Oil 1L", productUnitPrice: 380, totalAmountSold: 98500, totalQuantitySold: 259, averageProductValue: 380.31, currentStockAmount: 85, averageRatings: 4.3, reviewCount: 32 },
  { sl: 8, productName: "Fresh Farm Eggs (30 pcs)", productUnitPrice: 210, totalAmountSold: 75200, totalQuantitySold: 358, averageProductValue: 210.06, currentStockAmount: 200, averageRatings: 4.7, reviewCount: 89 },
];

const mockStockData: StockData[] = [
  { sl: 1, productName: "The Imperial Garden...", lastUpdatedStock: "26 Sep 2026, 06:04:06 pm", currentStock: 0, status: "out_of_stock" },
  { sl: 2, productName: "Bow Heart Pendant an...", lastUpdatedStock: "26 Sep 2026, 06:19:40 pm", currentStock: 0, status: "out_of_stock" },
  { sl: 3, productName: "Fairy Star Drop Pend...", lastUpdatedStock: "26 Sep 2026, 06:16:24 pm", currentStock: 0, status: "out_of_stock" },
  { sl: 4, productName: "Reindeer and Star St...", lastUpdatedStock: "26 Sep 2026, 06:19:23 pm", currentStock: 0, status: "out_of_stock" },
  { sl: 5, productName: "Juste Nail Pendant a...", lastUpdatedStock: "19 Aug 2026, 11:07:25 am", currentStock: 0, status: "out_of_stock" },
  { sl: 6, productName: "Leaf Pendant and Cha...", lastUpdatedStock: "12 Aug 2026, 08:08:33 pm", currentStock: 0, status: "out_of_stock" },
  { sl: 7, productName: "Bunny Crescent Penda...", lastUpdatedStock: "26 Sep 2026, 06:21:20 pm", currentStock: 0, status: "out_of_stock" },
  { sl: 8, productName: "Ballerina Pendant an...", lastUpdatedStock: "26 Sep 2026, 06:20:57 pm", currentStock: 0, status: "out_of_stock" },
];

const mockWishlistData: WishlistData[] = [
  { sl: 1, productName: "*Hearts in Bloom* Ri...", date: "27 Jul 2026", totalInWishlist: 0 },
  { sl: 2, productName: "*Seraphine* Solitair...", date: "07 Aug 2026", totalInWishlist: 0 },
  { sl: 3, productName: "Eternal Twist Radian...", date: "06 Aug 2026", totalInWishlist: 0 },
  { sl: 4, productName: "*Wavelet Solitaire R...", date: "06 Aug 2026", totalInWishlist: 0 },
  { sl: 5, productName: "Celeste Solitaire Si...", date: "05 Aug 2026", totalInWishlist: 0 },
  { sl: 6, productName: "Rosette Bloom Silve...", date: "05 Aug 2026", totalInWishlist: 0 },
  { sl: 7, productName: "*Celestine Grand Sol...", date: "31 Jul 2026", totalInWishlist: 0 },
  { sl: 8, productName: "*Seraphine Solitaire...", date: "31 Jul 2026", totalInWishlist: 0 },
];

export default function ProductReport() {
  const [activeTab, setActiveTab] = useState<ProductTab>("all");
  const [sellerFilter, setSellerFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("This Year");
  const [categoryFilter, setCategoryFilter] = useState("All category");
  const [stockSort, setStockSort] = useState("Stock sort by (low to high)");
  const [wishlistSort, setWishlistSort] = useState("Wishlist sort by (low to high)");
  const [searchQuery, setSearchQuery] = useState("");

  const totalProducts = 242;
  const totalProductSale = 39;
  const rejected = 0;
  const pending = 0;
  const active = 242;
  const totalDiscountGiven = 3771.48;

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
                <label>Select Seller</label>
                <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)}>
                  <option>All</option>
                  <option>In-House</option>
                  <option>Vendor 1</option>
                  <option>Vendor 2</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Select Date</label>
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                  <option>This Year</option>
                  <option>This Month</option>
                  <option>This Week</option>
                  <option>Today</option>
                </select>
              </div>
              <button className="btn-filter-secondary">Reset</button>
              <button className="btn-filter-primary">Filter</button>
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
              <div className="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search product name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn-export">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
            </div>
            <div className="table-container">
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
                  {mockProducts.map((product) => (
                    <tr key={product.sl}>
                      <td>{product.sl}</td>
                      <td>
                        <span className="product-name-link">{product.productName}</span>
                      </td>
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
            </div>
            <div className="pagination">
              <button disabled>&lt;</button>
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <button>&gt;</button>
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
                <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)}>
                  <option>All</option>
                  <option>In-House</option>
                  <option>Vendor</option>
                </select>
              </div>
              <div className="filter-group">
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option>All category</option>
                  <option>Grocery & Staples</option>
                  <option>Dairy Products</option>
                  <option>Snacks & Beverages</option>
                </select>
              </div>
              <div className="filter-group">
                <select value={stockSort} onChange={(e) => setStockSort(e.target.value)}>
                  <option>Stock sort by (low to high)</option>
                  <option>Stock sort by (high to low)</option>
                </select>
              </div>
              <button className="btn-filter-primary" style={{ flex: 1 }}>Filter</button>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>
                Total Products <span className="count">242</span>
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="btn-export">
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
                  {mockStockData.map((item) => (
                    <tr key={item.sl}>
                      <td>{item.sl}</td>
                      <td>
                        <span className="product-name-link">{item.productName}</span>
                      </td>
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
            </div>
            <div className="pagination">
              <button disabled>&lt;</button>
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <button>&gt;</button>
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
                <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)}>
                  <option>All</option>
                  <option>In-House</option>
                  <option>Vendor</option>
                </select>
              </div>
              <div className="filter-group">
                <select value={wishlistSort} onChange={(e) => setWishlistSort(e.target.value)}>
                  <option>Wishlist sort by (low to high)</option>
                  <option>Wishlist sort by (high to low)</option>
                </select>
              </div>
              <button className="btn-filter-primary" style={{ flex: 1 }}>Filter</button>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>
                Total Products <span className="count">242</span>
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="btn-export">
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
                  {mockWishlistData.map((item) => (
                    <tr key={item.sl}>
                      <td>{item.sl}</td>
                      <td>
                        <span className="product-name-link">{item.productName}</span>
                      </td>
                      <td>{item.date}</td>
                      <td>{item.totalInWishlist}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button disabled>&lt;</button>
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <button>&gt;</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
