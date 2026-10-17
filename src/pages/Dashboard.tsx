import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import type {
  BreakdownResponse,
  DashboardStats,
  Order,
  Product,
  TopSellingItem,
  TrendResponse,
} from "../types";
import { formatDateTime, formatPrice, getOrderStatusColor } from "../utils/format";
import {
  CategoryDonut,
  ChannelStatTile,
  ChartCard,
  DashboardSkeleton,
  DateRangePicker,
  OrdersTrendChart,
  RevenueTrendChart,
  Sparkline,
  TopSellingChart,
  type DashboardRange,
} from "../components/dashboard";
import "../styles/dashboard.css";

const RANGE_LABELS: Record<DashboardRange, string> = {
  "7d": "last 7 days",
  "30d": "last 30 days",
  "90d": "last 90 days",
  all: "all time",
};

export default function Dashboard() {
  const [range, setRange] = useState<DashboardRange>("30d");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<TrendResponse | null>(null);
  const [ordersTrend, setOrdersTrend] = useState<TrendResponse | null>(null);
  const [topSelling, setTopSelling] = useState<TopSellingItem[] | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<BreakdownResponse | null>(null);
  const [channelBreakdown, setChannelBreakdown] = useState<BreakdownResponse | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [sparkPoints, setSparkPoints] = useState<{ revenue: number[]; orders: number[] }>({ revenue: [], orders: [] });

  const [loading, setLoading] = useState(true);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // First load: fetch everything (BE caches /stats; we still wait for it to render)
  useEffect(() => {
    const ac = new AbortController();
    async function loadInitial() {
      try {
        const [statsData, revenueData, ordersData, topData, catData, chData, recentData, lowStockData] = await Promise.all([
          api.getDashboardStats(),
          api.getDashboardTrend({ metric: "revenue", range: "30d" }),
          api.getDashboardTrend({ metric: "orders", range: "30d" }),
          api.getTopProducts({ limit: 8, range: "30d" }),
          api.getDashboardBreakdown({ dimension: "category", range: "30d" }),
          api.getDashboardBreakdown({ dimension: "channel", range: "30d" }),
          api.getRecentOrders(5),
          api.getLowStockProducts(5),
        ]);
        setStats(statsData);
        setRevenueTrend(revenueData);
        setOrdersTrend(ordersData);
        setTopSelling(topData);
        setCategoryBreakdown(catData);
        setChannelBreakdown(chData);
        setRecentOrders(recentData);
        setLowStock(lowStockData);
        setSparkPoints({
          revenue: (revenueData?.points ?? []).map((p: { value: number }) => p.value),
          orders: (ordersData?.points ?? []).map((p: { value: number }) => p.value),
        });
      }
      catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
        console.error("Failed to load dashboard:", err);
      }
      finally {
        setLoading(false);
      }
    }
    loadInitial();
    return () => ac.abort();
  }, []);

  // Range-driven refetch — keeps tables and stats untouched (BE caches /stats)
  useEffect(() => {
    if (loading) return; // initial load handles this
    setRangeLoading(true);
    const ac = new AbortController();
    async function refetchByRange() {
      try {
        const [revenueData, ordersData, topData, catData, chData] = await Promise.all([
          api.getDashboardTrend({ metric: "revenue", range }),
          api.getDashboardTrend({ metric: "orders", range }),
          api.getTopProducts({ limit: 8, range }),
          api.getDashboardBreakdown({ dimension: "category", range }),
          api.getDashboardBreakdown({ dimension: "channel", range }),
        ]);
        setRevenueTrend(revenueData);
        setOrdersTrend(ordersData);
        setTopSelling(topData);
        setCategoryBreakdown(catData);
        setChannelBreakdown(chData);
        setSparkPoints({
          revenue: (revenueData?.points ?? []).map((p: { value: number }) => p.value),
          orders: (ordersData?.points ?? []).map((p: { value: number }) => p.value),
        });
      }
      catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        console.error("Range refetch failed:", err);
      }
      finally {
        setRangeLoading(false);
      }
    }
    refetchByRange();
    return () => ac.abort();
  }, [range, loading]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && !stats) {
    return (
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h2>Couldn't load dashboard</h2>
          </div>
          <div className="chart-error" role="alert">
            <span>⚠</span> {error}
          </div>
        </div>
      </div>
    );
  }

  // Derive KPIs in the range scope (for sparklines + deltas)
  const rangeRevenue = revenueTrend?.points.reduce((s, p) => s + p.value, 0) ?? 0;
  const rangeOrders = ordersTrend?.points.reduce((s, p) => s + p.value, 0) ?? 0;
  const rangeLabel = RANGE_LABELS[range];

  const channelItems = channelBreakdown?.items ?? [];
  const onlineOrders = channelItems.find(i => i.label === "online")?.value ?? 0;
  const posOrders = channelItems.find(i => i.label === "pos")?.value ?? 0;

  return (
    <div className="page-content dashboard-page">
      <div className="dashboard-toolbar">
        <h1>Dashboard</h1>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {/* KPI tiles */}
      <div className="stats-grid">
        <KpiTile
          label="Total Revenue"
          value={formatPrice(stats?.revenue.totalPaise || 0)}
          sub={`${formatPrice(rangeRevenue)} in ${rangeLabel}`}
          spark={sparkPoints.revenue}
          sparkColor="var(--c-series-1)"
          bg="var(--c-tile-bg-1)"
          iconColor="var(--c-series-1)"
          icon="revenue"
        />
        <KpiTile
          label="Total Orders"
          value={(stats?.orders.total || 0).toLocaleString()}
          sub={`${rangeOrders.toLocaleString()} in ${rangeLabel}`}
          spark={sparkPoints.orders}
          sparkColor="var(--c-series-2)"
          bg="var(--c-tile-bg-2)"
          iconColor="var(--c-series-2)"
          icon="orders"
        />
        <KpiTile
          label="Active Products"
          value={(stats?.products.active || 0).toLocaleString()}
          sub={`${stats?.products.total || 0} total`}
          bg="var(--c-tile-bg-3)"
          iconColor="var(--c-series-3)"
          icon="products"
        />
        <KpiTile
          label="Total Users"
          value={(stats?.users.total || 0).toLocaleString()}
          sub={`${stats?.orders.today || 0} orders today`}
          bg="var(--c-tile-bg-4)"
          iconColor="var(--c-series-4)"
          icon="users"
        />
      </div>

      {/* Status counters */}
      <div className="order-stats">
        <StatusCounter value={stats?.orders.pending || 0} label="Pending" color="#fbbf24" />
        <StatusCounter value={stats?.orders.processing || 0} label="Processing" color="#818cf8" />
        <StatusCounter value={stats?.orders.shipped || 0} label="Shipped" color="#34d399" />
        <StatusCounter value={stats?.orders.delivered || 0} label="Delivered" color="#22c55e" />
      </div>

      {/* Trend charts row */}
      <div className="chart-row chart-row-2">
        <ChartCard
          title="Revenue trend"
          subtitle={`Daily revenue · ${rangeLabel}`}
          isLoading={rangeLoading}
        >
          {revenueTrend && revenueTrend.points.length > 0 ? (
            <RevenueTrendChart data={revenueTrend.points} />
          ) : (
            <div className="chart-empty">
              <p>No revenue in this range</p>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Orders trend"
          subtitle={`Daily orders · ${rangeLabel}`}
          isLoading={rangeLoading}
        >
          {ordersTrend && ordersTrend.points.length > 0 ? (
            <OrdersTrendChart data={ordersTrend.points} />
          ) : (
            <div className="chart-empty">
              <p>No orders in this range</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Breakdowns + top selling row */}
      <div className="chart-row chart-row-3">
        <ChartCard
          title="Top selling"
          subtitle={`Best sellers · ${rangeLabel}`}
          isLoading={rangeLoading}
        >
          {topSelling && topSelling.length > 0 ? (
            <TopSellingChart items={topSelling} />
          ) : (
            <div className="chart-empty">
              <p>No sales in this range</p>
              <span>Try a wider time window</span>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Sales by category"
          subtitle={`Revenue share · ${rangeLabel}`}
          isLoading={rangeLoading}
        >
          {categoryBreakdown && categoryBreakdown.items.length > 0 ? (
            <CategoryDonut items={categoryBreakdown.items} totalLabel="Total revenue" />
          ) : (
            <div className="chart-empty">
              <p>No category sales yet</p>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Channel mix"
          subtitle={`Order count · ${rangeLabel}`}
          isLoading={rangeLoading}
        >
          {channelItems.length > 0 ? (
            <ChannelStatTile online={onlineOrders} pos={posOrders} />
          ) : (
            <div className="chart-empty">
              <p>No orders in this range</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Existing tables */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2>Recent Orders</h2>
            <Link to="/orders" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="empty-state-box">
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

        <div className="card">
          <div className="card-header">
            <h2>Low Stock Alert</h2>
            <Link to="/products?status=low_stock" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="empty-state-box">
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
                  {lowStock.map(product => (
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
  );
}

interface KpiTileProps {
  label: string;
  value: string;
  sub?: string;
  spark?: number[];
  sparkColor?: string;
  bg: string;
  iconColor: string;
  icon: "revenue" | "orders" | "products" | "users";
}

function KpiTile({ label, value, sub, spark, sparkColor, bg, iconColor, icon }: KpiTileProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg, color: iconColor }}>
        <KpiIcon kind={icon} />
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {sub && <span className="stat-sub">{sub}</span>}
        {spark && spark.length > 1 && (
          <div className="stat-spark">
            <Sparkline values={spark} color={sparkColor} width={140} height={28} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCounter({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="order-stat">
      <span className="order-stat-value" style={{ color }}>
        {value.toLocaleString()}
      </span>
      <span className="order-stat-label">{label}</span>
    </div>
  );
}

function KpiIcon({ kind }: { kind: "revenue" | "orders" | "products" | "users" }) {
  switch (kind) {
    case "revenue":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "orders":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "products":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      );
  }
}
