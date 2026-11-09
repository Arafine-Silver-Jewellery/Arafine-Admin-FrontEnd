import { forwardRef } from "react";
import "./Invoice.css";

interface InvoiceItem {
  id: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
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
            <span className="inv__label">ISSUED TO:</span>
            <p className="inv__value inv__value--name">
              {order.shippingAddress?.fullName || "Walk-in Customer"}
            </p>
            {order.shippingAddress?.phone && (
              <p className="inv__value">{order.shippingAddress.phone}</p>
            )}
            {order.shippingAddress?.addressLine1 && (
              <p className="inv__value">{order.shippingAddress.addressLine1}</p>
            )}
            {order.shippingAddress?.city && (
              <p className="inv__value">
                {[order.shippingAddress.city, order.shippingAddress.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>

          <div className="inv__info-block">
            <span className="inv__label">PAYMENT INFO:</span>
            <p className="inv__value">Method: {order.paymentMethod?.toUpperCase() || "N/A"}</p>
            <p className="inv__value">
              Status: {Number(order.paidAmount || 0) >= order.total ? "Paid" : "Pending"}
            </p>
          </div>
        </div>

        <div className="inv__info-right">
          <div className="inv__meta-row">
            <span className="inv__meta-label">DATE:</span>
            <span className="inv__meta-dots" />
            <span className="inv__meta-value">{formatDate(order.createdAt)}</span>
          </div>
          <div className="inv__meta-row">
            <span className="inv__meta-label">INVOICE NO:</span>
            <span className="inv__meta-dots" />
            <span className="inv__meta-value">{order.orderNumber}</span>
          </div>
        </div>
      </section>

      {/* Items Table */}
      <table className="inv__table">
        <thead>
          <tr>
            <th className="inv__th inv__th--desc">DESCRIPTION</th>
            <th className="inv__th inv__th--rate">RATE</th>
            <th className="inv__th inv__th--qty">QTY</th>
            <th className="inv__th inv__th--total">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item) => (
            <tr key={item.id} className="inv__row">
              <td className="inv__td inv__td--desc">{item.productName}</td>
              <td className="inv__td inv__td--rate">{formatPrice(item.unitPrice)}</td>
              <td className="inv__td inv__td--qty">{item.quantity}</td>
              <td className="inv__td inv__td--total">{formatPrice(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="inv__summary">
        <div className="inv__summary-row">
          <span className="inv__summary-label">SUBTOTAL</span>
          <span className="inv__summary-value">{formatPrice(order.subtotal)}</span>
        </div>
        {totalDiscount > 0 && (
          <div className="inv__summary-row inv__summary-row--small">
            <span className="inv__summary-label">Discount</span>
            <span className="inv__summary-value">-{formatPrice(totalDiscount)}</span>
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
        <div className="inv__summary-row inv__summary-row--small">
          <span className="inv__summary-label">Paid</span>
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
        <span className="inv__thanks">THANK YOU</span>
        <span className="inv__signature">Arafine</span>
      </footer>
    </div>
  );
});

Invoice.displayName = "Invoice";

export default Invoice;
