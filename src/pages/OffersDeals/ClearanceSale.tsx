import { useState } from "react";
import "../../styles/offers-deals.css";

interface ClearanceProduct {
  sl: number;
  productName: string;
  productImage: string;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  stock: number;
  status: "active" | "inactive";
}

const mockProducts: ClearanceProduct[] = [
  { sl: 1, productName: "Organic Basmati Rice 5kg", productImage: "", originalPrice: 650, discountPrice: 520, discountPercent: 20, stock: 150, status: "active" },
  { sl: 2, productName: "Fresh Alphonso Mangoes (Dozen)", productImage: "", originalPrice: 1200, discountPrice: 960, discountPercent: 20, stock: 45, status: "active" },
  { sl: 3, productName: "Premium Cashew Nuts 500g", productImage: "", originalPrice: 850, discountPrice: 680, discountPercent: 20, stock: 80, status: "active" },
  { sl: 4, productName: "Cold Pressed Coconut Oil 1L", productImage: "", originalPrice: 450, discountPrice: 360, discountPercent: 20, stock: 200, status: "active" },
  { sl: 5, productName: "Assorted Dry Fruits Pack 1kg", productImage: "", originalPrice: 1500, discountPrice: 1200, discountPercent: 20, stock: 60, status: "inactive" },
  { sl: 6, productName: "Organic Honey 500g", productImage: "", originalPrice: 550, discountPrice: 440, discountPercent: 20, stock: 90, status: "active" },
];

export default function ClearanceSale() {
  const [activeTab, setActiveTab] = useState("inhouse");
  const [activeOffer, setActiveOffer] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    duration: "04/04/2026 12:00:00 AM - 04/04/2026 11:59:59 PM",
    discountType: "flat",
    discountAmount: "20",
    offerActiveTime: "always",
    showOnHomepage: true,
  });

  const totalProducts = mockProducts.length;
  const activeProducts = mockProducts.filter(p => p.status === "active").length;
  const totalSavings = mockProducts.reduce((sum, p) => sum + (p.originalPrice - p.discountPrice) * p.stock, 0);

  const filteredProducts = mockProducts.filter(p => 
    p.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="offers-deals-container">
      <div className="clearance-tabs">
        <button
          className={activeTab === "inhouse" ? "active" : ""}
          onClick={() => setActiveTab("inhouse")}
        >
          Manage Inhouse Offer
        </button>
        <button
          className={activeTab === "vendor" ? "active" : ""}
          onClick={() => setActiveTab("vendor")}
        >
          Manage Vendor Offer
        </button>
        <button
          className={activeTab === "priority" ? "active" : ""}
          onClick={() => setActiveTab("priority")}
        >
          Priority setup
        </button>
      </div>

      <div className="clearance-card">
        <div className="active-offer-row">
          <div className="offer-info">
            <h3>Active clearance sale offer ?</h3>
            <p>Show your offer in the store details page in customer website and apps</p>
          </div>
          <div className="offer-toggle">
            <span>Active Offer</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={activeOffer}
                onChange={() => setActiveOffer(!activeOffer)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="setup-section">
          <div className="section-header">
            <h3>Setup Offer Logics</h3>
            <button className="btn-link">Meta Data Setup →</button>
          </div>

          <div className="form-grid two-cols">
            <div className="form-group">
              <label>Duration*</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Discount Type*</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="discountType"
                    value="flat"
                    checked={formData.discountType === "flat"}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  />
                  <span>Flat Discount</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="discountType"
                    value="product"
                    checked={formData.discountType === "product"}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  />
                  <span>Product wise discount</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-grid two-cols">
            <div className="form-group">
              <label>Discount Amount (%)*</label>
              <div className="input-with-suffix">
                <input
                  type="text"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                />
                <span className="suffix">%</span>
              </div>
            </div>
            <div className="form-group">
              <label>Offer Active Time*</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="offerActiveTime"
                    value="always"
                    checked={formData.offerActiveTime === "always"}
                    onChange={(e) => setFormData({ ...formData, offerActiveTime: e.target.value })}
                  />
                  <span>Always</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="offerActiveTime"
                    value="specific"
                    checked={formData.offerActiveTime === "specific"}
                    onChange={(e) => setFormData({ ...formData, offerActiveTime: e.target.value })}
                  />
                  <span>Specific time in a day</span>
                </label>
              </div>
            </div>
          </div>

          <div className="checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.showOnHomepage}
                onChange={(e) => setFormData({ ...formData, showOnHomepage: e.target.checked })}
              />
              <span>Also show in home page</span>
            </label>
          </div>

          <div className="form-actions">
            <button className="btn-reset">Reset</button>
            <button className="btn-submit">Update</button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="clearance-stats-grid">
        <div className="clearance-stat-card">
          <div className="stat-icon green">🏷️</div>
          <div className="stat-content">
            <h2>{totalProducts}</h2>
            <p>Total Products</p>
          </div>
        </div>
        <div className="clearance-stat-card">
          <div className="stat-icon blue">✅</div>
          <div className="stat-content">
            <h2>{activeProducts}</h2>
            <p>Active Products</p>
          </div>
        </div>
        <div className="clearance-stat-card">
          <div className="stat-icon orange">💰</div>
          <div className="stat-content">
            <h2>₹{totalSavings.toLocaleString()}</h2>
            <p>Potential Customer Savings</p>
          </div>
        </div>
        <div className="clearance-stat-card">
          <div className="stat-icon purple">📊</div>
          <div className="stat-content">
            <h2>{formData.discountAmount}%</h2>
            <p>Flat Discount</p>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="clearance-table-card">
        <div className="clearance-table-header">
          <h3>
            Product List <span className="count">{filteredProducts.length}</span>
          </h3>
          <div className="table-actions">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
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
            <button className="btn-primary">+ Add Product</button>
          </div>
        </div>
        <div className="clearance-table-container">
          <table className="clearance-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Product</th>
                <th>Original Price</th>
                <th>Discount Price</th>
                <th>Discount %</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.sl}>
                  <td>{product.sl}</td>
                  <td>
                    <div className="product-cell">
                      <div className="product-thumb">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                      <span className="product-name">{product.productName}</span>
                    </div>
                  </td>
                  <td className="price-original">₹{product.originalPrice.toLocaleString()}</td>
                  <td className="price-discount">₹{product.discountPrice.toLocaleString()}</td>
                  <td>
                    <span className="discount-badge">{product.discountPercent}% OFF</span>
                  </td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={`status-badge ${product.status}`}>
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-edit" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="btn-action btn-delete" title="Remove">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="clearance-pagination">
          <button disabled>&lt;</button>
          <button className="active">1</button>
          <button>2</button>
          <button>&gt;</button>
        </div>
      </div>
    </div>
  );
}
