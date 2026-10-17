import { useState, useEffect, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { DataTable, StatusDropdown, FilterDrawer } from "../components";
import "../styles/ui-kit.css";

type OrderStatus = "all" | "pending" | "confirmed" | "processing" | "packaging" | "shipped" | "out_for_delivery" | "delivered" | "returned" | "failed_to_deliver" | "cancelled";
type OrderChannel = "all" | "online" | "pos";
type PaymentStatusFilter = "all" | "paid" | "unpaid" | "partial";

interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
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
  subtotalPaise: number;
  discountPaise: number;
  extraDiscountPaise?: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  paidAmountPaise?: number;
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
  const receiptRef = useRef<HTMLDivElement>(null);
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
        paymentStatus: filterPaymentStatus !== "all" ? filterPaymentStatus : undefined,
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

  function formatPrice(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
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
    const paidAmount = Number(order.paidAmountPaise || 0);
    const totalAmount = Number(order.totalPaise);
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

  function printReceipt() {
    if (!receiptRef.current || !selectedOrder) return;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Receipt - ${selectedOrder.orderNumber}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;padding:10px;font-size:12px;max-width:300px;margin:0 auto}</style></head><body>${receiptRef.current.innerHTML}<script>window.onload=function(){window.print()}</script></body></html>`);
      printWindow.document.close();
    }
  }

  function exportOrders() {
    if (orders.length === 0) { alert("No orders to export"); return; }
    const headers = ["Order ID", "Order Date", "Customer Name", "Phone", "Channel", "Total", "Payment Status", "Order Status"];
    const rows = orders.map(order => {
      const payment = getPaymentStatusDisplay(order);
      return [order.orderNumber, formatDateTime(order.createdAt), order.shippingAddress?.fullName || "Walk-in", order.shippingAddress?.phone || "", order.orderChannel.toUpperCase(), (order.totalPaise / 100).toFixed(2), payment.label, getStatusLabel(order.status)];
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

  const columns = [
    {
      key: "sl",
      header: "#",
      width: "50px",
      render: (_: Order, index: number) => <span className="ak-text-muted">{(page - 1) * 20 + index + 1}</span>,
    },
    {
      key: "orderNumber",
      header: "Order ID",
      render: (order: Order) => (
        <div className="ak-order-id">
          {order.orderNumber}
          {order.orderChannel === "pos" && <span className="ak-badge ak-badge--brand" style={{ marginLeft: 6, fontSize: "0.65rem" }}>POS</span>}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
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
      key: "total",
      header: "Total",
      align: "right" as const,
      render: (order: Order) => {
        const payment = getPaymentStatusDisplay(order);
        return (
          <div style={{ textAlign: "right" }}>
            <div className="ak-amount">{formatPrice(order.totalPaise)}</div>
            <span className={`ak-status ak-status--${payment.variant}`} style={{ marginTop: 4 }}>{payment.label}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
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
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
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
          <div className="ak-modal" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Invoice #{selectedOrder.orderNumber}</h2>
              <button type="button" className="ak-modal__close" onClick={() => setShowInvoice(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="ak-modal__body" style={{ maxHeight: "60vh", overflow: "auto" }}>
              <div ref={invoiceRef} style={{ padding: "1rem", background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: "2px solid #e5e7eb" }}>
                  <div><h1 style={{ fontSize: "1.5rem", color: "#b78d3f", marginBottom: "0.25rem" }}>ARAFINE</h1><p style={{ color: "#6b7280", fontSize: "0.8rem" }}>Premium Silver Jewellery</p></div>
                  <div style={{ textAlign: "right" }}><h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>INVOICE</h2><p style={{ color: "#6b7280" }}>#{selectedOrder.orderNumber}</p><p style={{ color: "#6b7280", fontSize: "0.85rem" }}>{formatDateTime(selectedOrder.createdAt)}</p></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                  <div><h3 style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#6b7280", marginBottom: "0.5rem" }}>Bill To</h3><p style={{ fontWeight: 600 }}>{selectedOrder.shippingAddress?.fullName || "Walk-in Customer"}</p>{selectedOrder.shippingAddress?.phone && <p>{selectedOrder.shippingAddress.phone}</p>}</div>
                  <div><h3 style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#6b7280", marginBottom: "0.5rem" }}>Payment</h3><p><span className={`ak-status ak-status--${getPaymentStatusDisplay(selectedOrder).variant}`}>{getPaymentStatusDisplay(selectedOrder).label}</span></p>{selectedOrder.paymentMethod && <p style={{ marginTop: "0.25rem" }}>{selectedOrder.paymentMethod.toUpperCase()}</p>}</div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2rem" }}>
                  <thead><tr style={{ background: "#f9fafb" }}><th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.7rem", textTransform: "uppercase", color: "#6b7280" }}>Item</th><th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.7rem", textTransform: "uppercase", color: "#6b7280" }}>Qty</th><th style={{ padding: "0.75rem", textAlign: "right", fontSize: "0.7rem", textTransform: "uppercase", color: "#6b7280" }}>Price</th><th style={{ padding: "0.75rem", textAlign: "right", fontSize: "0.7rem", textTransform: "uppercase", color: "#6b7280" }}>Total</th></tr></thead>
                  <tbody>{selectedOrder.items?.map((item) => (<tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}><td style={{ padding: "0.75rem" }}>{item.productName}</td><td style={{ padding: "0.75rem", textAlign: "center" }}>{item.quantity}</td><td style={{ padding: "0.75rem", textAlign: "right" }}>{formatPrice(item.unitPricePaise)}</td><td style={{ padding: "0.75rem", textAlign: "right" }}>{formatPrice(item.totalPricePaise)}</td></tr>))}</tbody>
                </table>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ width: "250px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0" }}><span>Subtotal</span><span>{formatPrice(selectedOrder.subtotalPaise)}</span></div>
                    {selectedOrder.discountPaise > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", color: "#22c55e" }}><span>Discount</span><span>-{formatPrice(selectedOrder.discountPaise)}</span></div>}
                    {selectedOrder.taxPaise > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0" }}><span>Tax</span><span>{formatPrice(selectedOrder.taxPaise)}</span></div>}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderTop: "2px solid #e5e7eb", fontWeight: 700, fontSize: "1.1rem" }}><span>Total</span><span>{formatPrice(selectedOrder.totalPaise)}</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={printInvoice}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>Print</button>
              <button type="button" className="ak-btn ak-btn--primary" onClick={downloadInvoicePdf}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && selectedOrder && (
        <div className="ak-modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="ak-modal" style={{ maxWidth: "360px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Receipt</h2>
              <button type="button" className="ak-modal__close" onClick={() => setShowReceipt(false)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
            </div>
            <div className="ak-modal__body" ref={receiptRef} style={{ fontFamily: "'Courier New', monospace", fontSize: "12px" }}>
              <div style={{ textAlign: "center", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px dashed #000" }}><h1 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>ARAFINE</h1><p style={{ fontSize: "0.7rem" }}>Silver Jewellery</p></div>
              <div style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px dashed #000" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Order:</span><span>{selectedOrder.orderNumber}</span></div><div style={{ display: "flex", justifyContent: "space-between" }}><span>Date:</span><span>{formatDateTime(selectedOrder.createdAt)}</span></div></div>
              <div style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px dashed #000" }}>{selectedOrder.items?.map((item) => (<div key={item.id} style={{ marginBottom: "0.5rem" }}><div style={{ fontWeight: 600 }}>{item.productName}</div><div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}><span>{item.quantity} x {formatPrice(item.unitPricePaise)}</span><span>{formatPrice(item.totalPricePaise)}</span></div></div>))}</div>
              <div><div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{formatPrice(selectedOrder.subtotalPaise)}</span></div>{selectedOrder.discountPaise > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Discount</span><span>-{formatPrice(selectedOrder.discountPaise)}</span></div>}<div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid #000", paddingTop: "0.5rem", marginTop: "0.5rem" }}><span>TOTAL</span><span>{formatPrice(selectedOrder.totalPaise)}</span></div></div>
              <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "10px", color: "#666" }}>Thank you for shopping with us!</div>
            </div>
            <div className="ak-modal__footer"><button type="button" className="ak-btn ak-btn--primary ak-btn--block" onClick={printReceipt}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>Print Receipt</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
