export function formatPrice(paise: number, opts: { compact?: boolean } = {}): string {
  const rupees = paise / 100;
  if (opts.compact && Math.abs(rupees) >= 100000) {
    // ₹1.2L / ₹3.4Cr for axis labels
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(rupees);
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function formatShortDate(
  dateStr: string,
  opts: { withYear?: boolean; withMonth?: boolean } = {},
): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const month = d.toLocaleDateString("en-IN", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  let out = `${day} ${month}`;
  if (opts.withMonth && opts.withYear !== false) out = `${day} ${month}`;
  if (opts.withYear) out = `${out} ${year}`;
  return out;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "#fbbf24",
    confirmed: "#60a5fa",
    processing: "#818cf8",
    shipped: "#34d399",
    out_for_delivery: "#2dd4bf",
    delivered: "#22c55e",
    cancelled: "#ef4444",
    return_requested: "#f97316",
    return_approved: "#fb923c",
    returned: "#a855f7",
    refund_initiated: "#ec4899",
    refunded: "#6b7280",
  };
  return colors[status] || "#6b7280";
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "#fbbf24",
    paid: "#22c55e",
    failed: "#ef4444",
    refunded: "#6b7280",
    partially_refunded: "#f97316",
  };
  return colors[status] || "#6b7280";
}
