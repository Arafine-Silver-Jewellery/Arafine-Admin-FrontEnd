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
  options: RequestInit = {}
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

  // Products
  getProducts: (params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.search) query.set("search", params.search);
    if (params.categoryId) query.set("categoryId", params.categoryId);
    if (params.status) query.set("status", params.status);
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

  // Orders
  getOrders: (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    orderChannel?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.paymentStatus) query.set("paymentStatus", params.paymentStatus);
    if (params.orderChannel) query.set("orderChannel", params.orderChannel);
    if (params.dateFrom) query.set("dateFrom", params.dateFrom);
    if (params.dateTo) query.set("dateTo", params.dateTo);
    return request<ApiResponse<any[]>>(`/orders?${query}`);
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
    paymentMethod: "cash" | "card";
    couponCode?: string;
    couponDiscountPaise?: number;
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
    couponDiscount?: number;
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

  // Users
  getUsers: (params: { page?: number; limit?: number; search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    return request<ApiResponse<any[]>>(`/users?${query}`);
  },
  updateUserStatus: (id: string, status: string) =>
    request<any>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

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
};
