import { forwardRef } from "react";
import "./Invoice.css";

interface InvoiceItem {
  id: string;
  productName: string;
  productSku?: string;
  productImageUrl?: string | null;
  productHsnCode?: string | null;
  productCategory?: string | null;
  productColor?: string | null;
  productMaterial?: string | null;
  productAttributes?: Record<string, string | number | boolean> | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PaymentHistoryItem {
  id: string;
  paymentType: "partial" | "full" | "refund";
  amount: number;
  runningTotal: number;
  paymentMethod?: string | null;
  transactionReference?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface InvoiceOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
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
  paymentStatus: string;
  paymentMethod?: string;
  items?: InvoiceItem[];
  payments?: PaymentHistoryItem[];
}

interface InvoiceProps {
  order: InvoiceOrder;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrice(rupees: number): string {
  return `₹${rupees.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
}

function formatVariants(item: InvoiceItem): string {
  const parts: string[] = [];
  
  if (item.productColor) parts.push(item.productColor);
  if (item.productMaterial) parts.push(item.productMaterial);
  
  // Add custom attributes
  if (item.productAttributes) {
    Object.entries(item.productAttributes).forEach(([key, value]) => {
      if (value && key !== 'color' && key !== 'material') {
        parts.push(`${key}: ${value}`);
      }
    });
  }
  
  return parts.join(" | ");
}

const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(({ order }, ref) => {
  const totalDiscount = Number(order.discount || 0) + Number(order.extraDiscount || 0);

  return (
    <div ref={ref} className="inv">
      {/* Header */}
      <header className="inv__header">
        <div className="inv__brand">
          <img src="/logo.webp" alt="Arafine" className="inv__logo-img" />
        </div>
        <h1 className="inv__title">INVOICE</h1>
      </header>

      {/* Divider */}
      <div className="inv__divider" />

      {/* Info Section */}
      <section className="inv__info">
        <div className="inv__info-left">
          <div className="inv__info-block">
            <span className="inv__label">BILL TO:</span>
            <p className="inv__value inv__value--name">
              {order.shippingAddress?.fullName || "Walk-in Customer"}
            </p>
            {order.shippingAddress?.phone && (
              <p className="inv__value">{order.shippingAddress.phone}</p>
            )}
            {order.shippingAddress?.addressLine1 && (
              <p className="inv__value">{order.shippingAddress.addressLine1}</p>
            )}
            {order.shippingAddress?.addressLine2 && (
              <p className="inv__value">{order.shippingAddress.addressLine2}</p>
            )}
            {order.shippingAddress?.city && (
              <p className="inv__value">
                {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>

        <div className="inv__info-right">
          <div className="inv__meta-row">
            <span className="inv__meta-label">Date</span>
            <span className="inv__meta-value">{formatDate(order.createdAt)}</span>
          </div>
          <div className="inv__meta-row">
            <span className="inv__meta-label">Invoice #</span>
            <span className="inv__meta-value">{order.orderNumber}</span>
          </div>
          <div className="inv__meta-row">
            <span className="inv__meta-label">Payment</span>
            <span className="inv__meta-value">{order.paymentMethod?.toUpperCase() || "N/A"}</span>
          </div>
          <div className="inv__meta-row">
            <span className="inv__meta-label">Status</span>
            <span className={`inv__meta-value ${Number(order.paidAmount || 0) >= order.total ? "inv__meta-value--paid" : "inv__meta-value--pending"}`}>
              {Number(order.paidAmount || 0) >= order.total ? "Paid" : "Pending"}
            </span>
          </div>
        </div>
      </section>

      {/* Items Table */}
      <table className="inv__table">
        <thead>
          <tr>
            <th className="inv__th inv__th--img"></th>
            <th className="inv__th inv__th--desc">PRODUCT DETAILS</th>
            <th className="inv__th inv__th--rate">RATE</th>
            <th className="inv__th inv__th--qty">QTY</th>
            <th className="inv__th inv__th--total">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item) => {
            const variants = formatVariants(item);
            return (
              <tr key={item.id} className="inv__row">
                <td className="inv__td inv__td--img">
                  {item.productImageUrl ? (
                    <img 
                      src={item.productImageUrl} 
                      alt={item.productName} 
                      className="inv__item-img"
                    />
                  ) : (
                    <div className="inv__item-img-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="inv__td inv__td--desc">
                  <div className="inv__item-details">
                    <span className="inv__item-name">{item.productName}</span>
                    <span className="inv__item-sku">SKU: {item.productSku || "N/A"}</span>
                    {item.productCategory && (
                      <span className="inv__item-category">Category: {item.productCategory}</span>
                    )}
                    {variants && (
                      <span className="inv__item-variants">{variants}</span>
                    )}
                  </div>
                </td>
                <td className="inv__td inv__td--rate">{formatPrice(item.unitPrice)}</td>
                <td className="inv__td inv__td--qty">{item.quantity}</td>
                <td className="inv__td inv__td--total">{formatPrice(item.totalPrice)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Payment History (compact table - only show if multiple payments) */}
      {order.payments && order.payments.length > 1 && (
        <div className="inv__payments">
          <span className="inv__label">PAYMENT HISTORY</span>
          <table className="inv__payments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Method</th>
                <th className="inv__payments-amt">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{new Date(payment.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td className={payment.runningTotal >= order.total ? "inv__payments-cleared" : "inv__payments-partial"}>
                    {payment.runningTotal >= order.total ? "Cleared" : "Partial"}
                  </td>
                  <td>{payment.paymentMethod?.toUpperCase() || "-"}</td>
                  <td className="inv__payments-amt">+{formatPrice(payment.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="inv__summary">
        <div className="inv__summary-row">
          <span className="inv__summary-label">SUBTOTAL</span>
          <span className="inv__summary-value">{formatPrice(order.subtotal)}</span>
        </div>
        {totalDiscount > 0 && (
          <div className="inv__summary-row inv__summary-row--discount">
            <span className="inv__summary-label">Discount</span>
            <span className="inv__summary-value">-{formatPrice(totalDiscount)}</span>
          </div>
        )}
        {order.shipping > 0 && (
          <div className="inv__summary-row inv__summary-row--small">
            <span className="inv__summary-label">Shipping</span>
            <span className="inv__summary-value">{formatPrice(order.shipping)}</span>
          </div>
        )}
        {order.tax > 0 && (
          <div className="inv__summary-row inv__summary-row--small">
            <span className="inv__summary-label">Tax</span>
            <span className="inv__summary-value">{formatPrice(order.tax)}</span>
          </div>
        )}
        <div className="inv__summary-row inv__summary-row--total">
          <span className="inv__summary-label">TOTAL</span>
          <span className="inv__summary-value">{formatPrice(order.total)}</span>
        </div>
        <div className="inv__summary-row inv__summary-row--paid">
          <span className="inv__summary-label">Amount Paid</span>
          <span className="inv__summary-value">{formatPrice(Number(order.paidAmount || 0))}</span>
        </div>
        {Number(order.paidAmount || 0) < Number(order.total) && (
          <div className="inv__summary-row inv__summary-row--balance">
            <span className="inv__summary-label">BALANCE DUE</span>
            <span className="inv__summary-value">{formatPrice(Number(order.total) - Number(order.paidAmount || 0))}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="inv__footer">
        <span className="inv__thanks">THANK YOU FOR YOUR PURCHASE!</span>
        <span className="inv__signature">Arafine</span>
      </footer>
    </div>
  );
});

Invoice.displayName = "Invoice";

export default Invoice;
