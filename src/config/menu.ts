/**
 * The admin menu, described once.
 *
 * This is the single source of truth for what the admin panel can navigate
 * to. Both the sidebar and the top-bar search read from it, so a screen can
 * never be visible in one and missing from the other.
 *
 * `permission` is the key that `src/App.tsx` requires for the matching route
 * — NOT the key the sidebar happens to use. The two differ for exactly one
 * item (/storage), and matching the route is what keeps search from offering
 * a link that lands on "Access Denied".
 *
 * Icons deliberately live with the markup in `Layout.tsx` rather than here:
 * they are inline SVGs, and moving them into data would mean a large,
 * risky refactor of the nav for no benefit. The search dropdown shows the
 * label and the path, which needs no icon.
 */

export interface MenuItem {
  /** Route to navigate to. */
  path: string;
  /** What the sidebar and the search results call this screen. */
  label: string;
  /** The sidebar section this item sits under. */
  group: string;
  /**
   * Permission required to open the screen.
   *
   * An array means "any of these" — the same OR semantics `hasPermission`
   * uses. `/storage` is the one place that needs it: the sidebar checks
   * `hasPermission("storage")` while the route guard in App.tsx checked
   * `permission="storage-settings"`, so a user holding only one of the two
   * keys could see the link and then hit "Access Denied". Both the route
   * guard and this file now accept either key.
   */
  permission: string | string[];
  /**
   * Extra terms that should match this screen but do not appear in its
   * label — e.g. "orders" for "Order Management", "reports" for a report
   * screen. Matched against the same haystack as the label and path.
   */
  keywords?: string[];
}

/**
 * Every screen the admin panel can reach, grouped by sidebar section.
 *
 * 38 entries: 16 top-level links + 22 submenu screens. Keep this in step
 * with the nav markup in `src/components/Layout.tsx` — that markup renders
 * the sidebar and this list drives the search, so a screen added to one and
 * not the other would be reachable by clicking but not by searching.
 *
 * The search results are grouped by `group`, in the order the sections
 * appear here.
 */
