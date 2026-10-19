import type { Order } from "../types";
import "../styles/receipt.css";

/**
 * Shared order receipt used by both the POS flow (after placing an order)
 * and the Admin Orders list (when viewing a placed order). Renders the
 * same fields, formatting, and styling in both places so the cashier and
 * the admin see identical receipts for the same order.
 *
 * Expects a fully-populated `Order` (from `src/types`). The component
 * converts paise → rupees for display and splits `createdAt` into a
 * Date and Time row (matching the POS receipt).
 */
export function Receipt({ order }: { order: Order }) {
  const date = new Date(order.createdAt);

  const subTotal = order.subtotalPaise / 100;
  const discount = (order.discountPaise ?? 0) / 100;
  const extraDiscount = (order.extraDiscountPaise ?? 0) / 100;
  const total = order.totalPaise / 100;
  const paid = (order.paidAmountPaise ?? 0) / 100;
  const change = (order.changeAmountPaise ?? 0) / 100;

  return (
    <div className="receipt">
      <div className="receipt-header">
        <h1>ARAFINE</h1>
        <p>Premium Jewelry Store</p>
        <p>Thank you for shopping with us!</p>
      </div>

      <div className="receipt-info">
        <p>
          <span>Order No:</span> <span>{order.orderNumber}</span>
        </p>
        <p>
          <span>Date:</span>{" "}
          <span>{date.toLocaleDateString("en-IN")}</span>
        </p>
        <p>
          <span>Time:</span>{" "}
          <span>{date.toLocaleTimeString("en-IN")}</span>
        </p>
        {order.paymentMethod && (
          <p>
            <span>Payment:</span>{" "}
            <span>{order.paymentMethod.toUpperCase()}</span>
          </p>
        )}
        {order.paymentMethod === "upi" && order.paymentReference && (
          <p>
            <span>UPI Ref:</span> <span>{order.paymentReference}</span>
          </p>
        )}
      </div>

      <div className="receipt-items">
        <p className="receipt-items-header">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
        </p>
        {order.items?.map((item) => (
          <div key={item.id} className="receipt-item">
            <div className="receipt-item-name">{item.productName}</div>
            <div className="receipt-item-details">
              <span>
                {item.quantity} x {formatPrice(item.unitPricePaise)}
              </span>
              <span>{formatPrice(item.totalPricePaise)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="receipt-summary">
        <p>
          <span>Sub Total:</span> <span>{formatPrice(subTotal * 100)}</span>
        </p>
        {discount > 0 && (
          <p>
            <span>Discount:</span> <span>-{formatPrice(discount * 100)}</span>
          </p>
        )}
        {order.couponCode && (
          <p>
            <span>Coupon Code:</span> <span>{order.couponCode}</span>
          </p>
        )}
        {extraDiscount > 0 && (
          <p>
            <span>Extra Discount:</span>{" "}
            <span>-{formatPrice(extraDiscount * 100)}</span>
          </p>
        )}
        <p className="total">
          <span>Total:</span> <span>{formatPrice(total * 100)}</span>
        </p>
        <p>
          <span>Paid:</span> <span>{formatPrice(paid * 100)}</span>
        </p>
        {change > 0 && (
          <p>
            <span>Change:</span> <span>{formatPrice(change * 100)}</span>
          </p>
        )}
      </div>

      <div className="receipt-footer">
        <p>*** Thank You! Visit Again ***</p>
        <p>www.arafine.com</p>
      </div>
    </div>
  );
}

/**
 * Format paise as an Indian-locale rupee string. Kept here (rather than
 * imported) so the Receipt component is self-contained — both POS and
 * OrdersNew can use the same formatting without coordinating on a
 * shared utility.
 */
function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;
}
