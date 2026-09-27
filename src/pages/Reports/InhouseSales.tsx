import { useState } from "react";
import "../../styles/reports.css";

interface ProductSale {
  sl: number;
  productName: string;
  totalSale: number;
}

const mockProducts: ProductSale[] = [
  { sl: 1, productName: "Premium Basmati Rice 5kg", totalSale: 125000 },
  { sl: 2, productName: "Organic Coconut Oil 1L", totalSale: 98500 },
  { sl: 3, productName: "Fresh Farm Eggs (30 pcs)", totalSale: 75200 },
  { sl: 4, productName: "Pure Honey 500g", totalSale: 62000 },
  { sl: 5, productName: "Masala Tea Powder 250g", totalSale: 45800 },
  { sl: 6, productName: "Cold Pressed Groundnut Oil 1L", totalSale: 38900 },
  { sl: 7, productName: "Premium Almonds 500g", totalSale: 35200 },
  { sl: 8, productName: "Organic Turmeric Powder 200g", totalSale: 28500 },
  { sl: 9, productName: "Fresh Paneer 500g", totalSale: 24000 },
  { sl: 10, productName: "Whole Wheat Flour 5kg", totalSale: 21500 },
];

const categories = [
  "All Categories",
  "Grocery & Staples",
  "Dairy Products",
  "Snacks & Beverages",
  "Personal Care",
  "Home & Kitchen",
  "Fruits & Vegetables",
];

export default function InhouseSales() {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = mockProducts.filter((product) =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSales = filteredProducts.reduce((sum, p) => sum + p.totalSale, 0);

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>
          <span className="header-icon">🏠</span>
          Inhouse Sale
        </h1>
      </div>

      <div className="filter-card">
        <h3>Filter Data</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Sub Category</label>
            <select>
              <option>All Sub Category</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Sub Sub Category</label>
            <select>
              <option>All Sub Sub Category</option>
            </select>
          </div>
          <button className="btn-filter-primary">Filter</button>
          <button className="btn-filter-secondary">Clear</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card wide">
          <div className="stat-icon blue">💰</div>
          <div className="stat-content">
            <h2>₹{totalSales.toLocaleString()}</h2>
            <p>Total In-House Sales</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📦</div>
          <div className="stat-content">
            <h2>{mockProducts.length}</h2>
            <p>Total Products</p>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>
            In-House Product List <span className="count">{filteredProducts.length}</span>
          </h3>
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Product Name</th>
                <th>Total Sale</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.sl}>
                  <td>{product.sl}</td>
                  <td>
                    <div className="product-cell">
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
                      <span className="product-name">{product.productName}</span>
                    </div>
                  </td>
                  <td>₹{product.totalSale.toLocaleString()}</td>
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
    </div>
  );
}
