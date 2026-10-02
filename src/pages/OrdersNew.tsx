import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import "../styles/orders-new.css";

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

interface StatusCounts {
  all: number;
  pending: number;
  confirmed: number;
  processing: number;
  packaging: number;
  shipped: number;
  out_for_delivery: number;
  delivered: number;
  returned: number;
  failed_to_deliver: number;
  cancelled: number;
}

const SummaryIcon = ({ type, color }: { type: string; color: string }) => {
  const icons: Record<string, React.ReactNode> = {
    pending: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    confirmed: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    packaging: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    out_for_delivery: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="1" y="3" width="15" height="13"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    delivered: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    cancelled: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    returned: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
      </svg>
    ),
    failed_to_deliver: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  };
  return icons[type] || null;
};

const summaryItems = [
  { key: "pending", label: "Pending", color: "#f59e0b" },
  { key: "confirmed", label: "Confirmed", color: "#22c55e" },
  { key: "packaging", label: "Packaging", color: "#8b5cf6" },
  { key: "out_for_delivery", label: "Out for Delivery", color: "#3b82f6" },
  { key: "delivered", label: "Delivered", color: "#10b981" },
  { key: "cancelled", label: "Cancelled", color: "#ef4444" },
  { key: "returned", label: "Returned", color: "#6b7280" },
  { key: "failed_to_deliver", label: "Failed to Deliver", color: "#dc2626" },
];

interface OrdersNewProps {
  statusFilter?: OrderStatus;
}

