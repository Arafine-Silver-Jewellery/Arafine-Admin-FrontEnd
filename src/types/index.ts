/** The backend's product status enum. */
export type ProductStatus =
  | "active"
  | "inactive"
  | "out_of_stock"
  | "discontinued"
  | "draft";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  sku: string;
  pricePaise: number;
  compareAtPricePaise: number | null;
  costPricePaise: number | null;
  categoryId: string;
  category?: Category;
  images?: ProductImage[];
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  attributes: Record<string, any> | null;
  color: string | null;
  material: string | null;
  weightGrams: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaImageUrl: string | null;
  searchTags: string[];
  status: ProductStatus;
  isVisible: boolean;
  averageRating: number;
  reviewCount: number;
  sortOrder: number;
  isFeatured: boolean;
  productType: "physical" | "digital";
  unit: string;
  minOrderQty: number;
  shippingCost: number;
  discountAmount: number;
  discountType: "flat" | "percent";
  hasVariations: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  parent?: Category | null;
  children?: Category[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  orderChannel: OrderChannel;
  subtotalPaise: number;
  discountPaise: number;
  extraDiscountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  paidAmountPaise: number | null;
  changeAmountPaise: number | null;
  couponCode: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  shippingAddress: ShippingAddress;
  shippingProvider: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  customerNote: string | null;
  adminNote: string | null;
  returnReason: string | null;
  returnRequestedAt: string | null;
  refundAmountPaise: number | null;
  refundedAt: string | null;
  processedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSku: string;
  productImageUrl: string | null;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  landmark?: string;
}

// A row in the customer's address book. Different from ShippingAddress:
// this is the persisted record, has a label, and tracks draft/source
// metadata for the POS ↔ storefront flow.
export interface Address {
  id: string;
  type: "shipping" | "billing";
  label: string | null;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  landmark: string | null;
  isDefault: boolean;
  isDraft: boolean;
  source: "customer" | "pos";
}

/**
 * Structured address typed by the cashier at POS. Mirrors the customer-side
 * `Address` shape (minus id / isDefault / isDraft / source) so the cashier
 * sees the same fields as the storefront's "Add address" form.
 *
 * All fields except `addressLine2` and `landmark` are required — the
 * cashier either types the full address or skips it (which falls back to
 * the "In-Store Purchase" placeholder).
 */
