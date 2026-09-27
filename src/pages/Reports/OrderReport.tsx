import { useState } from "react";
import "../../styles/reports.css";

interface OrderData {
  sl: number;
  orderId: string;
  orderDate: string;
  customerInfo: string;
  totalAmount: number;
  orderStatus: "pending" | "confirmed" | "delivered" | "canceled" | "returned";
  paymentStatus: "paid" | "unpaid" | "partial";
}

const mockOrders: OrderData[] = [
  { sl: 1, orderId: "ORD-100001", orderDate: "26 Sep 2026, 10:30 am", customerInfo: "Rahul Sharma", totalAmount: 4500, orderStatus: "delivered", paymentStatus: "paid" },
  { sl: 2, orderId: "ORD-100002", orderDate: "26 Sep 2026, 11:45 am", customerInfo: "Priya Patel", totalAmount: 2890, orderStatus: "confirmed", paymentStatus: "paid" },
  { sl: 3, orderId: "ORD-100003", orderDate: "25 Sep 2026, 02:15 pm", customerInfo: "Amit Kumar", totalAmount: 1560, orderStatus: "pending", paymentStatus: "unpaid" },
  { sl: 4, orderId: "ORD-100004", orderDate: "25 Sep 2026, 04:30 pm", customerInfo: "Sneha Gupta", totalAmount: 3200, orderStatus: "delivered", paymentStatus: "paid" },
  { sl: 5, orderId: "ORD-100005", orderDate: "24 Sep 2026, 09:00 am", customerInfo: "Vikram Singh", totalAmount: 890, orderStatus: "canceled", paymentStatus: "unpaid" },
  { sl: 6, orderId: "ORD-100006", orderDate: "24 Sep 2026, 11:20 am", customerInfo: "Anita Reddy", totalAmount: 5680, orderStatus: "returned", paymentStatus: "paid" },
  { sl: 7, orderId: "ORD-100007", orderDate: "23 Sep 2026, 03:45 pm", customerInfo: "Rajesh Menon", totalAmount: 1200, orderStatus: "delivered", paymentStatus: "paid" },
  { sl: 8, orderId: "ORD-100008", orderDate: "23 Sep 2026, 05:00 pm", customerInfo: "Meera Nair", totalAmount: 2340, orderStatus: "confirmed", paymentStatus: "partial" },
];

export default function OrderReport() {
  const [dateFilter, setDateFilter] = useState("This Year");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const totalOrders = 87;
  const totalSales = 80769.33;
  const delivered = 17;
  const pending = 50;
  const canceled = 20;
  const returned = 0;

  const getStatusClass = (status: string) => {
    switch (status) {
      case "delivered": return "active";
      case "confirmed": return "completed";
      case "pending": return "pending";
      case "canceled": 
      case "returned": return "inactive";
      default: return "";
    }
  };

  const getPaymentClass = (status: string) => {
    switch (status) {
      case "paid": return "active";
      case "partial": return "pending";
      case "unpaid": return "inactive";
      default: return "";
    }
  };

  return (
    <div className="reports-container">
      <div className="filter-card">
        <h3>Filter Data</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Select Date</label>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option>This Year</option>
              <option>This Month</option>
              <option>This Week</option>
              <option>Today</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Order Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Delivered</option>
              <option>Canceled</option>
              <option>Returned</option>
            </select>
          </div>
          <button className="btn-filter-secondary">Reset</button>
          <button className="btn-filter-primary">Filter</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📦</div>
          <div className="stat-content">
            <h2>{totalOrders}</h2>
            <p>Total Orders</p>
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
          <div className="stat-icon teal">✅</div>
          <div className="stat-content">
            <h2>{delivered}</h2>
            <p>Delivered</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">⏳</div>
          <div className="stat-content">
            <h2>{pending}</h2>
            <p>Pending/Confirmed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">❌</div>
          <div className="stat-content">
            <h2>{canceled}</h2>
            <p>Canceled</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">🔄</div>
          <div className="stat-content">
            <h2>{returned}</h2>
            <p>Returned</p>
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
              Delivered
            </div>
            <div className="legend-item">
              <span className="dot red"></span>
              Canceled
            </div>
          </div>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
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
            Order List <span className="count">{mockOrders.length}</span>
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by order ID..."
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
                <th>Order ID</th>
                <th>Order Date</th>
                <th>Customer Info</th>
                <th>Total Amount</th>
                <th>Order Status</th>
                <th>Payment Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <tr key={order.sl}>
                  <td>{order.sl}</td>
                  <td style={{ fontWeight: 500, color: "#0d6efd" }}>{order.orderId}</td>
                  <td>{order.orderDate}</td>
                  <td>{order.customerInfo}</td>
                  <td>₹{order.totalAmount.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.orderStatus)}`}>
                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getPaymentClass(order.paymentStatus)}`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </td>
                  <td>
                    <button className="btn-action btn-icon-view" title="View Details">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#4f46e5" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="3" stroke="#4f46e5" strokeWidth="2"/>
                      </svg>
                    </button>
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
    </div>
  );
}