export default function OrdersNew({ statusFilter = "all" }: OrdersNewProps) {
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(statusFilter);
  const [channelFilter, setChannelFilter] = useState<OrderChannel>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    packaging: 0,
    shipped: 0,
    out_for_delivery: 0,
    delivered: 0,
    returned: 0,
    failed_to_deliver: 0,
    cancelled: 0,
  });

  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<PaymentStatusFilter>("all");
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Sync statusFilter prop with currentStatus state when route changes
  useEffect(() => {
    setCurrentStatus(statusFilter);
    setPage(1); // Reset to first page when filter changes
  }, [statusFilter]);

  async function loadOrders() {
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
      });
      setOrders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);

      // Calculate status counts from all orders (without status filter)
      const allOrdersResponse = await api.getOrders({ limit: 1000 });
      const allOrders = allOrdersResponse.data || [];
      
      const counts: StatusCounts = {
        all: allOrders.length,
        pending: allOrders.filter((o: any) => o.status === "pending").length,
        confirmed: allOrders.filter((o: any) => o.status === "confirmed").length,
        processing: allOrders.filter((o: any) => o.status === "processing").length,
        packaging: allOrders.filter((o: any) => o.status === "packaging").length,
        shipped: allOrders.filter((o: any) => o.status === "shipped").length,
        out_for_delivery: allOrders.filter((o: any) => o.status === "out_for_delivery").length,
        delivered: allOrders.filter((o: any) => o.status === "delivered").length,
        returned: allOrders.filter((o: any) => o.status === "returned").length,
        failed_to_deliver: allOrders.filter((o: any) => o.status === "failed_to_deliver").length,
        cancelled: allOrders.filter((o: any) => o.status === "cancelled").length,
      };
      setStatusCounts(counts);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [page, currentStatus, channelFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadOrders();
  }

  function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatPrice(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      all: "All",
      pending: "Pending",
      confirmed: "Confirmed",
      processing: "Processing",
      packaging: "Packaging",
      shipped: "Shipped",
      out_for_delivery: "Out for Delivery",
      delivered: "Delivered",
      returned: "Returned",
      failed_to_deliver: "Failed to Deliver",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      all: "#6b7280",
      pending: "#f59e0b",
      confirmed: "#22c55e",
      processing: "#3b82f6",
      packaging: "#8b5cf6",
      shipped: "#0ea5e9",
      out_for_delivery: "#3b82f6",
      delivered: "#10b981",
      returned: "#6b7280",
      failed_to_deliver: "#dc2626",
      cancelled: "#ef4444",
    };
    return colors[status] || "#6b7280";
  }

  function getPaymentStatusDisplay(order: Order): { label: string; className: string } {
    const paidAmount = Number(order.paidAmountPaise || 0);
    const totalAmount = Number(order.totalPaise);
    
    if (paidAmount >= totalAmount) {
      return { label: "Paid", className: "paid" };
    } else if (paidAmount > 0) {
      return { label: "Partial", className: "partial" };
    } else {
      return { label: "Unpaid", className: "pending" };
    }
  }

  async function handleViewInvoice(order: Order) {
    setLoadingInvoice(true);
    try {
      // Fetch full order details with items
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

  function handleDownloadInvoice(order: Order) {
    // First view the invoice, then trigger download
    handleViewInvoice(order).then(() => {
      setTimeout(() => {
        printInvoice(true);
      }, 500);
    });
  }

  function printInvoice(download = false) {
    if (!invoiceRef.current || !selectedOrder) return;

    const printContent = invoiceRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${selectedOrder.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              padding: 20px;
              font-size: 14px;
              color: #333;
            }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
            .invoice-logo h1 { font-size: 28px; color: #7c3aed; margin-bottom: 5px; }
            .invoice-logo p { color: #6b7280; font-size: 12px; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { font-size: 24px; color: #111; margin-bottom: 5px; }
            .invoice-title p { color: #6b7280; }
            .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .invoice-meta-block { }
            .invoice-meta-block h3 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
            .invoice-meta-block p { margin-bottom: 4px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .invoice-table th { background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
            .invoice-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .invoice-table .text-right { text-align: right; }
            .invoice-summary { display: flex; justify-content: flex-end; }
            .invoice-summary-table { width: 300px; }
            .invoice-summary-table tr td { padding: 8px 0; }
            .invoice-summary-table tr td:last-child { text-align: right; }
            .invoice-summary-table .total-row { font-weight: bold; font-size: 16px; border-top: 2px solid #e5e7eb; }
            .invoice-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
            .badge-paid { background: #dcfce7; color: #16a34a; }
            .badge-partial { background: #fef3c7; color: #d97706; }
            .badge-unpaid { background: #fee2e2; color: #dc2626; }
            .badge-pos { background: #fef3c7; color: #d97706; }
            .badge-online { background: #dbeafe; color: #2563eb; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              ${download ? 'window.print(); window.onafterprint = function() { window.close(); }' : ''}
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      if (!download) {
        // If just viewing, don't auto-print
      }
    }
  }

  function closeInvoiceModal() {
    setShowInvoice(false);
    setSelectedOrder(null);
  }

  // Receipt (POS Bill) functions
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

  function closeReceiptModal() {
    setShowReceipt(false);
    setSelectedOrder(null);
  }

  function printReceipt() {
    if (!receiptRef.current || !selectedOrder) return;

    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${selectedOrder.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              padding: 10px;
              font-size: 12px;
              max-width: 300px;
              margin: 0 auto;
            }
            .receipt-header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .receipt-header h1 { font-size: 18px; margin-bottom: 5px; }
            .receipt-header p { font-size: 11px; color: #333; }
            .receipt-info { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .receipt-info p { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .receipt-items { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .receipt-item { margin-bottom: 8px; }
            .receipt-item-name { font-weight: bold; }
            .receipt-item-details { display: flex; justify-content: space-between; font-size: 11px; }
            .receipt-summary { margin-bottom: 15px; }
            .receipt-summary p { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .receipt-summary .total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
            .receipt-footer { text-align: center; margin-top: 15px; font-size: 11px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  // Filter functions
  function openFilterModal() {
    setShowFilterModal(true);
  }

  function closeFilterModal() {
    setShowFilterModal(false);
  }

  function applyFilters() {
    let count = 0;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    if (filterPaymentStatus !== "all") count++;
    setActiveFiltersCount(count);
    setPage(1);
    loadOrders();
    closeFilterModal();
  }

  function clearFilters() {
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterPaymentStatus("all");
    setActiveFiltersCount(0);
    setPage(1);
    loadOrders();
    closeFilterModal();
  }

  // Export function
  function exportOrders() {
    if (orders.length === 0) {
      alert("No orders to export");
      return;
    }

    // Prepare CSV data
    const headers = [
      "Order ID",
      "Order Date",
      "Customer Name",
      "Customer Phone",
      "Channel",
      "Subtotal",
      "Discount",
      "Total",
      "Paid Amount",
      "Payment Status",
      "Order Status",
    ];

    const rows = orders.map(order => {
      const paymentStatus = getPaymentStatusDisplay(order);
      return [
        order.orderNumber,
        formatDateTime(order.createdAt),
        order.shippingAddress?.fullName || "Walk-in",
        order.shippingAddress?.phone || "",
        order.orderChannel.toUpperCase(),
        (order.subtotalPaise / 100).toFixed(2),
        ((order.discountPaise + (order.extraDiscountPaise || 0)) / 100).toFixed(2),
        (order.totalPaise / 100).toFixed(2),
        ((order.paidAmountPaise || 0) / 100).toFixed(2),
        paymentStatus.label,
        getStatusLabel(order.status),
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="orders-new-container">
      {currentStatus === "all" && (
        <div className="order-summary">
          <h2>Current Order Summary</h2>
          <div className="summary-grid">
            {summaryItems.map(item => (
              <div 
                key={item.key} 
                className="summary-card"
                onClick={() => { 
                  const routeMap: Record<string, string> = {
                    pending: "/orders-management/pending",
                    confirmed: "/orders-management/confirmed",
                    packaging: "/orders-management/packaging",
                    out_for_delivery: "/orders-management/out-for-delivery",
                    delivered: "/orders-management/delivered",
                    cancelled: "/orders-management/canceled",
                    returned: "/orders-management/returned",
                    failed_to_deliver: "/orders-management/failed-to-deliver",
                  };
                  if (routeMap[item.key]) {
                    navigate(routeMap[item.key]);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <span className="summary-icon">
                  <SummaryIcon type={item.key} color={item.color} />
                </span>
                <span className="summary-label">{item.label}</span>
                <span className="summary-count" style={{ color: item.color }}>
                  {statusCounts[item.key as keyof StatusCounts]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="orders-list-section">
        <div className="orders-list-header">
          <h2>Order list <span>{orders.length}</span></h2>
          <div className="orders-actions" style={{ width: 'auto' }}>
            <form onSubmit={handleSearch} className="search-box">
              <input
                type="text"
                placeholder="Search by Order ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </form>
            <select 
              value={channelFilter}
              onChange={(e) => { setChannelFilter(e.target.value as OrderChannel); setPage(1); }}
              className="channel-filter"
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "0.875rem",
                backgroundColor: "#fff",
              }}
            >
              <option value="all">All Channels</option>
              <option value="online">Online</option>
              <option value="pos">POS</option>
            </select>
            <button className="btn-export" onClick={exportOrders}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
            <button className="btn-filter" onClick={openFilterModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
              </svg>
              Filter
              {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
            </button>
          </div>
        </div>

        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Order ID</th>
                <th>Order Date</th>
                <th>Customer Info</th>
                <th>Store</th>
                <th>Total Amount</th>
                <th>Order Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "2rem" }}>Loading...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "2rem" }}>No orders found</td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={order.id}>
                    <td>{(page - 1) * 20 + index + 1}</td>
                    <td>
                      <span className="order-id">{order.orderNumber}</span>
                      {order.orderChannel === "pos" && <span className="order-source">(POS)</span>}
                    </td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>
                      <div className="customer-info">
                        <span className="customer-name">{order.shippingAddress?.fullName || "Unknown"}</span>
                        {order.shippingAddress?.phone && order.shippingAddress.phone !== "0000000000" && (
                          <span className="customer-phone">{order.shippingAddress.phone}</span>
                        )}
                      </div>
                    </td>
                    <td className="store-name">Arafine Silver Jewellery</td>
                    <td>
                      <div className="amount-info">
                        <span className="amount">{formatPrice(order.totalPaise)}</span>
                        <span className={`payment-status ${getPaymentStatusDisplay(order).className}`}>
                          {getPaymentStatusDisplay(order).label}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ color: getStatusColor(order.status) }}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action btn-icon-view" 
                          title="View Invoice"
                          onClick={() => handleViewInvoice(order)}
                          disabled={loadingInvoice}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#4f46e5" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="3" stroke="#4f46e5" strokeWidth="2"/>
                          </svg>
                        </button>
                        <button 
                          className="btn-action btn-icon-receipt" 
                          title="Print Receipt"
                          onClick={() => handleViewReceipt(order)}
                          disabled={loadingInvoice}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="#f59e0b" strokeWidth="2"/>
                            <line x1="3" y1="6" x2="21" y2="6" stroke="#f59e0b" strokeWidth="2"/>
                            <path d="M16 10a4 4 0 0 1-8 0" stroke="#f59e0b" strokeWidth="2"/>
                          </svg>
                        </button>
                        <button 
                          className="btn-action btn-icon-download" 
                          title="Download Invoice"
                          onClick={() => handleDownloadInvoice(order)}
                          disabled={loadingInvoice}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#22c55e" strokeWidth="2"/>
                            <polyline points="7 10 12 15 17 10" stroke="#22c55e" strokeWidth="2"/>
                            <line x1="12" y1="15" x2="12" y2="3" stroke="#22c55e" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="orders-pagination" style={{ display: "flex", justifyContent: "center", gap: "0.5rem", padding: "1rem" }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: "0.5rem 1rem", border: "1px solid #e5e7eb", borderRadius: "4px", cursor: page === 1 ? "not-allowed" : "pointer" }}
            >
              Previous
            </button>
            <span style={{ padding: "0.5rem 1rem" }}>Page {page} of {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: "0.5rem 1rem", border: "1px solid #e5e7eb", borderRadius: "4px", cursor: page === totalPages ? "not-allowed" : "pointer" }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {showInvoice && selectedOrder && (
        <div className="invoice-modal-overlay" onClick={closeInvoiceModal}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <h2>Invoice</h2>
              <button className="invoice-close-btn" onClick={closeInvoiceModal}>×</button>
            </div>
            
            <div className="invoice-content" ref={invoiceRef}>
              <div className="invoice-container">
                {/* Header */}
                <div className="invoice-header">
                  <div className="invoice-logo">
                    <h1>ARAFINE</h1>
                    <p>Premium Silver Jewellery</p>
                    <p>GST: 36AABCA1234C1ZE</p>
                  </div>
                  <div className="invoice-title">
                    <h2>INVOICE</h2>
                    <p><strong>#{selectedOrder.orderNumber}</strong></p>
                    <p>{formatDateTime(selectedOrder.createdAt)}</p>
                    <span className={`badge ${selectedOrder.orderChannel === "pos" ? "badge-pos" : "badge-online"}`}>
                      {selectedOrder.orderChannel === "pos" ? "POS" : "Online"}
                    </span>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="invoice-meta">
                  <div className="invoice-meta-block">
                    <h3>Bill To</h3>
                    <p><strong>{selectedOrder.shippingAddress?.fullName || "Walk-in Customer"}</strong></p>
                    {selectedOrder.shippingAddress?.phone && selectedOrder.shippingAddress.phone !== "0000000000" && (
                      <p>{selectedOrder.shippingAddress.phone}</p>
                    )}
                    {selectedOrder.shippingAddress?.addressLine1 && selectedOrder.shippingAddress.addressLine1 !== "In-Store Purchase" && (
                      <>
                        <p>{selectedOrder.shippingAddress.addressLine1}</p>
                        {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                        <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.postalCode}</p>
                      </>
                    )}
                  </div>
                  <div className="invoice-meta-block">
                    <h3>Payment Details</h3>
                    <p><strong>Status:</strong> <span className={`badge ${getPaymentStatusDisplay(selectedOrder).className === "paid" ? "badge-paid" : getPaymentStatusDisplay(selectedOrder).className === "partial" ? "badge-partial" : "badge-unpaid"}`}>{getPaymentStatusDisplay(selectedOrder).label}</span></p>
                    {selectedOrder.paymentMethod && <p><strong>Method:</strong> {selectedOrder.paymentMethod.toUpperCase()}</p>}
                    <p><strong>Order Status:</strong> {getStatusLabel(selectedOrder.status)}</p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>SKU</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Unit Price</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td>{item.productName}</td>
                        <td>{item.productSku}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">{formatPrice(Number(item.unitPricePaise))}</td>
                        <td className="text-right">{formatPrice(Number(item.totalPricePaise))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="invoice-summary">
                  <table className="invoice-summary-table">
                    <tbody>
                      <tr>
                        <td>Subtotal</td>
                        <td>{formatPrice(Number(selectedOrder.subtotalPaise))}</td>
                      </tr>
                      {Number(selectedOrder.discountPaise) > 0 && (
                        <tr>
                          <td>Discount</td>
                          <td>-{formatPrice(Number(selectedOrder.discountPaise))}</td>
                        </tr>
                      )}
                      {Number(selectedOrder.extraDiscountPaise || 0) > 0 && (
                        <tr>
                          <td>Extra Discount</td>
                          <td>-{formatPrice(Number(selectedOrder.extraDiscountPaise || 0))}</td>
                        </tr>
                      )}
                      {Number(selectedOrder.shippingPaise) > 0 && (
                        <tr>
                          <td>Shipping</td>
                          <td>{formatPrice(Number(selectedOrder.shippingPaise))}</td>
                        </tr>
                      )}
                      {Number(selectedOrder.taxPaise) > 0 && (
                        <tr>
                          <td>Tax</td>
                          <td>{formatPrice(Number(selectedOrder.taxPaise))}</td>
                        </tr>
                      )}
                      <tr className="total-row">
                        <td>Total</td>
                        <td>{formatPrice(Number(selectedOrder.totalPaise))}</td>
                      </tr>
                      {/* Payment Summary */}
                      <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                        <td style={{ color: "#16a34a" }}>Paid Amount</td>
                        <td style={{ color: "#16a34a" }}>{formatPrice(Number(selectedOrder.paidAmountPaise || 0))}</td>
                      </tr>
                      {Number(selectedOrder.paidAmountPaise || 0) < Number(selectedOrder.totalPaise) && (
                        <tr>
                          <td style={{ color: "#dc2626", fontWeight: "bold" }}>Balance Due</td>
                          <td style={{ color: "#dc2626", fontWeight: "bold" }}>
                            {formatPrice(Number(selectedOrder.totalPaise) - Number(selectedOrder.paidAmountPaise || 0))}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="invoice-footer">
                  <p>Thank you for shopping with Arafine!</p>
                  <p>For any queries, contact us at support@arafine.com</p>
                </div>
              </div>
            </div>

            <div className="invoice-modal-actions">
              <button className="btn-print-only" onClick={() => printInvoice(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print
              </button>
              <button className="btn-close" onClick={closeInvoiceModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="filter-modal-overlay" onClick={closeFilterModal}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h2>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                </svg>
                Filter Orders
              </h2>
              <button className="filter-close-btn" onClick={closeFilterModal}>×</button>
            </div>

            <div className="filter-modal-content">
              <div className="filter-group">
                <label>Date Range</label>
                <div className="filter-date-row">
                  <div className="filter-date-field">
                    <span>From</span>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="filter-date-field">
                    <span>To</span>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="filter-group">
                <label>Payment Status</label>
                <div className="filter-options">
                  {["all", "paid", "unpaid", "partial"].map((status) => (
                    <button
                      key={status}
                      className={`filter-option ${filterPaymentStatus === status ? "active" : ""}`}
                      onClick={() => setFilterPaymentStatus(status as PaymentStatusFilter)}
                    >
                      {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="filter-modal-actions">
              <button className="btn-clear-filter" onClick={clearFilters}>
                Clear All
              </button>
              <button className="btn-apply-filter" onClick={applyFilters}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal (POS Bill Style) */}
      {showReceipt && selectedOrder && (
        <div className="receipt-modal-overlay" onClick={closeReceiptModal}>
          <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-modal-header">
              <h2>Receipt</h2>
              <button className="receipt-close-btn" onClick={closeReceiptModal}>×</button>
            </div>
            
            <div className="receipt-content" ref={receiptRef}>
              {/* Receipt Header */}
              <div className="receipt-header">
                <h1>ARAFINE</h1>
                <p>Premium Silver Jewellery</p>
                <p>GST: 36AABCA1234C1ZE</p>
              </div>

              {/* Receipt Info */}
              <div className="receipt-info">
                <p><span>Order #:</span><span>{selectedOrder.orderNumber}</span></p>
                <p><span>Date:</span><span>{formatDateTime(selectedOrder.createdAt)}</span></p>
                <p><span>Customer:</span><span>{selectedOrder.shippingAddress?.fullName || "Walk-in"}</span></p>
                {selectedOrder.shippingAddress?.phone && selectedOrder.shippingAddress.phone !== "0000000000" && (
                  <p><span>Phone:</span><span>{selectedOrder.shippingAddress.phone}</span></p>
                )}
                <p><span>Payment:</span><span>{selectedOrder.paymentMethod?.toUpperCase() || "CASH"}</span></p>
              </div>

              {/* Receipt Items */}
              <div className="receipt-items">
                <div className="receipt-items-header">
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Amount</span>
                </div>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={item.id || idx} className="receipt-item">
                    <div className="receipt-item-name">{item.productName}</div>
                    <div className="receipt-item-details">
                      <span>{formatPrice(Number(item.unitPricePaise))} x {item.quantity}</span>
                      <span>{formatPrice(Number(item.totalPricePaise))}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Receipt Summary */}
              <div className="receipt-summary">
                <p><span>Subtotal:</span><span>{formatPrice(Number(selectedOrder.subtotalPaise))}</span></p>
                {Number(selectedOrder.discountPaise) > 0 && (
                  <p><span>Discount:</span><span>-{formatPrice(Number(selectedOrder.discountPaise))}</span></p>
                )}
                {Number(selectedOrder.extraDiscountPaise || 0) > 0 && (
                  <p><span>Extra Discount:</span><span>-{formatPrice(Number(selectedOrder.extraDiscountPaise || 0))}</span></p>
                )}
                <p className="total"><span>Total:</span><span>{formatPrice(Number(selectedOrder.totalPaise))}</span></p>
                <p className="paid"><span>Paid:</span><span>{formatPrice(Number(selectedOrder.paidAmountPaise || 0))}</span></p>
                {Number(selectedOrder.paidAmountPaise || 0) > Number(selectedOrder.totalPaise) && (
                  <p className="change"><span>Change:</span><span>{formatPrice(Number(selectedOrder.paidAmountPaise || 0) - Number(selectedOrder.totalPaise))}</span></p>
                )}
                {Number(selectedOrder.paidAmountPaise || 0) < Number(selectedOrder.totalPaise) && (
                  <p className="balance"><span>Balance:</span><span>{formatPrice(Number(selectedOrder.totalPaise) - Number(selectedOrder.paidAmountPaise || 0))}</span></p>
                )}
              </div>

              {/* Receipt Footer */}
              <div className="receipt-footer">
                <p>Thank you for shopping with us!</p>
                <p>Visit again</p>
              </div>
            </div>

            <div className="receipt-modal-actions">
              <button className="btn-print-receipt" onClick={printReceipt}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print Receipt
              </button>
              <button className="btn-close-receipt" onClick={closeReceiptModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
