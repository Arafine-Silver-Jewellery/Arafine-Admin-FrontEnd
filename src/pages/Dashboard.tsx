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
  CategoryBars,
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
  const [channelTrend, setChannelTrend] = useState<TrendResponse | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [sparkPoints, setSparkPoints] = useState<{ revenue: number[]; orders: number[]; products: number[]; users: number[] }>({
    revenue: [],
    orders: [],
    products: [],
    users: [],
  });

  const [loading, setLoading] = useState(true);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // First load: fetch everything (BE caches /stats; we still wait for it to render)
  useEffect(() => {
    const ac = new AbortController();
    async function loadInitial() {
      try {
        const [statsData, revenueData, ordersData, productsData, usersData, channelData, topData, catData, chData, recentData, lowStockData] = await Promise.all([
          api.getDashboardStats(),
          api.getDashboardTrend({ metric: "revenue", range: "30d" }),
          api.getDashboardTrend({ metric: "orders", range: "30d" }),
          api.getDashboardTrend({ metric: "products", range: "30d" }),
          api.getDashboardTrend({ metric: "users", range: "30d" }),
          api.getDashboardTrend({ metric: "channel", range: "30d" }),
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
        setChannelTrend(channelData);
        setRecentOrders(recentData);
        setLowStock(lowStockData);
        setSparkPoints({
          revenue: (revenueData?.points ?? []).map((p: { value: number }) => p.value),
          orders: (ordersData?.points ?? []).map((p: { value: number }) => p.value),
          products: (productsData?.points ?? []).map((p: { value: number }) => p.value),
          users: (usersData?.points ?? []).map((p: { value: number }) => p.value),
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
        const [revenueData, ordersData, productsData, usersData, channelData, topData, catData, chData] = await Promise.all([
          api.getDashboardTrend({ metric: "revenue", range }),
          api.getDashboardTrend({ metric: "orders", range }),
          api.getDashboardTrend({ metric: "products", range }),
          api.getDashboardTrend({ metric: "users", range }),
          api.getDashboardTrend({ metric: "channel", range }),
          api.getTopProducts({ limit: 8, range }),
          api.getDashboardBreakdown({ dimension: "category", range }),
          api.getDashboardBreakdown({ dimension: "channel", range }),
        ]);
        setRevenueTrend(revenueData);
        setOrdersTrend(ordersData);
        setTopSelling(topData);
        setCategoryBreakdown(catData);
        setChannelBreakdown(chData);
        setChannelTrend(channelData);
        setSparkPoints({
          revenue: (revenueData?.points ?? []).map((p: { value: number }) => p.value),
          orders: (ordersData?.points ?? []).map((p: { value: number }) => p.value),
          products: (productsData?.points ?? []).map((p: { value: number }) => p.value),
          users: (usersData?.points ?? []).map((p: { value: number }) => p.value),
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
          to="/reports/earning"
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
          to="/orders-management"
        />
        <KpiTile
          label="Active Products"
          value={(stats?.products.active || 0).toLocaleString()}
          sub={`${stats?.products.total || 0} total`}
          spark={sparkPoints.products}
          sparkColor="var(--c-series-3)"
          bg="var(--c-tile-bg-3)"
          iconColor="var(--c-series-3)"
          icon="products"
          to="/products-module"
        />
        <KpiTile
          label="Total Users"
          value={(stats?.users.total || 0).toLocaleString()}
          sub={`${stats?.orders.today || 0} orders today`}
          spark={sparkPoints.users}
          sparkColor="var(--c-series-4)"
          bg="var(--c-tile-bg-4)"
          iconColor="var(--c-series-4)"
          icon="users"
          to="/customers"
        />
      </div>

      {/* Status counters */}
      <div className="status-tiles">
        <StatusTile
          value={stats?.orders.pending || 0}
          label="Pending"
          sub="Awaiting confirmation"
          color="#f59e0b"
          bg="rgba(245, 158, 11, 0.12)"
          to="/orders-management/pending"
          iconKind="clock"
        />
        <StatusTile
          value={stats?.orders.processing || 0}
          label="Processing"
          sub="Being prepared"
          color="#818cf8"
          bg="rgba(129, 140, 248, 0.14)"
          to="/orders-management/processing"
          iconKind="sync"
        />
        <StatusTile
          value={stats?.orders.shipped || 0}
          label="Shipped"
          sub="On the way"
          color="#10b981"
          bg="rgba(16, 185, 129, 0.12)"
          to="/orders-management/shipped"
          iconKind="truck"
        />
        <StatusTile
          value={stats?.orders.delivered || 0}
          label="Delivered"
          sub="Completed"
          color="#22c55e"
          bg="rgba(34, 197, 94, 0.12)"
          to="/orders-management/delivered"
          iconKind="check"
        />
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
            <CategoryBars items={categoryBreakdown.items} totalLabel="Total revenue" />
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
            <ChannelStatTile
              online={onlineOrders}
              pos={posOrders}
              series={channelTrend?.points}
            />
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
            <Link to="/orders-management" className="btn btn-secondary btn-sm">View All</Link>
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
  to: string;
}

function KpiTile({ label, value, sub, spark, sparkColor, bg, iconColor, icon, to }: KpiTileProps) {
  return (
    <Link to={to} className="stat-card stat-card-link">
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
      <span className="stat-card-arrow" aria-hidden="true">→</span>
    </Link>
  );
}

function StatusTile({
  value,
  label,
  sub,
  color,
  bg,
  to,
  iconKind,
}: {
  value: number;
  label: string;
  sub: string;
  color: string;
  bg: string;
  to: string;
  iconKind: "clock" | "sync" | "truck" | "check";
}) {
  return (
    <Link to={to} className="status-tile">
      <div className="status-tile-icon" style={{ background: bg, color }}>
        <StatusIcon kind={iconKind} />
      </div>
      <div className="status-tile-info">
        <span className="status-tile-value" style={{ color }}>{value.toLocaleString()}</span>
        <span className="status-tile-label">{label}</span>
        <span className="status-tile-sub">{sub}</span>
      </div>
      <span className="status-tile-arrow" aria-hidden="true">→</span>
    </Link>
  );
}

function StatusIcon({ kind }: { kind: "clock" | "sync" | "truck" | "check" }) {
  switch (kind) {
    case "clock":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "sync":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      );
    case "truck":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
  }
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
