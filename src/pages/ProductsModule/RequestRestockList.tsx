import { useState } from "react";
import "../../styles/products-module.css";

interface RestockRequest {
  id: string;
  name: string;
  variant: string;
  image: string;
  sellingPrice: number;
  lastRequestDate: string;
  numberOfRequest: number;
}

const mockRequests: RestockRequest[] = [
  { id: "1", name: "Concentric Clover Pe...", variant: "RoseGold-Standard", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=60&h=60&fit=crop", sellingPrice: 3699.00, lastRequestDate: "25 September 2026, 07:00 PM", numberOfRequest: 1 },
  { id: "2", name: "*Rose Whirl Rose Gol...", variant: "RoseGold-Standard", image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=60&h=60&fit=crop", sellingPrice: 3678.85, lastRequestDate: "25 September 2026, 06:58 PM", numberOfRequest: 1 },
  { id: "3", name: "Iconic Interlocked M...", variant: "RoseGold-Standard", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=60&h=60&fit=crop", sellingPrice: 3299.00, lastRequestDate: "25 September 2026, 06:56 PM", numberOfRequest: 1 },
];

export default function RequestRestockList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [brand, setBrand] = useState("");

  const filteredRequests = mockRequests.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="products-module-container">
      <div className="products-header">
        <h1>
          <span className="header-icon orange">🛒</span>
          Request Restock List
          <span className="count-badge">{filteredRequests.length}</span>
        </h1>
      </div>

      <div className="filter-section">
        <h3>Filter Products</h3>
        <div className="filter-grid">
          <div className="filter-group">
            <label>Request Restock Date</label>
            <input
              type="text"
              placeholder="DD MMM YYYY - DD MMM YYYY"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category</option>
              <option value="rings">Rings</option>
              <option value="necklaces">Necklaces</option>
              <option value="bracelets">Bracelets</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Sub Category</label>
            <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
              <option value="">Select Sub Category</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Brand</label>
            <select value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="">Select brand</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn-reset">Reset</button>
          <button className="btn-submit">Show data</button>
        </div>
      </div>

      <div className="products-card">
        <div className="products-toolbar">
          <h3>Request list <span className="count">{filteredRequests.length}</span></h3>
          <div className="toolbar-actions">
            <div className="search-box small">
              <input
                type="text"
                placeholder="Search by Product Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
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

        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Product Name</th>
                <th>Selling Price</th>
                <th>Last Request Date</th>
                <th>Number Of Request</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request, index) => (
                <tr key={request.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="product-name-cell">
                      <img src={request.image} alt="" className="product-thumb" />
                      <div className="product-info">
                        <span className="name link">{request.name}</span>
                        <span className="variant">Variant: {request.variant}</span>
                      </div>
                    </div>
                  </td>
                  <td>₹{request.sellingPrice.toLocaleString()}</td>
                  <td>{request.lastRequestDate}</td>
                  <td>{request.numberOfRequest}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-view" title="View">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="btn-action btn-share" title="Share">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                      </button>
                      <button className="btn-action btn-delete" title="Delete">
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
      </div>
    </div>
  );
}
