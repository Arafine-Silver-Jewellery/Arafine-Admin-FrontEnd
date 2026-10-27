import { API_BASE_URL } from "../config/env";
import type {
  Address,
  Coupon,
  CreateCouponInput,
  CreateFlashDealInput,
  CustomerAddressInput,
  EarningsReport,
  ExpensesReport,
  FlashDeal,
  FlashDealProductInfo,
  InhouseSalesReport,
  ProductSalesReport,
  VendorEarningsReport,
  VendorSalesReport,
  WishlistCountsReport,
} from "../types";

interface ApiResponse<T> {
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function request<T>(
  endpoint: string,
  options: RequestInit & { signal?: AbortSignal } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    // Session expired or unauthenticated — let the AuthContext know so it
    // can clear state and bounce the user back to /login. Dispatched only
    // for 401s so a 403 (forbidden, suspended, missing permission) still
    // surfaces as a normal error toast.
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }

    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Dashboard
  getDashboardStats: () => request<any>("/dashboard/stats"),
  getRecentOrders: (limit = 10) =>
    request<any[]>(`/dashboard/recent-orders?limit=${limit}`),
  getLowStockProducts: (limit = 10) =>
    request<any[]>(`/dashboard/low-stock?limit=${limit}`),
  getDashboardTrend: (params: { metric?: "revenue" | "orders" | "products" | "users" | "channel"; range?: "7d" | "30d" | "90d" | "all" } = {}) => {
    const q = new URLSearchParams();
    q.set("metric", params.metric ?? "revenue");
    q.set("range", params.range ?? "30d");
    return request<any>(`/dashboard/trend?${q}`);
  },
  getDashboardBreakdown: (params: { dimension?: "category" | "channel" | "payment"; range?: "7d" | "30d" | "90d" | "all" } = {}) => {
    const q = new URLSearchParams();
    q.set("dimension", params.dimension ?? "category");
    q.set("range", params.range ?? "30d");
    return request<any>(`/dashboard/breakdown?${q}`);
  },
  getTopProducts: (params: { limit?: number; range?: "7d" | "30d" | "90d" | "all" } = {}) => {
    const q = new URLSearchParams();
    q.set("limit", String(params.limit ?? 5));
    q.set("range", params.range ?? "30d");
    return request<any[]>(`/dashboard/top-products?${q}`);
  },

