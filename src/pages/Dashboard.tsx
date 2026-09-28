import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { formatPrice, formatDateTime, getOrderStatusColor } from "../utils/format";
import type { DashboardStats, Order, Product } from "../types";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsData, ordersData, lowStockData] = await Promise.all([
          api.getDashboardStats(),
          api.getRecentOrders(5),
          api.getLowStockProducts(5),
        ]);
        setStats(statsData);
        setRecentOrders(ordersData);
        setLowStockProducts(lowStockData);
      }
      catch (error) {
        console.error("Failed to load dashboard:", error);
      }
      finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="loading">Loading dashboard...</div>
    );
  }

  return (
    <>
      <div className="page-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon revenue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">{formatPrice(stats?.revenue.totalPaise || 0)}</span>
              <span className="stat-sub">Today: {formatPrice(stats?.revenue.todayPaise || 0)}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orders">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Orders</span>
              <span className="stat-value">{stats?.orders.total || 0}</span>
              <span className="stat-sub">Today: {stats?.orders.today || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon products">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Products</span>
              <span className="stat-value">{stats?.products.total || 0}</span>
              <span className="stat-sub">Active: {stats?.products.active || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon users">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Users</span>
              <span className="stat-value">{stats?.users.total || 0}</span>
            </div>
          </div>
        </div>

        {/* Order Stats */}
        <div className="order-stats">
          <div className="order-stat">
            <span className="order-stat-value" style={{ color: "#fbbf24" }}>
              {stats?.orders.pending || 0}
            </span>
            <span className="order-stat-label">Pending</span>
          </div>
          <div className="order-stat">
            <span className="order-stat-value" style={{ color: "#818cf8" }}>
              {stats?.orders.processing || 0}
            </span>
            <span className="order-stat-label">Processing</span>
          </div>
          <div className="order-stat">
            <span className="order-stat-value" style={{ color: "#34d399" }}>
              {stats?.orders.shipped || 0}
            </span>
            <span className="order-stat-label">Shipped</span>
          </div>
          <div className="order-stat">
            <span className="order-stat-value" style={{ color: "#22c55e" }}>
              {stats?.orders.delivered || 0}
            </span>
            <span className="order-stat-label">Delivered</span>
          </div>
        </div>

        {/* Two column layout */}
        <div className="dashboard-grid">
          {/* Recent Orders */}
          <div className="card">
            <div className="card-header">
              <h2>Recent Orders</h2>
              <Link to="/orders" className="btn btn-secondary btn-sm">View All</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="empty-state-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <p>No orders yet</p>
                <span>Orders will appear here once customers start purchasing</span>
              </div>
            ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id}>
                        <td>
                          <Link to={`/orders/${order.id}`}>{order.orderNumber}</Link>
                        </td>
                        <td>{formatPrice(order.totalPaise)}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: `${getOrderStatusColor(order.status)}20`,
                              color: getOrderStatusColor(order.status),
                            }}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td>{formatDateTime(order.createdAt)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Low Stock */}
          <div className="card">
            <div className="card-header">
              <h2>Low Stock Alert</h2>
              <Link to="/products?status=low_stock" className="btn btn-secondary btn-sm">View All</Link>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="empty-state-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p>All products are well stocked</p>
                <span>No low stock alerts at the moment</span>
              </div>
            ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                    {lowStockProducts.map(product => (
                      <tr key={product.id}>
                        <td>
                          <Link to={`/products/${product.id}`}>{product.name}</Link>
                        </td>
                        <td>{product.sku}</td>
                        <td>
                          <span className="badge" style={{ background: "#fee2e2", color: "#ef4444" }}>
                            {product.stockQuantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
