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
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
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
  subtotal: number;
  discount: number;
  extraDiscount: number;
  shipping: number;
  tax: number;
  total: number;
  paidAmount: number | null;
  changeAmount: number | null;
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
  refundAmount: number | null;
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
  unitPrice: number;
  totalPrice: number;
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
    total: number;
    todayRupees: number;
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
  revenue: number;
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
  unitPrice: number;
  totalAmount: number;
  unitsSold: number;
  grossQuantity: number;
  returnedQuantity: number;
  averageProductValue: number;
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
  price: number;
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
  amount: number;
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
    totalAmount: number;
    paidAmount: number;
  };
}

/** Inhouse Sales screen. */
export interface InhouseSaleRow {
  productId: string;
  name: string;
  sku: string;
  totalSale: number;
  unitsSold: number;
  imageUrl: string | null;
}

export interface InhouseSalesReport {
  data: InhouseSaleRow[];
  pagination: ReportPagination;
  totals: {
    totalSale: number;
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
  totalSales: number;
}

export interface VendorSalesReport {
  data: VendorSalesRow[];
  pagination: ReportPagination;
  totals: {
    totalVendors: number;
    activeVendors: number;
    totalOrders: number;
    totalSales: number;
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
  fullRefunds: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  orders: number;
  amount: number;
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
  totalEarned: number;
  pending: number;
  withdrawable: number;
  withdrawn: number;
  walletBalance: number;
}

export interface VendorEarningsReport {
  data: VendorEarningRow[];
  pagination: ReportPagination;
  totals: {
    totalEarned: number;
    pending: number;
    withdrawable: number;
    withdrawn: number;
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
  minCartValueRupees: number | null;
  maxDiscountRupees: number | null;
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
export type BannerResourceType = "Custom" | "Category" | "Product";export interface Banner {
  id: string;
  imageUrl: string;
  imageKey?: string;
  bannerType: BannerType;
  position: string;
  resourceType: BannerResourceType;
  /** URL when resourceType is "Custom", category/product name otherwise */
  resource: string;
  /** Set when resourceType is "Category" */
  categoryId?: string | null;
  /** Set when resourceType is "Product" */
  productId?: string | null;
  /** Storefront path or URL the banner opens; null when the target is gone */
  link: string | null;
  impressions: number;
  clicks: number;
  /** Click-through rate as a percentage */
  ctr: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Offer (BOGO / bundle / clearance) types
// ---------------------------------------------------------------------------

export type OfferType = "bogo" | "bundle" | "clearance";
export type OfferDiscountType = "percentage" | "fixed";
export type OfferScope = "all" | "category" | "product";
export type OfferStatus = "inactive" | "scheduled" | "live" | "expired";

export interface Offer {
  id: string;
  name: string;
  description: string | null;
  offerType: OfferType;
  discountType: OfferDiscountType;
  /** Percent or rupees, depending on discountType */
  discountValue: number;
  buyQuantity: number;
  /** BOGO only */
  getQuantity: number;
  scope: OfferScope;
  categoryIds: string[];
  productIds: string[];
  categories: { id: string; name: string }[];
  products: { id: string; name: string }[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
}

export type OfferStats = Record<OfferStatus, number> & { total: number };

export interface CreateOfferInput {
  name: string;
  description?: string | null;
  offerType: OfferType;
  discountType: OfferDiscountType;
  discountValue: number;
  buyQuantity: number;
  getQuantity: number;
  scope: OfferScope;
  categoryIds: string[];
  productIds: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export type UpdateOfferInput = Partial<CreateOfferInput>;

// ---------------------------------------------------------------------------
// Campaign (promotions) types
// ---------------------------------------------------------------------------

export type CampaignChannel = "email" | "push" | "in_app";
export type CampaignAudience = "all" | "new" | "returning" | "vip";
export type CampaignStatus = "draft" | "scheduled" | "running" | "completed";

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  channel: CampaignChannel;
  audience: CampaignAudience;
  subject: string | null;
  body: string | null;
  bannerId: string | null;
  offerId: string | null;
  banner: { id: string; name: string } | null;
  offer: { id: string; name: string } | null;
  startsAt: string;
  endsAt: string;
  isPublished: boolean;
  sentCount: number;
  openCount: number;
  clickCount: number;
  conversionCount: number;
  status: CampaignStatus;
  openRate: number;
  clickRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStats {
  total: number;
  byStatus: Record<CampaignStatus, number>;
  byChannel: Partial<Record<CampaignChannel, number>>;
  totals: {
    sent: number;
    opened: number;
    clicked: number;
    conversions: number;
    openRate: number;
    clickRate: number;
  };
}

export interface CampaignListResponse {
  data: Campaign[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  stats: CampaignStats;
}

export interface CreateCampaignInput {
  name: string;
  description?: string | null;
  channel: CampaignChannel;
  audience?: CampaignAudience;
  subject?: string | null;
  body?: string | null;
  bannerId?: string | null;
  offerId?: string | null;
  startsAt: string;
  endsAt: string;
  isPublished?: boolean;
}

export type UpdateCampaignInput = Partial<CreateCampaignInput>;


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
  minCartValueRupees: number | null;
  maxDiscountRupees: number | null;
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
  minCartValueRupees?: number | null;
  maxDiscountRupees?: number | null;
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
  price: number;
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

// ---------------------------------------------------------------------------
// Deal of the Day types
// ---------------------------------------------------------------------------

export interface DealOfTheDayProductInfo {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  imageUrl: string | null;
}

export interface DealOfTheDay {
  id: string;
  title: string;
  description: string | null;
  productIds: string[];
  isActive: boolean;
  activeProductsCount: number;
  products?: DealOfTheDayProductInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealOfTheDayInput {
  title: string;
  description?: string | null;
  productIds: string[];
  isActive?: boolean;
}

export interface DealOfTheDayStats {
  totalDeals: number;
  activeDeals: number;
  totalProducts: number;
}

// ---------------------------------------------------------------------------
// Subscriptions (plans + customer subscriptions) types
// ---------------------------------------------------------------------------

export type PlanTier = "basic" | "premium" | "vip";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "grace" | "cancelled" | "expired";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  tier: PlanTier;
  billingCycle: BillingCycle;
  /** Charge per cycle, in rupees */
  price: number;
  /** Checkout discount on subtotal, percent 0-100 */
  discountPercent: number;
  /** Loyalty points multiplier for subscribers */
  pointsMultiplier: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPlanListResponse {
  data: SubscriptionPlan[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  stats: { total: number; active: number; inactive: number };
}

export interface CustomerSubscription {
  id: string;
  userId: string;
  user: { id: string; name: string; mobileNumber: string } | null;
  plan: { id: string; name: string; tier: PlanTier; billingCycle: BillingCycle } | null;
  pricePaid: number;
  paymentMethod: string;
  paymentRef: string | null;
  startsAt: string;
  currentPeriodEnd: string;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface AdminSubscriptionsResponse {
  data: CustomerSubscription[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  stats: { total: number; byStatus: Record<SubscriptionStatus, number> };
}

export interface CreatePlanInput {
  name: string;
  description?: string | null;
  tier: PlanTier;
  billingCycle: BillingCycle;
  price: number;
  discountPercent: number;
  pointsMultiplier: number;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Stock movements (inventory ledger) types
// ---------------------------------------------------------------------------

export type StockMovementType = "reserve" | "release" | "out" | "in" | "adjustment";

export interface StockMovementRow {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  type: StockMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reservedBefore: number;
  reservedAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  note: string | null;
  createdAt: string;
}

export interface StockMovementsReport {
  data: StockMovementRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  totals: {
    count: number;
    stockIn: number;
    stockOut: number;
    reserved: number;
    released: number;
    netChange: number;
  };
}

// ---------------------------------------------------------------------------
// Order analytics (metrics) types
// ---------------------------------------------------------------------------

export interface OrderMetricsReport {
  totals: {
    orders: number;
    revenue: number;
    averageOrderValue: number;
    cancelled: number;
    cancellationRate: number;
    delivered: number;
    returned: number;
    pending: number;
    /** Average hours between order creation and delivery. */
    averageDeliveryHours: number;
  };
  byStatus: { status: string; count: number }[];
  byChannel: { channel: string; count: number }[];
  byPaymentMethod: { method: string; count: number; amount: number }[];
  byState: { state: string; count: number }[];
  byHour: { hour: number; count: number }[];
  daily: { date: string; orders: number; revenue: number }[];
}
