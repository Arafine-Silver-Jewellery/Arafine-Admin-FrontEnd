import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { DataTable, StatusDropdown, FilterDrawer, ReceiptModal } from "../components";
import Invoice from "../components/Invoice";
import type { Order as SharedOrder } from "../types";
import "../styles/ui-kit.css";

type OrderStatus = "all" | "pending" | "confirmed" | "processing" | "packaging" | "shipped" | "out_for_delivery" | "delivered" | "returned" | "failed_to_deliver" | "cancelled";
type OrderChannel = "all" | "online" | "pos";
type PaymentStatusFilter = "all" | "paid" | "unpaid" | "partial";

interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  subtotal: number;
  discount: number;
  extraDiscount?: number;
  shipping: number;
  tax: number;
  total: number;
  paidAmount?: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
  paymentMethod?: string;
  status: string;
  orderChannel: "online" | "pos";
  items?: OrderItem[];
}

const orderStatusOptions = [
  { value: "all", label: "All Orders", color: "neutral" as const, path: "/orders-management" },
  { value: "pending", label: "Pending", color: "warning" as const, path: "/orders-management/pending" },
  { value: "confirmed", label: "Confirmed", color: "success" as const, path: "/orders-management/confirmed" },
  { value: "processing", label: "Processing", color: "info" as const, path: "/orders-management/processing" },
  { value: "packaging", label: "Packaging", color: "info" as const, path: "/orders-management/packaging" },
  { value: "shipped", label: "Shipped", color: "info" as const, path: "/orders-management/shipped" },
  { value: "out_for_delivery", label: "Out for Delivery", color: "info" as const, path: "/orders-management/out-for-delivery" },
  { value: "delivered", label: "Delivered", color: "success" as const, path: "/orders-management/delivered" },
  { value: "returned", label: "Returned", color: "neutral" as const, path: "/orders-management/returned" },
  { value: "failed_to_deliver", label: "Failed to Deliver", color: "danger" as const, path: "/orders-management/failed-to-deliver" },
  { value: "cancelled", label: "Cancelled", color: "danger" as const, path: "/orders-management/canceled" },
];

const channelOptions = [
  { value: "all", label: "All Channels", color: "neutral" as const },
  { value: "online", label: "Online", color: "info" as const },
  { value: "pos", label: "POS", color: "brand" as const },
];

// Badge rendered next to the Order ID. `pos` keeps the house champagne tint;
// `online` takes the info tint so the two read as a matched pair and line up
// with the "Online"/"POS" chips in the channel filter above the table.
const channelBadges = {
  pos: { label: "POS", className: "ak-badge--brand" },
  online: { label: "Online", className: "ak-badge--info" },
} as const;

const paymentStatusOptions = [
  { value: "all", label: "All Payments", color: "neutral" as const },
  { value: "paid", label: "Paid", color: "success" as const },
  { value: "unpaid", label: "Unpaid", color: "danger" as const },
  { value: "partial", label: "Partial", color: "warning" as const },
];

interface OrdersNewProps {
  statusFilter?: OrderStatus;
}