export interface CustomerAddressInput {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country?: string;
  postalCode: string;
  landmark?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "return_approved"
  | "returned"
  | "refund_initiated"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";

export type OrderChannel = "online" | "pos";

export interface User {
  id: string;
  mobileNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  status: "active" | "suspended" | "deleted";
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  products: {
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    outOfStock: number;
  };
  categories: {
    total: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    today: number;
  };
  users: {
    total: number;
  };
  revenue: {
    totalPaise: number;
    todayPaise: number;
  };
}

// Analytics range preset
export type DashboardRange = "7d" | "30d" | "90d" | "all";

// Time-series point for trend charts
export interface TrendPoint {
  date: string; // YYYY-MM-DD
  value: number;
  // Populated only when metric === "channel".
  online?: number;
  pos?: number;
}

export interface TrendResponse {
  metric: "revenue" | "orders" | "products" | "users" | "channel";
  range: DashboardRange;
  points: TrendPoint[];
}

// Group-by data
export interface BreakdownItem {
  label: string;
  value: number;
}

export interface BreakdownResponse {
  dimension: "category" | "channel" | "payment";
  range: DashboardRange;
  items: BreakdownItem[];
}

// Real top sellers (aggregated from order_items)
export interface TopSellingItem {
  productId: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenuePaise: number;
  imageUrl: string | null;
}

// ---------------------------------------------------------------------------
// Sales & Transaction Report types
// ---------------------------------------------------------------------------

/** Paginated envelope used by every report endpoint. */
export interface ReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Product Report → All tab. */
export interface ProductSalesRow {
  productId: string;
  name: string;
  sku: string;
  categoryName: string | null;
  unitPricePaise: number;
  totalAmountPaise: number;
  unitsSold: number;
  grossQuantity: number;
  returnedQuantity: number;
  averageProductValuePaise: number;
  currentStock: number;
  averageRating: number;
  reviewCount: number;
  imageUrl: string | null;
}

export interface ProductSalesReport {
  data: ProductSalesRow[];
  pagination: ReportPagination;
}

/** Product Report → Wishlist tab. */
export interface WishlistCountRow {
  productId: string;
  name: string;
  sku: string;
  pricePaise: number;
  stockQuantity: number;
  status: ProductStatus;
  wishlistCount: number;
  lastWishlistedAt: string | null;
  imageUrl: string | null;
}

export interface WishlistCountsReport {
  data: WishlistCountRow[];
  pagination: ReportPagination;
}

export type ExpenseCategory =
  | "rent"
  | "utilities"
  | "salary"
  | "marketing"
  | "packaging"
  | "shipping"
  | "maintenance"
  | "software"
  | "other";

export type ExpenseStatus = "pending" | "approved" | "paid" | "rejected";

/** Transaction Report → Expense tab. */
export interface ExpenseRow {
  id: string;
  category: ExpenseCategory;
  description: string | null;
  amountPaise: number;
  expenseDate: string;
  status: ExpenseStatus;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface ExpensesReport {
  data: ExpenseRow[];
  pagination: ReportPagination;
  totals: {
    count: number;
    totalAmountPaise: number;
    paidAmountPaise: number;
  };
}

/** Inhouse Sales screen. */
export interface InhouseSaleRow {
  productId: string;
  name: string;
  sku: string;
  totalSalePaise: number;
  unitsSold: number;
  imageUrl: string | null;
}

export interface InhouseSalesReport {
  data: InhouseSaleRow[];
  pagination: ReportPagination;
  totals: {
    totalSalePaise: number;
    unitsSold: number;
  };
}

export type VendorStatus = "active" | "inactive";

/** Vendor Sales screen. */
export interface VendorSalesRow {
  vendorId: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: VendorStatus;
  totalProducts: number;
  totalOrders: number;
  unitsSold: number;
  totalSalesPaise: number;
}

export interface VendorSalesReport {
  data: VendorSalesRow[];
  pagination: ReportPagination;
  totals: {
    totalVendors: number;
    activeVendors: number;
    totalOrders: number;
    totalSalesPaise: number;
  };
}

/**
 * Whether a ledger column can be computed from the current schema.
 *
 * - `computed` — a real aggregate over real data.
 * - `computed_but_source_always_zero` — the column exists, but every
 *   order-creation path writes 0 into it, so it always reads 0.
 * - `unavailable` — there is no data source at all.
 */
export type EarningCapability =
  | "computed"
  | "computed_but_source_always_zero"
  | "unavailable";

export interface EarningCapabilities {
  inHouseEarning: EarningCapability;
  commissionEarning: EarningCapability;
  shippingEarning: EarningCapability;
  deliverymanIncentive: EarningCapability;
  discountGiven: EarningCapability;
  vatTax: EarningCapability;
  refundGiven: EarningCapability;
}

/**
 * One row of the earnings ledger.
 *
 * There is deliberately no `deliverymanIncentive` field — the system has no
 * delivery-partner data source, so the value cannot be reported honestly and
 * is omitted rather than faked.
 */
export interface EarningPeriodRow {
  period: string;
  inHouseEarning: number;
  commissionEarning: number;
  shippingEarning: number;
  discountGiven: number;
  vatTax: number;
  refundGiven: number;
  totalEarning: number;
}

export interface EarningTotals {
  inHouseEarning: number;
  commissionEarning: number;
  shippingEarning: number;
  discountGiven: number;
  vatTax: number;
  refundGiven: number;
  totalEarning: number;
  fullRefundsPaise: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  orders: number;
  amountPaise: number;
}

export interface EarningsReport {
  rows: EarningPeriodRow[];
  totals: EarningTotals;
  paymentMethodBreakdown: PaymentMethodBreakdown[];
  capabilities: EarningCapabilities;
  notes: {
    deliverymanIncentive: string;
    shippingEarning: string;
    vatTax: string;
    commissionEarning: string;
  };
}

/** Earning Reports → Vendor tab. */
export interface VendorEarningRow {
  vendorId: string;
  name: string;
  status: VendorStatus;
  totalProducts: number;
  approvedProducts: number;
  pendingApprovalProducts: number;
  totalEarnedPaise: number;
  pendingPaise: number;
  withdrawablePaise: number;
  withdrawnPaise: number;
  walletBalancePaise: number;
}

export interface VendorEarningsReport {
  data: VendorEarningRow[];
  pagination: ReportPagination;
  totals: {
    totalEarnedPaise: number;
    pendingPaise: number;
    withdrawablePaise: number;
    withdrawnPaise: number;
  };
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: "percentage" | "fixed_amount" | "buy_x_get_y" | "free_shipping";
  scope: "all" | "category" | "product" | "cart";
  value: number;
  minQuantity: number | null;
  minCartValuePaise: number | null;
  maxDiscountPaise: number | null;
  categoryIds: string[];
  productIds: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  maxUses: number | null;
  currentUses: number;
  createdAt: string;
  updatedAt: string;
}

export type BannerType = "Carousel" | "2 X 2 Banner" | "Custom Banner";
export type BannerResourceType = "Custom" | "Category";

export interface Banner {
  id: string;
  imageUrl: string;
  imageKey?: string;
  bannerType: BannerType;
  position: string;
  resourceType: BannerResourceType;
  /** URL when resourceType is "Custom", category name when "Category" */
  resource: string;
  /** Set when resourceType is "Category" */
  categoryId?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}


// ---------------------------------------------------------------------------
// Coupon (Promotion) types
// ---------------------------------------------------------------------------

export type CouponType = "percentage" | "fixed_amount" | "buy_x_get_y" | "free_shipping";
export type CouponScope = "all" | "category" | "product" | "cart";

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: CouponType;
  scope: CouponScope;
  value: number;
  minQuantity: number | null;
  minCartValuePaise: number | null;
  maxDiscountPaise: number | null;
  categoryIds: string[];
  productIds: string[];
  startsAt: string;
  endsAt: string;
  isRecurring: boolean;
  recurringDays: number[];
  recurringStartMinutes: number | null;
  recurringEndMinutes: number | null;
  maxUses: number | null;
  currentUses: number;
  maxUsesPerUser: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponInput {
  code: string;
  name: string;
  description?: string | null;
  type: CouponType;
  scope?: CouponScope;
  value: number;
  minQuantity?: number | null;
  minCartValuePaise?: number | null;
  maxDiscountPaise?: number | null;
  categoryIds?: string[];
  productIds?: string[];
  startsAt: string;
  endsAt: string;
  isRecurring?: boolean;
  recurringDays?: number[];
  recurringStartMinutes?: number | null;
  recurringEndMinutes?: number | null;
  maxUses?: number | null;
  maxUsesPerUser?: number | null;
  isActive?: boolean;
}

export interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalUsage: number;
}


// ---------------------------------------------------------------------------
// Flash Deal types
// ---------------------------------------------------------------------------

export type FlashDealStatus = "active" | "expired" | "upcoming";

export interface FlashDealProductInfo {
  id: string;
  name: string;
  sku: string;
  pricePaise: number;
  stockQuantity: number;
  imageUrl: string | null;
}

export interface FlashDeal {
  id: string;
  title: string;
  description: string | null;
  bannerImageUrl: string | null;
  startsAt: string;
  endsAt: string;
  isPublished: boolean;
  productIds: string[];
  status: FlashDealStatus;
  activeProductsCount: number;
  products?: FlashDealProductInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlashDealInput {
  title: string;
  description?: string | null;
  bannerImageUrl?: string | null;
  startsAt: string;
  endsAt: string;
  isPublished?: boolean;
  productIds?: string[];
}

export interface FlashDealStats {
  totalDeals: number;
  activeDeals: number;
  expiredDeals: number;
  upcomingDeals: number;
  totalProducts: number;
}
