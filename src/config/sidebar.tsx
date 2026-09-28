// Sidebar menu configuration with permission keys

export interface MenuItem {
  path: string;
  label: string;
  count?: number;
  permission?: string; // Permission key for this item
}

export interface MenuSection {
  id: string;
  label: string;
  permission: string; // Permission key for this section
  icon: React.ReactNode;
  badge?: number;
  items?: MenuItem[];
  path?: string; // For direct links (no submenu)
}

// Submenu items configuration
export const orderSubmenus: MenuItem[] = [
  { path: "/orders-management", label: "All", count: 87 },
  { path: "/orders-management/pending", label: "Pending", count: 0 },
  { path: "/orders-management/confirmed", label: "Confirmed", count: 50 },
  { path: "/orders-management/packaging", label: "Packaging", count: 0 },
  { path: "/orders-management/out-for-delivery", label: "Out for delivery", count: 0 },
  { path: "/orders-management/delivered", label: "Delivered", count: 17 },
  { path: "/orders-management/returned", label: "Returned", count: 0 },
  { path: "/orders-management/failed-to-deliver", label: "Failed to Deliver", count: 0 },
  { path: "/orders-management/canceled", label: "Canceled", count: 20 },
];

export const refundSubmenus: MenuItem[] = [
  { path: "/refund-requests", label: "Pending", count: 0 },
  { path: "/refund-requests/approved", label: "Approved", count: 0 },
  { path: "/refund-requests/refunded", label: "Refunded", count: 0 },
  { path: "/refund-requests/rejected", label: "Rejected", count: 0 },
];

export const categorySubmenus: MenuItem[] = [
  { path: "/category-setup", label: "Categories" },
  { path: "/category-setup/sub-categories", label: "Sub Categories" },
  { path: "/category-setup/sub-sub-categories", label: "Sub Sub Categories" },
];

export const productsSubmenus: MenuItem[] = [
  { path: "/products-module", label: "Product List", count: 242 },
  { path: "/products-module/limited-stock", label: "Limited Stock" },
  { path: "/products-module/bulk-import", label: "Bulk Import" },
  { path: "/products-module/restock-requests", label: "Request Restock List" },
];

export const offersDealsSubmenus: MenuItem[] = [
  { path: "/offers-deals/coupon", label: "Coupon" },
  { path: "/offers-deals/flash-deals", label: "Flash Deals" },
  { path: "/offers-deals/deal-of-the-day", label: "Deal of the day" },
  { path: "/offers-deals/featured-deal", label: "Featured Deal" },
  { path: "/offers-deals/clearance-sale", label: "Clearance Sale" },
];

export const notificationsSubmenus: MenuItem[] = [
  { path: "/notifications/send", label: "Send Notification" },
  { path: "/notifications/push-setup", label: "Push Notifications Setup" },
];

export const reportsSubmenus: MenuItem[] = [
  { path: "/reports/earning", label: "Earning Reports" },
  { path: "/reports/inhouse-sales", label: "Inhouse Sales" },
  { path: "/reports/vendor-sales", label: "Vendor Sales" },
  { path: "/reports/transactions", label: "Transaction Report" },
];

export const customersSubmenus: MenuItem[] = [
  { path: "/customers/list", label: "Customer List" },
  { path: "/customers/reviews", label: "Customer Reviews" },
  { path: "/customers/wallet", label: "Wallet" },
  { path: "/customers/wallet-bonus", label: "Wallet Bonus Setup" },
  { path: "/customers/loyalty-points", label: "Loyalty Points" },
];

// Main menu structure with permission keys
export const sidebarSections = [
  // General
  { permission: "dashboard", path: "/", label: "Dashboard" },
  { permission: "pos", path: "/pos", label: "POS" },
  
  // Order Management
  { permission: "orders", submenuKey: "orders", label: "Orders", badge: 87 },
  { permission: "refund-requests", submenuKey: "refunds", label: "Refund Requests" },
  
  // Product Management
  { permission: "category-setup", submenuKey: "categories", label: "Category Setup" },
  { permission: "products-module", submenuKey: "products", label: "Products", badge: 242 },
  
  // Promotion Management
  { permission: "banners", path: "/banners", label: "Banner Setup" },
  { permission: "offers-deals", submenuKey: "offers", label: "Offers & Deals" },
  { permission: "notifications", submenuKey: "notifications", label: "Notifications" },
  
  // Reports
  { permission: "reports", submenuKey: "reports", label: "Sales & Transaction Report" },
  { permission: "product-report", path: "/reports/product", label: "Product Report" },
  { permission: "order-report", path: "/reports/order", label: "Order Report" },
  
  // Help & Support
  { permission: "inbox", path: "/inbox", label: "Inbox" },
  { permission: "messages", path: "/messages", label: "Messages" },
  { permission: "support-ticket", path: "/support-ticket", label: "Support Ticket" },
  
  // User Management
  { permission: "customers", submenuKey: "customers", label: "Customers" },
  { permission: "employees", path: "/employees", label: "Employees" },
  
  // Settings
  { permission: "smtp", path: "/smtp", label: "SMTP" },
  { permission: "storage", path: "/storage", label: "Storage" },
];

// Route to permission mapping for route protection
export const routePermissions: Record<string, string> = {
  "/": "dashboard",
  "/pos": "pos",
  "/orders-management": "orders",
  "/refund-requests": "refund-requests",
  "/category-setup": "category-setup",
  "/products-module": "products-module",
  "/banners": "banners",
  "/offers-deals": "offers-deals",
  "/notifications": "notifications",
  "/reports/earning": "reports",
  "/reports/inhouse-sales": "reports",
  "/reports/vendor-sales": "reports",
  "/reports/transactions": "reports",
  "/reports/product": "product-report",
  "/reports/order": "order-report",
  "/inbox": "inbox",
  "/messages": "messages",
  "/support-ticket": "support-ticket",
  "/customers": "customers",
  "/employees": "employees",
  "/smtp": "smtp",
  "/storage": "storage",
};

// Get permission for a route (handles nested routes)
export function getRoutePermission(pathname: string): string | null {
  // Direct match
  if (routePermissions[pathname]) {
    return routePermissions[pathname];
  }
  
  // Check parent routes
  for (const [route, permission] of Object.entries(routePermissions)) {
    if (pathname.startsWith(route + "/") || pathname.startsWith(route)) {
      return permission;
    }
  }
  
  return null;
}