  // Sales & Transaction Reports.
  // These live on the dashboard module — the backend serves both the
  // Dashboard screen and the report screens from there.
  getProductSalesReport: (params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    range?: "7d" | "30d" | "90d" | "all";
  } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.limit) q.set("limit", String(params.limit));
    if (params.search) q.set("search", params.search);
    if (params.categoryId) q.set("categoryId", params.categoryId);
    q.set("range", params.range ?? "30d");
    return request<ProductSalesReport>(`/dashboard/product-sales?${q}`);
  },
  getWishlistCountsReport: (params: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: "count" | "name" | "recent";
    order?: "asc" | "desc";
  } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.limit) q.set("limit", String(params.limit));
    if (params.search) q.set("search", params.search);
    q.set("sort", params.sort ?? "count");
    q.set("order", params.order ?? "desc");
    return request<WishlistCountsReport>(`/dashboard/wishlist-counts?${q}`);
  },

  getWishlistUsersReport: (productId: string, params: {
    page?: number;
    limit?: number;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.limit) q.set("limit", String(params.limit));
    return request<{
      data: {
        userId: string;
        firstName: string;
        lastName: string;
        email: string | null;
        mobileNumber: string;
        addedAt: string;
      }[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
      product: { id: string; name: string; sku: string };
    }>(`/dashboard/wishlist-users/${productId}?${q}`);
  },
  getExpensesReport: (params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.limit) q.set("limit", String(params.limit));
    if (params.search) q.set("search", params.search);
    if (params.category) q.set("category", params.category);
    if (params.status) q.set("status", params.status);
    if (params.dateFrom) q.set("dateFrom", params.dateFrom);
    if (params.dateTo) q.set("dateTo", params.dateTo);
    return request<ExpensesReport>(`/dashboard/expenses?${q}`);
  },
  getInhouseSalesReport: (params: {
    page?: number;
    limit?: number;
    search?: string;
    /** Category / Sub Category / Sub Sub Category id — all are `categories` rows. */
    categoryId?: string;
    range?: "7d" | "30d" | "90d" | "all";
  } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.limit) q.set("limit", String(params.limit));
    if (params.search) q.set("search", params.search);
    if (params.categoryId) q.set("categoryId", params.categoryId);
    q.set("range", params.range ?? "30d");
    return request<InhouseSalesReport>(`/dashboard/inhouse-sales?${q}`);
  },
  getVendorSalesReport: (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: "active" | "inactive";
    range?: "7d" | "30d" | "90d" | "all";
  } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.limit) q.set("limit", String(params.limit));
    if (params.search) q.set("search", params.search);
    if (params.status) q.set("status", params.status);
    q.set("range", params.range ?? "30d");
    return request<VendorSalesReport>(`/dashboard/vendors?${q}`);
  },
  getEarningsReport: (params: {
    dateFrom?: string;
    dateTo?: string;
    groupBy?: "month" | "week" | "day";
  } = {}) => {
    const q = new URLSearchParams();
    if (params.dateFrom) q.set("dateFrom", params.dateFrom);
    if (params.dateTo) q.set("dateTo", params.dateTo);
    q.set("groupBy", params.groupBy ?? "month");
    return request<EarningsReport>(`/dashboard/earnings?${q}`);
  },
  getVendorEarningsReport: (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: "active" | "inactive";
    range?: "7d" | "30d" | "90d" | "all";
  } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.limit) q.set("limit", String(params.limit));
    if (params.search) q.set("search", params.search);
    if (params.status) q.set("status", params.status);
    q.set("range", params.range ?? "30d");
    return request<VendorEarningsReport>(`/dashboard/vendor-earnings?${q}`);
  },

  // Products
  getProducts: (params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
    productType?: "physical" | "digital";
    stock?: "out";
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.search) query.set("search", params.search);
    if (params.categoryId) query.set("categoryId", params.categoryId);
    if (params.status) query.set("status", params.status);
    if (params.productType) query.set("productType", params.productType);
    if (params.stock) query.set("stock", params.stock);
    return request<ApiResponse<any[]>>(`/products?${query}`);
  },
  getProduct: (id: string) => request<any>(`/products/${id}`),
  createProduct: (data: any) =>
    request<any>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProduct: (id: string, data: any) =>
    request<any>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: string) =>
    request<any>(`/products/${id}`, { method: "DELETE" }),
  getLimitedStockProducts: (params: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.search) query.set("search", params.search);
    return request<ApiResponse<any[]>>(`/products/limited-stock?${query}`);
  },
  updateProductStock: (id: string, quantity: number) =>
    request<any>(`/products/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),

  // Export all products (no pagination limit)
  exportProducts: (params?: {
    search?: string;
    categoryId?: string;
    status?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.categoryId) query.set("categoryId", params.categoryId);
    if (params?.status) query.set("status", params.status);
    const queryString = query.toString();
    return request<{ data: any[]; total: number }>(`/products/export${queryString ? `?${queryString}` : ""}`);
  },

  // Bulk import products
  bulkImportProducts: (products: any[]) =>
    request<{ message: string; success: number; failed: number; errors: { row: number; error: string }[] }>(
      "/products/bulk-import",
      {
        method: "POST",
        body: JSON.stringify({ products }),
      }
    ),

  // Bulk delete products
  bulkDeleteProducts: (ids: string[]) =>
    request<{ message: string; deletedCount: number; errors: { id: string; error: string }[] }>(
      "/products/bulk-delete",
      {
        method: "POST",
        body: JSON.stringify({ ids }),
      }
    ),

  // Categories
  getCategories: (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.search) query.set("search", params.search);
    // `!== undefined`, not truthiness — `false` is a meaningful filter value.
    if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
    const queryString = query.toString();
    return request<{
      data: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/categories${queryString ? `?${queryString}` : ""}`);
  },
  getAllCategories: () => request<any[]>("/categories/all"),
  
  // Sub Categories
  getSubCategories: (params?: { page?: number; limit?: number; search?: string; parentId?: string; isActive?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.search) query.set("search", params.search);
    if (params?.parentId) query.set("parentId", params.parentId);
    // `!== undefined`, not truthiness — `false` is a meaningful filter value.
    if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
    const queryString = query.toString();
    return request<{
      data: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/categories/sub${queryString ? `?${queryString}` : ""}`);
  },
  getAllSubCategories: () => request<any[]>("/categories/sub/all"),
  
  // Sub Sub Categories
  getSubSubCategories: (params?: { page?: number; limit?: number; search?: string; parentId?: string; isActive?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.search) query.set("search", params.search);
    if (params?.parentId) query.set("parentId", params.parentId);
    // `!== undefined`, not truthiness — `false` is a meaningful filter value.
    if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
    const queryString = query.toString();
    return request<{
      data: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/categories/sub-sub${queryString ? `?${queryString}` : ""}`);
  },
  getAllSubSubCategories: () => request<any[]>("/categories/sub-sub/all"),

  createCategory: (data: any) =>
    request<any>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: any) =>
    request<any>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    request<any>(`/categories/${id}`, { method: "DELETE" }),

  // Banners
  getBanners: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    bannerType?: string;
    published?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.search) query.set("search", params.search);
    if (params?.bannerType) query.set("bannerType", params.bannerType);
    if (params?.published !== undefined) query.set("published", String(params.published));
    const queryString = query.toString();
    return request<ApiResponse<any[]>>(`/banners${queryString ? `?${queryString}` : ""}`);
  },
  createBanner: (data: any) =>
    request<any>("/banners", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateBanner: (id: string, data: any) =>
    request<any>(`/banners/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteBanner: (id: string) =>
    request<any>(`/banners/${id}`, { method: "DELETE" }),
  toggleBannerPublished: (id: string, published: boolean) =>
    request<any>(`/banners/${id}/published`, {
      method: "PATCH",
      body: JSON.stringify({ published }),
    }),

  // Orders
  getOrders: (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      /** Several statuses at once — sent comma-separated. Wins over `status`. */
      statuses?: string[];
      paymentState?: string;
      /**
       * The raw stored payment status. The backend's `paymentState` filter
       * wins over this one when both are sent, so use it alone when you need
       * a value `paymentState` doesn't expose — e.g. `partially_refunded`.
       */
      paymentStatus?: string;
      /** Payment method filter (cash, card, upi, wallet, cod, etc.) */
      paymentMethod?: string;
      orderChannel?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.statuses?.length) query.set("statuses", params.statuses.join(","));
    if (params.paymentState) query.set("paymentState", params.paymentState);
    if (params.paymentStatus) query.set("paymentStatus", params.paymentStatus);
    if (params.paymentMethod) query.set("paymentMethod", params.paymentMethod);
    if (params.orderChannel) query.set("orderChannel", params.orderChannel);
    if (params.dateFrom) query.set("dateFrom", params.dateFrom);
    if (params.dateTo) query.set("dateTo", params.dateTo);
    return request<ApiResponse<any[]>>(`/orders?${query}`, { signal });
  },
  getOrder: (id: string) => request<any>(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    request<any>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  updateOrderTracking: (
    id: string,
    data: { shippingProvider?: string; trackingNumber?: string; trackingUrl?: string }
  ) =>
    request<any>(`/orders/${id}/tracking`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  updateOrderAdminNote: (id: string, adminNote: string | null) =>
    request<any>(`/orders/${id}/note`, {
      method: "PATCH",
      body: JSON.stringify({ adminNote }),
    }),
  processOrderRefund: (id: string, refundAmountPaise: number) =>
    request<any>(`/orders/${id}/refund`, {
      method: "PATCH",
      body: JSON.stringify({ refundAmountPaise }),
    }),

  // POS Orders
  createPOSOrder: (data: {
    items: { productId: string; quantity: number; unitPricePaise: number }[];
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerFirstName?: string;
    customerLastName?: string;
    // Optional. Cashier-typed email. Only persisted if the user has no
    // email on file (existing emails are never overwritten from the till).
    customerEmail?: string | null;
    // Structured address typed at POS. When present, the cashier has
    // filled the full address (full name through pincode); the backend
    // saves it to the customer's profile (or uses it as a one-off
    // shipping snapshot, depending on the `saveAddressToProfile` flag
    // and the customer's existing address count). When omitted, the
    // order uses the legacy "In-Store Purchase" placeholder.
    customerAddress?: CustomerAddressInput;
    // Optional id of one of the customer's saved addresses. When set, the
    // order's shipping snapshot is taken from the Address row instead of
    // `customerAddress`.
    customerAddressId?: string;
    // When the cashier types a new address for a customer who already has
    // 1+ addresses, this flag controls whether to persist a new Address
    // row. Ignored when the customer has 0 addresses (auto-saved).
    saveAddressToProfile?: boolean;
    isWalkIn?: boolean;
    paymentMethod: "cash" | "card" | "upi";
    paymentReference?: string;
    couponCode?: string;
    extraDiscountPaise?: number;
    paidAmountPaise: number;
  }) =>
    request<{ message: string; data: any }>("/pos/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // POS Hold Orders
  getHoldOrders: () =>
    request<{ data: any[]; count: number }>("/pos/hold"),
  
  getHoldOrdersCount: () =>
    request<{ count: number }>("/pos/hold/count"),

  createHoldOrder: (data: {
    customerName?: string;
    customerPhone?: string;
    items: {
      productId: string;
      productName: string;
      productSku: string;
      productImage: string;
      quantity: number;
      unitPricePaise: number;
      stockQuantity: number;
    }[];
    couponCode?: string;
    extraDiscount?: number;
    note?: string;
  }) =>
    request<{ message: string; data: any }>("/pos/hold", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  deleteHoldOrder: (id: string) =>
    request<{ message: string; data: any }>(`/pos/hold/${id}`, {
      method: "DELETE",
    }),

  // POS Customers
  searchPOSCustomers: (phone: string) =>
    request<{ data: { id: string; mobileNumber: string; firstName: string; lastName: string; email: string | null; fullName: string }[] }>(
      `/pos/customers/search?phone=${encodeURIComponent(phone)}`
    ),

  getPOSCustomerAddresses: (customerId: string) =>
    request<{ data: Address[] }>(`/pos/customers/${customerId}/addresses`),

  // Users/Customers
  getUsers: (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    isBlocked?: string;
    isDeleted?: string;
    orderDateFrom?: string;
    orderDateTo?: string;
    joinDateFrom?: string;
    joinDateTo?: string;
    sortBy?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.isBlocked) query.set("isBlocked", params.isBlocked);
    if (params.isDeleted) query.set("isDeleted", params.isDeleted);
    if (params.orderDateFrom) query.set("orderDateFrom", params.orderDateFrom);
    if (params.orderDateTo) query.set("orderDateTo", params.orderDateTo);
    if (params.joinDateFrom) query.set("joinDateFrom", params.joinDateFrom);
    if (params.joinDateTo) query.set("joinDateTo", params.joinDateTo);
    if (params.sortBy) query.set("sortBy", params.sortBy);
    return request<ApiResponse<any[]>>(`/users?${query}`);
  },

  getUser: (id: string) => request<any>(`/users/${id}`),

  updateUserStatus: (id: string, status: string) =>
    request<any>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  toggleUserBlock: (id: string, isBlocked?: boolean) =>
    request<any>(`/users/${id}/block`, {
      method: "PATCH",
      body: JSON.stringify({ isBlocked }),
    }),

  deleteUser: (id: string) =>
    request<any>(`/users/${id}`, { method: "DELETE" }),

  restoreUser: (id: string) =>
    request<any>(`/users/${id}/restore`, { method: "PATCH" }),

  exportUsersCSV: (params: { search?: string; status?: string; isBlocked?: string }) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.isBlocked) query.set("isBlocked", params.isBlocked);
    return `${API_BASE_URL}/users/export/csv?${query}`;
  },

  // Promotions (legacy - keeping for backwards compatibility)
  getPromotions: (params: { page?: number; limit?: number; isActive?: boolean }) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.isActive !== undefined) query.set("isActive", params.isActive.toString());
    return request<ApiResponse<any[]>>(`/promotions?${query}`);
  },
  createPromotion: (data: any) =>
    request<any>("/promotions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePromotion: (id: string, data: any) =>
    request<any>(`/promotions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deletePromotion: (id: string) =>
    request<any>(`/promotions/${id}`, { method: "DELETE" }),
  togglePromotion: (id: string) =>
    request<any>(`/promotions/${id}/toggle`, { method: "PATCH" }),

  // Coupons (Offers & Deals module)
  getCoupons: (params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    scope?: string;
    isActive?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.search) query.set("search", params.search);
    if (params.type) query.set("type", params.type);
    if (params.scope) query.set("scope", params.scope);
    if (params.isActive !== undefined) query.set("isActive", params.isActive.toString());
    return request<{
      data: Coupon[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
      stats: { totalCoupons: number; activeCoupons: number; expiredCoupons: number; totalUsage: number };
    }>(`/offers-deals/coupons?${query}`);
  },
  getCoupon: (id: string) => request<Coupon>(`/offers-deals/coupons/${id}`),
  getCouponByCode: (code: string) => request<Coupon>(`/offers-deals/coupons/code/${code}`),
  createCoupon: (data: CreateCouponInput) =>
    request<Coupon>("/offers-deals/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCoupon: (id: string, data: Partial<CreateCouponInput>) =>
    request<Coupon>(`/offers-deals/coupons/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCoupon: (id: string) =>
    request<{ message: string }>(`/offers-deals/coupons/${id}`, { method: "DELETE" }),
  toggleCouponStatus: (id: string) =>
    request<Coupon>(`/offers-deals/coupons/${id}/toggle`, { method: "PATCH" }),
  generateCouponCode: (length?: number) => {
    const query = length ? `?length=${length}` : "";
    return request<{ code: string }>(`/offers-deals/coupons/generate-code${query}`);
  },
  checkCouponCode: (code: string) =>
    request<{ available: boolean; code: string }>(`/offers-deals/coupons/check-code/${code}`),

  // Flash Deals (Offers & Deals module)
  getFlashDeals: (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: "active" | "expired" | "upcoming";
    isPublished?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.isPublished !== undefined) query.set("isPublished", params.isPublished.toString());
    return request<{
      data: FlashDeal[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
      stats: { totalDeals: number; activeDeals: number; expiredDeals: number; upcomingDeals: number; totalProducts: number };
    }>(`/offers-deals/flash-deals?${query}`);
  },
  getFlashDeal: (id: string, includeProducts: boolean = false) => {
    const query = includeProducts ? "?includeProducts=true" : "";
    return request<FlashDeal>(`/offers-deals/flash-deals/${id}${query}`);
  },
  createFlashDeal: (data: CreateFlashDealInput) =>
    request<FlashDeal>("/offers-deals/flash-deals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateFlashDeal: (id: string, data: Partial<CreateFlashDealInput>) =>
    request<FlashDeal>(`/offers-deals/flash-deals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteFlashDeal: (id: string) =>
    request<{ message: string }>(`/offers-deals/flash-deals/${id}`, { method: "DELETE" }),
  toggleFlashDealPublish: (id: string) =>
    request<FlashDeal>(`/offers-deals/flash-deals/${id}/toggle-publish`, { method: "PATCH" }),
  addFlashDealProducts: (id: string, productIds: string[]) =>
    request<FlashDeal>(`/offers-deals/flash-deals/${id}/products`, {
      method: "POST",
      body: JSON.stringify({ productIds }),
    }),
  removeFlashDealProducts: (id: string, productIds: string[]) =>
    request<FlashDeal>(`/offers-deals/flash-deals/${id}/products`, {
      method: "DELETE",
      body: JSON.stringify({ productIds }),
    }),
  getAvailableFlashDealProducts: (id: string, params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.search) query.set("search", params.search);
    return request<{
      data: FlashDealProductInfo[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/offers-deals/flash-deals/${id}/available-products?${query}`);
  },

  // Storage Providers
  getStorageProviders: () => request<{ data: any[] }>("/storage-providers"),
  createStorageProvider: (data: any) =>
    request<any>("/storage-providers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStorageProvider: (id: string, data: any) =>
    request<any>(`/storage-providers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteStorageProvider: (id: string) =>
    request<any>(`/storage-providers/${id}`, { method: "DELETE" }),
  activateStorageProvider: (id: string) =>
    request<any>(`/storage-providers/${id}/activate`, { method: "PUT" }),
  deactivateStorageProvider: (id: string) =>
    request<any>(`/storage-providers/${id}/deactivate`, { method: "PUT" }),
  testStorageConnection: (providerId?: string) =>
    request<{ success: boolean; message: string; data?: any }>("/storage-providers/test-connection", {
      method: "POST",
      body: JSON.stringify({ providerId }),
    }),

  // Employees
  getEmployees: () => request<{ data: any[] }>("/employees"),
  createEmployee: (data: any) =>
    request<any>("/employees", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateEmployee: (id: string, data: any) =>
    request<any>(`/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteEmployee: (id: string) =>
    request<any>(`/employees/${id}`, { method: "DELETE" }),
  updateEmployeeStatus: (id: string, status: string) =>
    request<any>(`/employees/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // File Upload (Storage)
  uploadFile: async (file: File, folder: string = "misc", entityId?: string): Promise<{
    url: string;
    key: string;
    filename: string;
    size: number;
    contentType: string;
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    if (entityId) {
      formData.append("entityId", entityId);
    }

    const url = `${API_BASE_URL}/storage-providers/upload`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
      // Note: Don't set Content-Type header - browser will set it with boundary for FormData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Upload failed: HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  },

  // Permissions
  getPermissions: () => request<{ data: any[] }>("/permissions"),
  getEmployeePermissions: (employeeId: string) =>
    request<{ data: string[] }>(`/employees/${employeeId}/permissions`),
  assignEmployeePermissions: (employeeId: string, permissionKeys: string[]) =>
    request<any>(`/employees/${employeeId}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions: permissionKeys }),
    }),

  // ============================================
  // FILE EXPLORER API
  // ============================================
  explorerListFolder: (path: string = "", maxKeys: number = 1000) =>
    request<{ data: { items: any[]; path: string; hasMore: boolean } }>("/storage-providers/explorer/list", {
      method: "POST",
      body: JSON.stringify({ path, maxKeys }),
    }),

  explorerCreateFolder: (path: string) =>
    request<any>("/storage-providers/explorer/folder", {
      method: "POST",
      body: JSON.stringify({ path }),
    }),

  explorerCopy: (sourceKey: string, destinationKey: string, isFolder: boolean = false) =>
    request<any>("/storage-providers/explorer/copy", {
      method: "POST",
      body: JSON.stringify({ sourceKey, destinationKey, isFolder }),
    }),

  explorerMove: (sourceKey: string, destinationKey: string, isFolder: boolean = false) =>
    request<any>("/storage-providers/explorer/move", {
      method: "POST",
      body: JSON.stringify({ sourceKey, destinationKey, isFolder }),
    }),

  explorerRename: (key: string, newName: string, isFolder: boolean = false) =>
    request<any>("/storage-providers/explorer/rename", {
      method: "POST",
      body: JSON.stringify({ key, newName, isFolder }),
    }),

  explorerBulkDelete: (items: { key: string; isFolder: boolean }[]) =>
    request<any>("/storage-providers/explorer/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),

  explorerUpload: async (file: File, path: string = ""): Promise<{
    url: string;
    key: string;
    filename: string;
    size: number;
    contentType: string;
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);

    const url = `${API_BASE_URL}/storage-providers/explorer/upload`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Upload failed: HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  },
};
