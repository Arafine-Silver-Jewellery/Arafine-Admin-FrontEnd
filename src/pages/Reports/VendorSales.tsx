import { useState } from "react";
import "../../styles/reports.css";

interface VendorData {
  sl: number;
  vendorName: string;
  email: string;
  phone: string;
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  status: "active" | "inactive";
}

const mockVendors: VendorData[] = [
  { sl: 1, vendorName: "Fresh Farms India", email: "contact@freshfarms.in", phone: "+91 98765 43210", totalProducts: 45, totalOrders: 320, totalSales: 450000, status: "active" },
  { sl: 2, vendorName: "Organic Valley Store", email: "info@organicvalley.com", phone: "+91 87654 32109", totalProducts: 38, totalOrders: 280, totalSales: 380000, status: "active" },
  { sl: 3, vendorName: "Spice Kingdom", email: "sales@spicekingdom.in", phone: "+91 76543 21098", totalProducts: 52, totalOrders: 195, totalSales: 275000, status: "active" },
  { sl: 4, vendorName: "Dairy Delight", email: "hello@dairydelight.com", phone: "+91 65432 10987", totalProducts: 22, totalOrders: 410, totalSales: 520000, status: "active" },
  { sl: 5, vendorName: "Nutri Foods", email: "support@nutrifoods.in", phone: "+91 54321 09876", totalProducts: 31, totalOrders: 150, totalSales: 198000, status: "inactive" },
];

export default function VendorSales() {
  const [selectedVendor, setSelectedVendor] = useState("All Vendor");
  const [dateFilter, setDateFilter] = useState("This Year");
  const [searchQuery, setSearchQuery] = useState("");

  const totalVendors = mockVendors.length;
  const activeVendors = mockVendors.filter(v => v.status === "active").length;
  const totalSales = mockVendors.reduce((sum, v) => sum + v.totalSales, 0);
  const totalOrders = mockVendors.reduce((sum, v) => sum + v.totalOrders, 0);

  const filteredVendors = mockVendors.filter((vendor) =>
    vendor.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>
          <span className="header-icon">🏪</span>
          Vendor Sales
        </h1>
      </div>

      <div className="filter-card">
        <h3>Filter Data</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Vendor</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
            >
              <option>All Vendor</option>
              {mockVendors.map((v) => (
                <option key={v.sl} value={v.vendorName}>
                  {v.vendorName}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Date Type</label>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option>This Year</option>
              <option>This Month</option>
              <option>This Week</option>
              <option>Today</option>
              <option>Custom Date</option>
            </select>
          </div>
          <button className="btn-filter-primary">Filter</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">🏪</div>
          <div className="stat-content">
            <h2>{totalVendors}</h2>
            <p>Total Vendors</p>
            <div className="stat-breakdown">
              <div className="breakdown-item green">
                <span>{activeVendors}</span>
                <label>Active</label>
              </div>
              <div className="breakdown-item red">
                <span>{totalVendors - activeVendors}</span>
                <label>Inactive</label>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">💰</div>
          <div className="stat-content">
            <h2>₹{totalSales.toLocaleString()}</h2>
            <p>Total Sales</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">📦</div>
          <div className="stat-content">
            <h2>{totalOrders}</h2>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">🛒</div>
          <div className="stat-content">
            <h2>{mockVendors.reduce((sum, v) => sum + v.totalProducts, 0)}</h2>
            <p>Total Vendor Products</p>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card" style={{ gridColumn: "1 / -1" }}>
          <h3>Order Statistics</h3>
          <div className="chart-legend-inline">
            <div className="legend-item">
              <span className="dot blue"></span>
              Orders
            </div>
            <div className="legend-item">
              <span className="dot green"></span>
              Sales Amount
            </div>
          </div>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, i) => (
                <div key={month} className="chart-bar-group">
                  <div
                    className="chart-bar"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  ></div>
                  <span>{month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>
            Vendor List <span className="count">{filteredVendors.length}</span>
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
                <th>Vendor Name</th>
                <th>Contact Info</th>
                <th>Total Products</th>
                <th>Total Orders</th>
                <th>Total Sales</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor) => (
                <tr key={vendor.sl}>
                  <td>{vendor.sl}</td>
                  <td>
                    <div className="vendor-cell">
                      <div className="vendor-avatar">🏪</div>
                      <div className="vendor-info">
                        <span className="vendor-name">{vendor.vendorName}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="vendor-info">
                      <span style={{ fontSize: "13px" }}>{vendor.email}</span>
                      <span style={{ fontSize: "12px", color: "#888" }}>{vendor.phone}</span>
                    </div>
                  </td>
                  <td>{vendor.totalProducts}</td>
                  <td>{vendor.totalOrders}</td>
                  <td>₹{vendor.totalSales.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${vendor.status}`}>
                      {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-action btn-view" title="View Details">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="btn-action btn-download" title="Download Report">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7,10 12,15 17,10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button disabled>&lt;</button>
          <button className="active">1</button>
          <button>&gt;</button>
        </div>
      </div>
    </div>
  );
}
