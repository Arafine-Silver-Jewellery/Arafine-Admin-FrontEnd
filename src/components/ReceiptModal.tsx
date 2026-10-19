import { useRef } from "react";
import type { Order } from "../types";
import { Receipt } from "./Receipt";
import "../styles/receipt-modal.css";

/**
 * Modal wrapper around the shared <Receipt>. Used by both the POS flow
 * (after placing an order) and the Admin Orders list (when viewing a
 * placed order) so the same receipt renders inside the same modal chrome.
 *
 * Why a shared modal: the original implementations used different class
 * names (`.bill-modal-*` vs `.ak-modal-*`) and different button sets,
 * which made the same <Receipt> render at different sizes. Centralising
 * the wrapper guarantees the two call sites produce identical UIs.
 *
 * The modal handles its own print logic — opens a new window with the
 * receipt's HTML inlined (and the receipt stylesheet reproduced inline
 * so the print window looks the same as the on-screen receipt).
 */
export function ReceiptModal({
  order,
  onClose,
  title = "Receipt",
}: {
  order: Order;
  onClose: () => void;
  title?: string;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    if (!bodyRef.current) return;
    const printContent = bodyRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;
    printWindow.document.write(buildPrintDocument(order.orderNumber, printContent));
    printWindow.document.close();
  }

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-modal-header">
          <h2>{title}</h2>
          <button type="button" className="receipt-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="receipt-modal-body" ref={bodyRef}>
          <Receipt order={order} />
        </div>

        <div className="receipt-modal-actions">
          <button type="button" className="receipt-btn-print" onClick={handlePrint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print Receipt
          </button>
          <button type="button" className="receipt-btn-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Build the standalone HTML document for the print window. The receipt's
 * stylesheet is reproduced inline because the print window does not load
 * `receipt.css` from the app. Keep the CSS here in sync with
 * `styles/receipt.css` and `styles/receipt-modal.css`.
 */
function buildPrintDocument(orderNumber: string, body: string): string {
  return `<!DOCTYPE html><html><head><title>Receipt - ${orderNumber}</title><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;padding:10px;font-size:12px;max-width:320px;margin:0 auto}
    .receipt{padding:1.5rem;font-size:0.875rem;color:#1f2937}
    .receipt-header{text-align:center;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px dashed #d1d5db}
    .receipt-header h1{font-size:1.5rem;font-weight:bold;color:#1f2937;margin-bottom:0.25rem}
    .receipt-header p{color:#6b7280;font-size:0.75rem}
    .receipt-info{margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px dashed #d1d5db}
    .receipt-info p{display:flex;justify-content:space-between;margin-bottom:0.25rem;font-size:0.8rem}
    .receipt-items{margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px dashed #d1d5db}
    .receipt-items-header{display:grid;grid-template-columns:2fr 1fr 1fr;font-weight:bold;font-size:0.75rem;color:#6b7280;margin-bottom:0.5rem;text-transform:uppercase}
    .receipt-item{margin-bottom:0.5rem}
    .receipt-item-name{font-weight:600;font-size:0.8rem;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .receipt-item-details{display:flex;justify-content:space-between;font-size:0.75rem;color:#6b7280}
    .receipt-summary{margin-bottom:1rem}
    .receipt-summary p{display:flex;justify-content:space-between;margin-bottom:0.25rem;font-size:0.85rem}
    .receipt-summary .total{font-weight:bold;font-size:1rem;color:#1f2937;border-top:1px solid #1f2937;padding-top:0.5rem;margin-top:0.5rem}
    .receipt-footer{text-align:center;margin-top:1rem;padding-top:1rem;border-top:1px dashed #d1d5db}
    .receipt-footer p{font-size:0.75rem;color:#6b7280}
    @media print{body{padding:0}}
  </style></head><body>${body}<script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}</script></body></html>`;
}
