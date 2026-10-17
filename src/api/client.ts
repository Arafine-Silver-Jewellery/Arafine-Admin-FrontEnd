import { API_BASE_URL } from "../config/env";

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
  getDashboardTrend: (params: { metric?: "revenue" | "orders" | "products" | "users"; range?: "7d" | "30d" | "90d" | "all" } = {}) => {
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

  // Products
  getProducts: (params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
    productType?: "physical" | "digital";
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.search) query.set("search", params.search);
    if (params.categoryId) query.set("categoryId", params.categoryId);
    if (params.status) query.set("status", params.status);
    if (params.productType) query.set("productType", params.productType);
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
  bulkUpdateProductStatus: (ids: string[], status: string) =>
    request<any>("/products/bulk/status", {
      method: "PATCH",
      body: JSON.stringify({ ids, status }),
    }),
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
  getCategories: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.search) query.set("search", params.search);
    const queryString = query.toString();
    return request<{
      data: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/categories${queryString ? `?${queryString}` : ""}`);
  },
  getAllCategories: () => request<any[]>("/categories/all"),
  
  // Sub Categories
  getSubCategories: (params?: { page?: number; limit?: number; search?: string; parentId?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.search) query.set("search", params.search);
    if (params?.parentId) query.set("parentId", params.parentId);
    const queryString = query.toString();
    return request<{
      data: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/categories/sub${queryString ? `?${queryString}` : ""}`);
  },
  getAllSubCategories: () => request<any[]>("/categories/sub/all"),
  
  // Sub Sub Categories
  getSubSubCategories: (params?: { page?: number; limit?: number; search?: string; parentId?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.search) query.set("search", params.search);
    if (params?.parentId) query.set("parentId", params.parentId);
    const queryString = query.toString();
    return request<{
      data: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/categories/sub-sub${queryString ? `?${queryString}` : ""}`);
  },
  getAllSubSubCategories: () => request<any[]>("/categories/sub-sub/all"),
  
  getCategory: (id: string) => request<any>(`/categories/${id}`),
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
  getBanner: (id: string) => request<any>(`/banners/${id}`),
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
      paymentState?: string;
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
    if (params.paymentState) query.set("paymentState", params.paymentState);
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
    customerAddress?: string;
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
  
  getHoldOrder: (id: string) =>
    request<{ data: any }>(`/pos/hold/${id}`),
  
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
  
  updateHoldOrder: (id: string, data: { note?: string; customerName?: string; customerPhone?: string }) =>
    request<{ message: string; data: any }>(`/pos/hold/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  
  deleteHoldOrder: (id: string) =>
    request<{ message: string; data: any }>(`/pos/hold/${id}`, {
      method: "DELETE",
    }),

  // POS Customers
  searchPOSCustomers: (phone: string) =>
    request<{ data: { id: string; mobileNumber: string; firstName: string; lastName: string; fullName: string }[] }>(
      `/pos/customers/search?phone=${encodeURIComponent(phone)}`
    ),
  
  getPOSCustomerByPhone: (phone: string) =>
    request<{ data: { id: string; mobileNumber: string; firstName: string; lastName: string; fullName: string } }>(
      `/pos/customers/by-phone/${encodeURIComponent(phone)}`
    ),
  
  createPOSCustomer: (data: { mobileNumber: string; firstName: string; lastName?: string }) =>
    request<{ message: string; data: { id: string; mobileNumber: string; firstName: string; lastName: string; fullName: string; isNew: boolean } }>(
      "/pos/customers",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

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

  // Promotions
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

  // SMTP Configs
  getSmtpConfigs: () => request<{ data: any[] }>("/smtp-configs"),
  getSmtpConfig: (id: string) => request<any>(`/smtp-configs/${id}`),
  createSmtpConfig: (data: any) =>
    request<any>("/smtp-configs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSmtpConfig: (id: string, data: any) =>
    request<any>(`/smtp-configs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteSmtpConfig: (id: string) =>
    request<any>(`/smtp-configs/${id}`, { method: "DELETE" }),
  activateSmtpConfig: (id: string) =>
    request<any>(`/smtp-configs/${id}/activate`, { method: "PUT" }),
  deactivateSmtpConfig: (id: string) =>
    request<any>(`/smtp-configs/${id}/deactivate`, { method: "PUT" }),

  // Storage Providers
  getStorageProviders: () => request<{ data: any[] }>("/storage-providers"),
  getStorageProvider: (id: string) => request<any>(`/storage-providers/${id}`),
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
  getEmployee: (id: string) => request<any>(`/employees/${id}`),
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

  explorerDeleteFolder: (path: string) =>
    request<any>("/storage-providers/explorer/folder", {
      method: "DELETE",
      body: JSON.stringify({ path }),
    }),

  explorerBulkDelete: (items: { key: string; isFolder: boolean }[]) =>
    request<any>("/storage-providers/explorer/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),

  explorerGetFileInfo: (key: string) =>
    request<any>("/storage-providers/explorer/info", {
      method: "POST",
      body: JSON.stringify({ key }),
    }),

  explorerGetStats: () =>
    request<any>("/storage-providers/explorer/stats"),

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