export const MENU_ITEMS: MenuItem[] = [
  // ── General (no section heading) ──
  { path: "/", label: "Dashboard", group: "General", permission: "dashboard" },
  { path: "/pos", label: "POS", group: "General", permission: "pos" },

  // ── Order Management ──
  {
    path: "/orders-management",
    label: "Orders",
    group: "Order Management",
    permission: "orders",
    keywords: ["order", "sales", "all orders"],
  },
  {
    path: "/refund-requests",
    label: "Refund Requests",
    group: "Order Management",
    permission: "refund-requests",
    keywords: ["refund", "return"],
  },

  // ── Product Management ──
  {
    path: "/category-setup",
    label: "Categories",
    group: "Product Management",
    permission: "category-setup",
    keywords: ["category"],
  },
  {
    path: "/category-setup/sub-categories",
    label: "Sub Categories",
    group: "Product Management",
    permission: "category-setup",
    keywords: ["category"],
  },
  {
    path: "/category-setup/sub-sub-categories",
    label: "Sub Sub Categories",
    group: "Product Management",
    permission: "category-setup",
    keywords: ["category"],
  },
  {
    path: "/products-module/add-new",
    label: "Add New Product",
    group: "Product Management",
    permission: "products-module",
    keywords: ["create", "new", "product"],
  },
  {
    path: "/products-module",
    label: "Product List",
    group: "Product Management",
    permission: "products-module",
    keywords: ["products", "inventory", "catalogue"],
  },
  {
    path: "/products-module/limited-stock",
    label: "Limited Stock",
    group: "Product Management",
    permission: "products-module",
    keywords: ["low stock", "inventory"],
  },
  {
    path: "/products-module/bulk-import",
    label: "Bulk Import",
    group: "Product Management",
    permission: "products-module",
    keywords: ["import", "upload", "csv", "excel"],
  },
  {
    path: "/products-module/restock-requests",
    label: "Request Restock List",
    group: "Product Management",
    permission: "products-module",
    keywords: ["restock", "reorder", "stock"],
  },

  // ── Promotion Management ──
  {
    path: "/banners",
    label: "Banner Setup",
    group: "Promotion Management",
    permission: "banners",
    keywords: ["banner", "carousel", "slider"],
  },
  {
    path: "/offers-deals/coupon",
    label: "Coupon",
    group: "Promotion Management",
    permission: "offers-deals",
    keywords: ["offer", "deal", "discount", "promo"],
  },
  {
    path: "/offers-deals/offers",
    label: "Offers",
    group: "Promotion Management",
    permission: "offers-deals",
    keywords: ["offer", "bogo", "bundle", "clearance", "deal", "discount", "promo"],
  },
  {
    path: "/campaigns",
    label: "Campaigns",
    group: "Promotion Management",
    permission: "promotions",
    keywords: ["campaign", "email", "push", "in-app", "blast", "marketing", "promo", "announcement"],
  },
  {
    path: "/offers-deals/flash-deals",
    label: "Flash Deals",
    group: "Promotion Management",
    permission: "offers-deals",
    keywords: ["offer", "deal", "discount", "promo"],
  },
  {
    path: "/offers-deals/deal-of-the-day",
    label: "Deal of the day",
    group: "Promotion Management",
    permission: "offers-deals",
    keywords: ["offer", "deal", "discount", "promo"],
  },
  {
    path: "/offers-deals/featured-deal",
    label: "Featured Deal",
    group: "Promotion Management",
    permission: "offers-deals",
    keywords: ["offer", "deal", "discount", "promo"],
  },
  {
    path: "/offers-deals/clearance-sale",
    label: "Clearance Sale",
    group: "Promotion Management",
    permission: "offers-deals",
    keywords: ["offer", "deal", "discount", "promo", "sale"],
  },
  {
    path: "/notifications/send",
    label: "Send Notification",
    group: "Promotion Management",
    permission: "notifications",
    keywords: ["notification", "push", "message", "alert"],
  },
  {
    path: "/notifications/push-setup",
    label: "Push Notifications Setup",
    group: "Promotion Management",
    permission: "notifications",
    keywords: ["notification", "push", "firebase", "fcm"],
  },

  // ── Sales & Transaction Report ──
  {
    path: "/reports/earning",
    label: "Earning Reports",
    group: "Sales & Transaction Report",
    permission: "reports",
    keywords: ["earning", "revenue", "income", "report"],
  },
  {
    path: "/reports/inhouse-sales",
    label: "Inhouse Sales",
    group: "Sales & Transaction Report",
    permission: "reports",
    keywords: ["sales", "report", "own products"],
  },
  {
    path: "/reports/vendor-sales",
    label: "Vendor Sales",
    group: "Sales & Transaction Report",
    permission: "reports",
    keywords: ["sales", "report", "seller"],
  },
  {
    path: "/reports/transactions",
    label: "Transaction Report",
    group: "Sales & Transaction Report",
    permission: "reports",
    keywords: ["transaction", "payment", "report"],
  },
  {
    path: "/reports/product",
    label: "Product Report",
    group: "Sales & Transaction Report",
    permission: "product-report",
    keywords: ["product", "report"],
  },
  {
    path: "/reports/order",
    label: "Order Report",
    group: "Sales & Transaction Report",
    permission: "order-report",
    keywords: ["order", "report"],
  },
  {
    path: "/reports/stock",
    label: "Stock Report",
    group: "Sales & Transaction Report",
    permission: "product-report",
    keywords: ["stock", "inventory", "movement", "warehouse", "report"],
  },

  // ── Help & Support ──
  {
    path: "/inbox",
    label: "Inbox",
    group: "Help & Support",
    permission: "inbox",
    keywords: ["mail", "messages"],
  },
  {
    path: "/messages",
    label: "Messages",
    group: "Help & Support",
    permission: "messages",
    keywords: ["chat", "conversation"],
  },
  {
    path: "/support-ticket",
    label: "Support Ticket",
    group: "Help & Support",
    permission: "support-ticket",
    keywords: ["ticket", "help", "complaint"],
  },
  {
    path: "/faqs",
    label: "FAQs",
    group: "Help & Support",
    permission: "faq-management",
    keywords: ["faq", "question", "answer", "help"],
  },

  // ── User Management ──
  {
    path: "/customers/list",
    label: "Customer List",
    group: "User Management",
    permission: "customers",
    keywords: ["customer", "user", "buyer"],
  },
  {
    path: "/customers/reviews",
    label: "Customer Reviews",
    group: "User Management",
    permission: "customers",
    keywords: ["customer", "rating", "feedback"],
  },
  {
    path: "/customers/wallet",
    label: "Wallet",
    group: "User Management",
    permission: "customers",
    keywords: ["customer", "balance", "credit"],
  },
  {
    path: "/customers/wallet-bonus",
    label: "Wallet Bonus Setup",
    group: "User Management",
    permission: "customers",
    keywords: ["customer", "wallet", "bonus", "reward"],
  },
  {
    path: "/customers/loyalty-points",
    label: "Loyalty Points",
    group: "User Management",
    permission: "customers",
    keywords: ["customer", "points", "reward"],
  },
  {
    path: "/customers/subscriptions",
    label: "Customer Subscriptions",
    group: "User Management",
    permission: "subscriptions",
    keywords: ["subscription", "member", "plan", "subscriber", "renewal"],
  },
  {
    path: "/customers/subscription-plans",
    label: "Subscription Plans",
    group: "User Management",
    permission: "subscriptions",
    keywords: ["subscription", "plan", "tier", "premium", "vip", "pricing"],
  },
  {
    path: "/employees",
    label: "Employees",
    group: "User Management",
    permission: "employees",
    keywords: ["employee", "staff", "team"],
  },

  // ── Settings ──
  {
    // Either key grants access — see the note on MenuItem.permission. The
    // sidebar shows this under hasPermission("storage"), and the route
    // guard accepted only "storage-settings"; accepting both means the link
    // is never a dead end.
    path: "/storage",
    label: "Storage",
    group: "Settings",
    permission: ["storage", "storage-settings"],
    keywords: ["storage", "s3", "files", "provider"],
  },
  {
    path: "/settings",
    label: "Settings",
    group: "Settings",
    permission: [],
    keywords: ["settings", "configuration", "preferences", "business", "payment", "shipping", "security", "system"],
  },
];