export default function OrdersNew({ statusFilter = "all" }: OrdersNewProps) {
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(statusFilter);
  const [channelFilter, setChannelFilter] = useState<OrderChannel>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [collectOrder, setCollectOrder] = useState<Order | null>(null);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectMethod, setCollectMethod] = useState<"cash" | "card" | "upi">("cash");
  const [collectUpiRef, setCollectUpiRef] = useState("");
  const [collectBusy, setCollectBusy] = useState(false);

  // Filter drawer state
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<PaymentStatusFilter>("all");

  // Temp filter state
  const [tempChannelFilter, setTempChannelFilter] = useState<OrderChannel>("all");
  const [tempDateFrom, setTempDateFrom] = useState("");
  const [tempDateTo, setTempDateTo] = useState("");
  const [tempPaymentStatus, setTempPaymentStatus] = useState<PaymentStatusFilter>("all");

  const activeFiltersCount = [
    channelFilter !== "all" ? 1 : 0,
    filterDateFrom ? 1 : 0,
    filterDateTo ? 1 : 0,
    filterPaymentStatus !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  useEffect(() => {
    setCurrentStatus(statusFilter);
    setPage(1);
  }, [statusFilter]);

  const loadOrders = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const response = await api.getOrders({
        page,
        limit: 20,
        search: searchQuery || undefined,
        status: currentStatus !== "all" ? currentStatus : undefined,
        orderChannel: channelFilter !== "all" ? channelFilter : undefined,
        paymentState: filterPaymentStatus !== "all" ? filterPaymentStatus : undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
      }, controller.signal);
      setOrders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  }, [page, currentStatus, channelFilter, searchQuery, filterPaymentStatus, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadOrders();
  }

  function handleStatusChange(value: string) {
    const option = orderStatusOptions.find((o) => o.value === value);
    if (option) {
      navigate(option.path);
    }
  }

  function openFilterDrawer() {
    setTempChannelFilter(channelFilter);
    setTempDateFrom(filterDateFrom);
    setTempDateTo(filterDateTo);
    setTempPaymentStatus(filterPaymentStatus);
    setShowFilterDrawer(true);
  }

  function applyFilters() {
    setChannelFilter(tempChannelFilter);
    setFilterDateFrom(tempDateFrom);
    setFilterDateTo(tempDateTo);
    setFilterPaymentStatus(tempPaymentStatus);
    setPage(1);
    setShowFilterDrawer(false);
  }

  function resetFilters() {
    setTempChannelFilter("all");
    setTempDateFrom("");
    setTempDateTo("");
    setTempPaymentStatus("all");
    setChannelFilter("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterPaymentStatus("all");
    setPage(1);
    setShowFilterDrawer(false);
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  function formatPrice(rupees: number): string {
    return `₹${rupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  function getStatusVariant(status: string): string {
    const variants: Record<string, string> = {
      pending: "warning", confirmed: "success", processing: "info", packaging: "info",
      shipped: "info", out_for_delivery: "info", delivered: "success", returned: "neutral",
      failed_to_deliver: "danger", cancelled: "danger",
    };
    return variants[status] || "neutral";
  }

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: "Pending", confirmed: "Confirmed", processing: "Processing", packaging: "Packaging",
      shipped: "Shipped", out_for_delivery: "Out for Delivery", delivered: "Delivered",
      returned: "Returned", failed_to_deliver: "Failed", cancelled: "Cancelled",
    };
    return labels[status] || status;
  }

  function getPaymentStatusDisplay(order: Order): { label: string; variant: string } {
    const paidAmount = Number(order.paidAmount || 0);
    const totalAmount = Number(order.total);
    if (paidAmount >= totalAmount) return { label: "Paid", variant: "success" };
    if (paidAmount > 0) return { label: "Partial", variant: "warning" };
    return { label: "Unpaid", variant: "danger" };
  }

  async function handleViewInvoice(order: Order) {
    setLoadingInvoice(true);
    try {
      const fullOrder = await api.getOrder(order.id);
      setSelectedOrder(fullOrder);
      setShowInvoice(true);
    } catch (error) {
      console.error("Failed to load order details:", error);
      alert("Failed to load invoice");
    } finally {
      setLoadingInvoice(false);
    }
  }

  async function downloadInvoicePdf() {
    if (!invoiceRef.current || !selectedOrder) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`invoice_${selectedOrder.orderNumber}.pdf`);
  }

  function printInvoice() {
    if (!invoiceRef.current || !selectedOrder) return;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${selectedOrder.orderNumber}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;padding:20px;font-size:14px;color:#333}@media print{body{padding:0}}</style></head><body>${invoiceRef.current.innerHTML}</body></html>`);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  }

  async function handleViewReceipt(order: Order) {
    setLoadingInvoice(true);
    try {
      const fullOrder = await api.getOrder(order.id);
      setSelectedOrder(fullOrder);
      setShowReceipt(true);
    } catch (error) {
      console.error("Failed to load order details:", error);
      alert("Failed to load receipt");
    } finally {
      setLoadingInvoice(false);
    }
  }

  async function openCollect(order: Order) {
    setCollectOrder(order);
    setCollectAmount(String(Math.max(0, Number(order.total) - Number(order.paidAmount || 0))));
    setCollectMethod("cash");
    setCollectUpiRef("");
    // List rows carry items, but load the fresh full order so the cashier
    // verifies against exactly what's in the DB before collecting money.
    try {
      const fullOrder = await api.getOrder(order.id);
      setCollectOrder(fullOrder);
    } catch {
      // fall back to the row data — the backend re-validates anyway
    }
  }

  function closeCollect() {
    setCollectOrder(null);
    setCollectAmount("");
    setCollectUpiRef("");
  }

  async function submitCollect() {
    if (!collectOrder) return;
    const amount = Number(collectAmount);
    if (!amount || amount <= 0) return;
    if (collectMethod === "upi" && !collectUpiRef.trim()) return;
    setCollectBusy(true);
    try {
      const res = await api.collectOrderBalance(collectOrder.id, {
        amount,
        paymentMethod: collectMethod,
        paymentReference: collectMethod === "upi" ? collectUpiRef.trim() : undefined,
      });
      closeCollect();
      await loadOrders();
      // Show the refreshed order's receipt — Paid / Balance Due reflects the collection.
      setSelectedOrder(res.data);
      setShowReceipt(true);
    } catch (error) {
      console.error("Failed to collect balance:", error);
      alert(error instanceof Error ? error.message : "Failed to collect balance");
    } finally {
      setCollectBusy(false);
    }
  }

  function exportOrders() {
    if (orders.length === 0) { alert("No orders to export"); return; }
    const headers = ["Order ID", "Order Date", "Customer Name", "Phone", "Channel", "Payment Method", "Paid", "Payment Status", "Order Status"];
    const rows = orders.map(order => {
      const payment = getPaymentStatusDisplay(order);
      const pmLabel = order.paymentMethod || "—";
      const paid = Number(order.paidAmount) || 0;
      return [
        order.orderNumber,
        formatDateTime(order.createdAt),
        order.shippingAddress?.fullName || "Walk-in",
        order.shippingAddress?.phone || "",
        order.orderChannel.toUpperCase(),
        pmLabel,
        paid.toFixed(2),
        payment.label,
        getStatusLabel(order.status)
      ];
    });
    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getPaymentMethodDisplay(method: string | undefined | null): { label: string; icon: ReactNode } {
    if (!method) return { label: "—", icon: null };
    const m = method.toLowerCase();
    
    // Cash icon
    if (m === "cash") return { 
      label: "Cash", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: "#16a34a" }}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
    };
    
    // Card icon
    if (m === "card") return { 
      label: "Card", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: "#6366f1" }}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
    };
    
    // UPI icon
    if (m === "upi") return { 
      label: "UPI", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: "#ea580c" }}><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
    };
    
    // Razorpay icon
    if (m.includes("razorpay")) return { 
      label: "Razorpay", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: "#2563eb" }}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    };
    
    // Stripe icon
    if (m.includes("stripe")) return { 
      label: "Stripe", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: "#7c3aed" }}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    };
    
    // PayPal icon
    if (m.includes("paypal")) return { 
      label: "PayPal", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: "#0ea5e9" }}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    };
    
    // COD icon
    if (m === "cod" || m.includes("delivery")) return { 
      label: "COD", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: "#ca8a04" }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
    };
    
    // Default wallet icon
    return { 
      label: method, 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: "#64748b" }}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 1 0 0 4h4v-4Z"/></svg>
    };
  }

  function getBalanceAmount(order: Order): number {
    const total = Number(order.total) || 0;
    const paid = Number(order.paidAmount) || 0;
    return Math.max(0, total - paid);
  }

  const columns = [
    {
      key: "sl",
      header: "#",
      width: "45px",
      render: (_: Order, index: number) => <span className="ak-text-muted">{(page - 1) * 20 + index + 1}</span>,
    },
    {
      key: "orderNumber",
      header: "Order ID",
      width: "200px",
      render: (order: Order) => {
        const channel = channelBadges[order.orderChannel] ?? channelBadges.online;
        return (
          <div className="ak-order-id">
            {order.orderNumber}
            <span className={`ak-badge ${channel.className}`} style={{ marginLeft: 6, fontSize: "0.65rem" }}>{channel.label}</span>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: "Date",
      width: "120px",
      render: (order: Order) => (
        <div className="ak-date-cell">
          <span className="ak-date-cell__date">{formatDateTime(order.createdAt)}</span>
          <span className="ak-date-cell__time">{formatTime(order.createdAt)}</span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (order: Order) => (
        <div className="ak-user-cell">
          <div className="ak-user-cell__initials">{(order.shippingAddress?.fullName?.[0] || "?").toUpperCase()}</div>
          <div className="ak-user-cell__info">
            <span className="ak-user-cell__name">{order.shippingAddress?.fullName || "Walk-in"}</span>
            {order.shippingAddress?.phone && order.shippingAddress.phone !== "0000000000" && (
              <span className="ak-user-cell__email">{order.shippingAddress.phone}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "paymentMethod",
      header: "Payment",
      width: "110px",
      render: (order: Order) => {
        const pm = getPaymentMethodDisplay(order.paymentMethod);
        return (
          <div className="ak-payment-method">
            {pm.icon && <span className="ak-payment-method__icon">{pm.icon}</span>}
            <span className="ak-payment-method__label">{pm.label}</span>
          </div>
        );
      },
    },

    {
      key: "paidAmount",
      header: "Paid",
      width: "110px",
      align: "right" as const,
      render: (order: Order) => {
        const paid = Number(order.paidAmount) || 0;
        return (
          <div className="ak-amount" style={{ color: paid > 0 ? "#16a34a" : "#9ca3af" }}>
            {paid > 0 ? formatPrice(paid) : "—"}
          </div>
        );
      },
    },

    {
      key: "paymentStatus",
      header: "Pay Status",
      width: "100px",
      render: (order: Order) => {
        const payment = getPaymentStatusDisplay(order);
        return (
          <span className={`ak-status ak-status--${payment.variant}`}>
            <span className="ak-status__dot" />
            {payment.label}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Order Status",
      width: "130px",
      render: (order: Order) => (
        <span className={`ak-status ak-status--${getStatusVariant(order.status)}`}>
          <span className="ak-status__dot" />
          {getStatusLabel(order.status)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "100px",
      render: (order: Order) => (
        <div className="ak-row-actions">
          <button type="button" className="ak-icon-btn ak-icon-btn--view" title="View Invoice" onClick={(e) => { e.stopPropagation(); handleViewInvoice(order); }} disabled={loadingInvoice}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button type="button" className="ak-icon-btn ak-icon-btn--edit" title="Print Receipt" onClick={(e) => { e.stopPropagation(); handleViewReceipt(order); }} disabled={loadingInvoice}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
          </button>
          {getPaymentStatusDisplay(order).label !== "Paid" && (
            <button type="button" className="ak-icon-btn ak-icon-btn--edit" title="Collect Payment" onClick={(e) => { e.stopPropagation(); openCollect(order); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 12V8H6a2 2 0 0 1 0-4h12v4" />
                <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                <path d="M18 12a2 2 0 1 0 0 4h4v-4Z" />
              </svg>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="ak-page">
      {/* Page Header */}
      <div className="ak-page-header">
        <div className="ak-page-header__left">
          <h1 className="ak-page-header__title">
            Orders
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems.toLocaleString()}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage and track all customer orders</p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--ghost" onClick={exportOrders}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Page Body */}
      <div className="ak-page-body">
        {/* Toolbar */}
        <div className="ak-toolbar">
          <form onSubmit={handleSearch} className="ak-toolbar__search">
            <div className="ak-searchbar">
              <div className="ak-searchbar__form">
                <svg className="ak-searchbar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input type="text" className="ak-searchbar__input" placeholder="Search by Order ID…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </form>

          <div className="ak-toolbar__filters">
            <StatusDropdown
              options={orderStatusOptions}
              value={currentStatus}
              onChange={handleStatusChange}
              placeholder="Order Status"
              size="sm"
            />

            <StatusDropdown
              options={channelOptions}
              value={channelFilter}
              onChange={(val) => { setChannelFilter(val as OrderChannel); setPage(1); }}
              placeholder="Channel"
              size="sm"
            />

            <StatusDropdown
              options={paymentStatusOptions}
              value={filterPaymentStatus}
              onChange={(val) => { setFilterPaymentStatus(val as PaymentStatusFilter); setPage(1); }}
              placeholder="Payment"
              size="sm"
            />
          </div>

          <div className="ak-toolbar__actions">
            <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={openFilterDrawer}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                <circle cx="4" cy="12" r="2" /><circle cx="12" cy="10" r="2" /><circle cx="20" cy="14" r="2" />
              </svg>
              More
              {activeFiltersCount > 0 && <span className="ak-page-header__count">{activeFiltersCount}</span>}
            </button>

            {activeFiltersCount > 0 && (
              <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={resetFilters}>Clear</button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          loadingText="Loading orders…"
          emptyIcon="cart"
          emptyTitle="No orders found"
          emptyDescription={searchQuery || currentStatus !== "all" || channelFilter !== "all" ? "Try adjusting your filters or search query." : "When customers place orders, they'll appear here."}
          keyExtractor={(order) => order.id}
          onRowClick={(order) => navigate(`/orders/${order.id}`)}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={20}
          onPageChange={setPage}
        />
      </div>

      {/* Filter Drawer */}
      <FilterDrawer isOpen={showFilterDrawer} onClose={() => setShowFilterDrawer(false)} title="Filter Orders" onApply={applyFilters} onReset={resetFilters}>
        <div className="ak-filter-field">
          <label className="ak-filter-field__label">Channel</label>
          <StatusDropdown options={channelOptions} value={tempChannelFilter} onChange={(val) => setTempChannelFilter(val as OrderChannel)} placeholder="All Channels" />
        </div>
        <div className="ak-filter-field">
          <label className="ak-filter-field__label">Payment Status</label>
          <StatusDropdown options={paymentStatusOptions} value={tempPaymentStatus} onChange={(val) => setTempPaymentStatus(val as PaymentStatusFilter)} placeholder="All" />
        </div>
        <div className="ak-filter-field">
          <label className="ak-filter-field__label">Date From</label>
          <input type="date" className="ak-input" value={tempDateFrom} onChange={(e) => setTempDateFrom(e.target.value)} />
        </div>
        <div className="ak-filter-field">
          <label className="ak-filter-field__label">Date To</label>
          <input type="date" className="ak-input" value={tempDateTo} onChange={(e) => setTempDateTo(e.target.value)} />
        </div>
      </FilterDrawer>

      {/* Invoice Modal */}
      {showInvoice && selectedOrder && (
        <div className="ak-modal-overlay" onClick={() => setShowInvoice(false)}>
          <div className="ak-modal" style={{ maxWidth: "650px", maxHeight: "95vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Invoice #{selectedOrder.orderNumber}</h2>
              <button type="button" className="ak-modal__close" onClick={() => setShowInvoice(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="ak-modal__body" style={{ maxHeight: "calc(95vh - 140px)", overflow: "auto", padding: "16px", background: "#f5f5f5" }}>
              <Invoice ref={invoiceRef} order={selectedOrder} />
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={printInvoice}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>Print</button>
              <button type="button" className="ak-btn ak-btn--primary" onClick={downloadInvoicePdf}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal — shared <ReceiptModal> so this matches
       * the POS receipt exactly. */}
      {showReceipt && selectedOrder && (
        <ReceiptModal
          order={selectedOrder as SharedOrder}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Collect Balance — record an incoming payment on a pending/partial order */}
      {collectOrder && (
        <div className="ak-modal-overlay" onClick={closeCollect}>
          <div className="ak-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h3 className="ak-modal__title">Pending Payment</h3>
              <button type="button" className="ak-modal__close" onClick={closeCollect}>×</button>
            </div>
            <div className="ak-modal__body">
              <div style={{ background: "var(--brand-weak)", borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{collectOrder.orderNumber}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{collectOrder.shippingAddress?.fullName || "Walk-in"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "var(--text-strong)" }}>{formatPrice(Math.max(0, Number(collectOrder.total) - Number(collectOrder.paidAmount || 0)))}</div>
                  <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)" }}>Balance Due</div>
                </div>
              </div>

              {/* Order totals: total vs paid so the cashier can verify */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[["Total", formatPrice(collectOrder.total)], ["Already Paid", formatPrice(collectOrder.paidAmount || 0)], ["Items", String(collectOrder.items?.reduce((s, i) => s + i.quantity, 0) ?? 0)]].map(([l, v]) => (
                  <div key={l} style={{ background: "var(--color-pearl)", borderRadius: "var(--radius-md)", padding: "8px 12px" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{l}</div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Line items for verification */}
              {collectOrder.items && collectOrder.items.length > 0 && (
                <div className="ak-form-group">
                  <label className="ak-label">Items</label>
                  <div style={{ border: "1px solid var(--border-color-light)", borderRadius: "var(--radius-md)", overflow: "hidden", maxHeight: 180, overflowY: "auto" }}>
                    {collectOrder.items.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 12px", borderBottom: "1px solid var(--border-color-light)" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem", overflowWrap: "break-word" }}>{item.productName}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Qty: {item.quantity} × {formatPrice(item.unitPrice)}</div>
                        </div>
                        <div style={{ fontWeight: 600, flexShrink: 0 }}>{formatPrice(item.totalPrice)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="ak-form-group">
                <label className="ak-label">Amount Received</label>
                <input
                  type="number"
                  className="ak-input"
                  value={collectAmount}
                  min={0.01}
                  step={0.01}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="ak-form-group">
                <label className="ak-label">Payment Method</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["cash", "card", "upi"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setCollectMethod(m)}
                      style={{ flex: 1, padding: "8px 0", borderRadius: "var(--radius-md)", border: "1px solid " + (collectMethod === m ? "var(--brand)" : "var(--border-color)"), background: collectMethod === m ? "var(--brand-weak)" : "var(--surface)", fontWeight: 600, textTransform: "capitalize" }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {collectMethod === "upi" && (
                <div className="ak-form-group">
                  <label className="ak-label">UPI Transaction ID</label>
                  <input
                    type="text"
                    className="ak-input"
                    value={collectUpiRef}
                    onChange={(e) => setCollectUpiRef(e.target.value)}
                    placeholder="UPI ref no."
                    maxLength={64}
                  />
                </div>
              )}
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={closeCollect}>Cancel</button>
              <button
                type="button"
                className="ak-btn ak-btn--primary"
                onClick={submitCollect}
                disabled={collectBusy || !Number(collectAmount) || (collectMethod === "upi" && !collectUpiRef.trim())}
              >
                {collectBusy ? "Saving..." : "Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
