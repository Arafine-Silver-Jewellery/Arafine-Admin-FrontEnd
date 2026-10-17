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
  status: "active" | "inactive" | "out_of_stock" | "discontinued";
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
  status: "active" | "suspended" | "deleted";
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  products: {
    total: number;
    active: number;
    lowStock: number;
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
