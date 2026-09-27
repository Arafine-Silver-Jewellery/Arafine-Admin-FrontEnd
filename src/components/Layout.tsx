import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/layout.css";

const orderSubmenus = [
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

const refundSubmenus = [
  { path: "/refund-requests", label: "Pending", count: 0 },
  { path: "/refund-requests/approved", label: "Approved", count: 0 },
  { path: "/refund-requests/refunded", label: "Refunded", count: 0 },
  { path: "/refund-requests/rejected", label: "Rejected", count: 0 },
];

const categorySubmenus = [
  { path: "/category-setup", label: "Categories" },
  { path: "/category-setup/sub-categories", label: "Sub Categories" },
  { path: "/category-setup/sub-sub-categories", label: "Sub Sub Categories" },
];

const productsSubmenus = [
  { path: "/products-module", label: "Product List", count: 242 },
  { path: "/products-module/limited-stock", label: "Limited Stock" },
  { path: "/products-module/bulk-import", label: "Bulk Import" },
  { path: "/products-module/restock-requests", label: "Request Restock List" },
];

const offersDealsSubmenus = [
  { path: "/offers-deals/coupon", label: "Coupon" },
  { path: "/offers-deals/flash-deals", label: "Flash Deals" },
  { path: "/offers-deals/deal-of-the-day", label: "Deal of the day" },
  { path: "/offers-deals/featured-deal", label: "Featured Deal" },
  { path: "/offers-deals/clearance-sale", label: "Clearance Sale" },
];

const notificationsSubmenus = [
  { path: "/notifications/send", label: "Send Notification" },
  { path: "/notifications/push-setup", label: "Push Notifications Setup" },
];

const reportsSubmenus = [
  { path: "/reports/earning", label: "Earning Reports" },
  { path: "/reports/inhouse-sales", label: "Inhouse Sales" },
  { path: "/reports/vendor-sales", label: "Vendor Sales" },
  { path: "/reports/transactions", label: "Transaction Report" },
  { path: "/reports/product", label: "Product Report" },
  { path: "/reports/order", label: "Order Report" },
  { path: "/reports/admin-tax", label: "Admin Tax Report" },
  { path: "/reports/vendor-vat", label: "Vendor Vat Report" },
];

const customersSubmenus = [
  { path: "/customers/list", label: "Customer List" },
  { path: "/customers/reviews", label: "Customer Reviews" },
  { path: "/customers/wallet", label: "Wallet" },
  { path: "/customers/wallet-bonus", label: "Wallet Bonus Setup" },
  { path: "/customers/loyalty-points", label: "Loyalty Points" },
];

// Page title mapping based on route
const pageTitleMap: Record<string, { title: string; icon: string; count?: number }> = {
  "/": { title: "Dashboard", icon: "dashboard" },
  "/pos": { title: "POS", icon: "pos" },
  "/orders-management": { title: "All Orders", icon: "orders", count: 87 },
  "/orders-management/pending": { title: "Pending Orders", icon: "orders" },
  "/orders-management/confirmed": { title: "Confirmed Orders", icon: "orders", count: 50 },
  "/orders-management/packaging": { title: "Packaging Orders", icon: "orders" },
  "/orders-management/out-for-delivery": { title: "Out for Delivery", icon: "orders" },
  "/orders-management/delivered": { title: "Delivered Orders", icon: "orders", count: 17 },
  "/orders-management/returned": { title: "Returned Orders", icon: "orders" },
  "/orders-management/failed-to-deliver": { title: "Failed to Deliver", icon: "orders" },
  "/orders-management/canceled": { title: "Canceled Orders", icon: "orders", count: 20 },
  "/refund-requests": { title: "Pending Refunds", icon: "refund" },
  "/refund-requests/approved": { title: "Approved Refunds", icon: "refund" },
  "/refund-requests/refunded": { title: "Refunded", icon: "refund" },
  "/refund-requests/rejected": { title: "Rejected Refunds", icon: "refund" },
  "/category-setup": { title: "Categories", icon: "category" },
  "/category-setup/sub-categories": { title: "Sub Categories", icon: "category" },
  "/category-setup/sub-sub-categories": { title: "Sub Sub Categories", icon: "category" },
  "/brand-setup": { title: "Brand Setup", icon: "brand" },
  "/products-module": { title: "In House Product List", icon: "product", count: 6 },
  "/products-module/add-new": { title: "Add New Product", icon: "product" },
  "/products-module/limited-stock": { title: "Limited Stock Products", icon: "product" },
  "/products-module/bulk-import": { title: "Bulk Import", icon: "product" },
  "/products-module/restock-requests": { title: "Restock Requests", icon: "product" },
  "/product-gallery": { title: "Product Gallery", icon: "gallery" },
  "/attribute-setup": { title: "Attribute Setup", icon: "attribute" },
  "/banner-setup": { title: "Banner Setup", icon: "banner" },
  "/banners": { title: "Banner Setup", icon: "banner" },
  "/offers-deals/coupon": { title: "Coupon", icon: "offer" },
  "/offers-deals/flash-deals": { title: "Flash Deals", icon: "offer" },
  "/offers-deals/deal-of-the-day": { title: "Deal of the Day", icon: "offer" },
  "/offers-deals/featured-deal": { title: "Featured Deal", icon: "offer" },
  "/offers-deals/clearance-sale": { title: "Clearance Sale", icon: "offer" },
  "/notifications/send": { title: "Send Notification", icon: "notification" },
  "/notifications/push-setup": { title: "Push Notification Setup", icon: "notification" },
  "/help-support": { title: "Help & Support", icon: "support" },
  "/reports/earning": { title: "Earning Reports", icon: "report" },
  "/reports/inhouse-sales": { title: "Inhouse Sales", icon: "report" },
  "/reports/vendor-sales": { title: "Vendor Sales", icon: "report" },
  "/reports/transactions": { title: "Transaction Report", icon: "report" },
  "/reports/product": { title: "Product Report", icon: "report" },
  "/reports/order": { title: "Order Report", icon: "report" },
  "/customers/list": { title: "Customer List", icon: "customer" },
  "/customers/reviews": { title: "Customer Reviews", icon: "customer" },
  "/customers/wallet": { title: "Wallet", icon: "wallet" },
  "/customers/wallet-bonus": { title: "Wallet Bonus Setup", icon: "wallet" },
  "/customers/loyalty-points": { title: "Loyalty Points", icon: "loyalty" },
  "/inbox": { title: "Inbox", icon: "inbox" },
  "/messages": { title: "Messages", icon: "messages" },
  "/support-ticket": { title: "Support Ticket", icon: "support" },
  "/employees": { title: "Employees", icon: "employee" },
  "/smtp": { title: "SMTP Configuration", icon: "settings" },
  "/storage": { title: "Storage Providers", icon: "storage" },
};

function getPageTitle(pathname: string): { title: string; icon: string; count?: number } {
  // Direct match
  if (pageTitleMap[pathname]) {
    return pageTitleMap[pathname];
  }
  // Default
  return { title: "Dashboard", icon: "dashboard" };
}

export default function Layout() {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [ordersExpanded, setOrdersExpanded] = useState(location.pathname.startsWith("/orders-management"));
  const [refundsExpanded, setRefundsExpanded] = useState(location.pathname.startsWith("/refund-requests"));
  const [categoryExpanded, setCategoryExpanded] = useState(location.pathname.startsWith("/category-setup"));
  const [productsExpanded, setProductsExpanded] = useState(location.pathname.startsWith("/products-module"));
  const [offersDealsExpanded, setOffersDealsExpanded] = useState(location.pathname.startsWith("/offers-deals"));
  const [notificationsExpanded, setNotificationsExpanded] = useState(location.pathname.startsWith("/notifications"));
  const [reportsExpanded, setReportsExpanded] = useState(location.pathname.startsWith("/reports"));
  const [customersExpanded, setCustomersExpanded] = useState(location.pathname.startsWith("/customers"));
  const [searchQuery, setSearchQuery] = useState("");

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const isOrdersActive = location.pathname.startsWith("/orders-management");
  const isRefundsActive = location.pathname.startsWith("/refund-requests");
  const isCategoryActive = location.pathname.startsWith("/category-setup");
  const isProductsActive = location.pathname.startsWith("/products-module");
  const isOffersDealsActive = location.pathname.startsWith("/offers-deals");
  const isNotificationsActive = location.pathname.startsWith("/notifications");
  const isReportsActive = location.pathname.startsWith("/reports");
  const isCustomersActive = location.pathname.startsWith("/customers");

  const currentPage = getPageTitle(location.pathname);

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img 
            src="https://arafine.co/storage/app/public/company/2026-06-04-6a218bac104aa.webp" 
            alt="Arafine" 
            className="sidebar-logo"
          />
        </div>
        
        <div className="sidebar-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input 
            type="text" 
            placeholder="Search menu" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
            Dashboard
          </NavLink>
          <NavLink to="/pos" className={({ isActive }) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            POS
          </NavLink>
          
          <div className="sidebar-divider" />
          <span className="sidebar-label">Order Management</span>
          
          <div className={`nav-item-with-submenu ${isOrdersActive ? "expanded" : ""}`}>
            <button 
              className={`nav-toggle ${isOrdersActive ? "active" : ""}`}
              onClick={() => setOrdersExpanded(!ordersExpanded)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Orders</span>
              <span className="nav-badge">87</span>
              <svg className={`chevron ${ordersExpanded ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            {ordersExpanded && (
              <div className="submenu">
                {orderSubmenus.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/orders-management"}
                    className={({ isActive }) => `submenu-item ${isActive ? "active" : ""}`}
                  >
                    <span>{item.label}</span>
                    <span className="submenu-count">{item.count}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <div className={`nav-item-with-submenu ${isRefundsActive ? "expanded" : ""}`}>
            <button 
              className={`nav-toggle ${isRefundsActive ? "active" : ""}`}
              onClick={() => setRefundsExpanded(!refundsExpanded)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23,4 23,10 17,10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>Refund Requests</span>
              <svg className={`chevron ${refundsExpanded ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            {refundsExpanded && (
              <div className="submenu">
                {refundSubmenus.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/refund-requests"}
                    className={({ isActive }) => `submenu-item ${isActive ? "active" : ""}`}
                  >
                    <span>{item.label}</span>
                    <span className="submenu-count">{item.count}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
          
          <div className="sidebar-divider" />
          <span className="sidebar-label">Product Management</span>
          
          <div className={`nav-item-with-submenu ${isCategoryActive ? "expanded" : ""}`}>
            <button 
              className={`nav-toggle ${isCategoryActive ? "active" : ""}`}
              onClick={() => setCategoryExpanded(!categoryExpanded)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Category Setup</span>
              <svg className={`chevron ${categoryExpanded ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            {categoryExpanded && (
              <div className="submenu">
                {categorySubmenus.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/category-setup"}
                    className={({ isActive }) => `submenu-item ${isActive ? "active" : ""}`}
                  >
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
          
          <div className={`nav-item-with-submenu ${isProductsActive ? "expanded" : ""}`}>
            <button 
              className={`nav-toggle ${isProductsActive ? "active" : ""}`}
              onClick={() => setProductsExpanded(!productsExpanded)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span>Products</span>
              <span className="nav-badge">242</span>
              <svg className={`chevron ${productsExpanded ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            {productsExpanded && (
              <div className="submenu">
                {productsSubmenus.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/products-module"}
                    className={({ isActive }) => `submenu-item ${isActive ? "active" : ""}`}
                  >
                    <span>{item.label}</span>
                    {item.count !== undefined && <span className="submenu-count">{item.count}</span>}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
          
          <div className="sidebar-divider" />
          <span className="sidebar-label">Promotion Management</span>
          
          <NavLink to="/banners" className={({ isActive }) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
            Banner Setup
          </NavLink>
          
          <div className={`nav-item-with-submenu ${isOffersDealsActive ? "expanded" : ""}`}>
            <button 
              className={`nav-toggle ${isOffersDealsActive ? "active" : ""}`}
              onClick={() => setOffersDealsExpanded(!offersDealsExpanded)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
              </svg>
              <span>Offers & Deals</span>
              <svg className={`chevron ${offersDealsExpanded ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            {offersDealsExpanded && (
              <div className="submenu">
                {offersDealsSubmenus.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `submenu-item ${isActive ? "active" : ""}`}
                  >
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <div className={`nav-item-with-submenu ${isNotificationsActive ? "expanded" : ""}`}>
            <button 
              className={`nav-toggle ${isNotificationsActive ? "active" : ""}`}
              onClick={() => setNotificationsExpanded(!notificationsExpanded)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>Notifications</span>
              <svg className={`chevron ${notificationsExpanded ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            {notificationsExpanded && (
              <div className="submenu">
                {notificationsSubmenus.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `submenu-item ${isActive ? "active" : ""}`}
                  >
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar-divider" />
          <span className="sidebar-label">Sales & Transaction Report</span>

          <div className={`nav-item-with-submenu ${isReportsActive && location.pathname.includes("/reports/earning") || location.pathname.includes("/reports/inhouse") || location.pathname.includes("/reports/vendor-sales") || location.pathname.includes("/reports/transactions") ? "expanded" : ""}`}>
            <button 
              className={`nav-toggle ${location.pathname.includes("/reports/earning") || location.pathname.includes("/reports/inhouse") || location.pathname.includes("/reports/vendor-sales") || location.pathname.includes("/reports/transactions") ? "active" : ""}`}
              onClick={() => setReportsExpanded(!reportsExpanded)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Sales & Transaction Report</span>
              <svg className={`chevron ${reportsExpanded ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            {reportsExpanded && (
              <div className="submenu">
                <NavLink to="/reports/earning" className={({ isActive }) => `submenu-item ${isActive ? "active" : ""}`}>
                  <span>Earning Reports</span>
                </NavLink>
                <NavLink to="/reports/inhouse-sales" className={({ isActive }) => `submenu-item ${isActive ? "active" : ""}`}>
                  <span>Inhouse Sales</span>
                </NavLink>
                <NavLink to="/reports/vendor-sales" className={({ isActive }) => `submenu-item ${isActive ? "active" : ""}`}>
                  <span>Vendor Sales</span>
                </NavLink>
                <NavLink to="/reports/transactions" className={({ isActive }) => `submenu-item ${isActive ? "active" : ""}`}>
                  <span>Transaction Report</span>
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/reports/product" className={({ isActive }) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            Product Report
          </NavLink>

          <NavLink to="/reports/order" className={({ isActive }) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            Order Report
          </NavLink>

          <div className="sidebar-divider" />
          <span className="sidebar-label">Help & Support</span>

          <NavLink to="/inbox" className={({ isActive }) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Inbox
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Messages
          </NavLink>
          <NavLink to="/support-ticket" className={({ isActive }) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            Support Ticket
          </NavLink>

          <div className="sidebar-divider" />
          <span className="sidebar-label">User Management</span>
          
          <div className={`nav-item-with-submenu ${isCustomersActive ? "expanded" : ""}`}>
            <button 
              className={`nav-toggle ${isCustomersActive ? "active" : ""}`}
              onClick={() => setCustomersExpanded(!customersExpanded)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Customers</span>
              <svg className={`chevron ${customersExpanded ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            {customersExpanded && (
              <div className="submenu">
                {customersSubmenus.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `submenu-item ${isActive ? "active" : ""}`}
                  >
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <NavLink to="/employees" className={({ isActive }) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Employees
          </NavLink>
          
          <div className="sidebar-divider" />
          <span className="sidebar-label">Settings</span>
          
          <NavLink to="/smtp" className={({ isActive }) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            SMTP
          </NavLink>
          <NavLink to="/storage" className={({ isActive }) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Storage
          </NavLink>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {employee?.firstName?.charAt(0)}{employee?.lastName?.charAt(0)}
            </div>
            <div className="user-info">
              <span className="user-name">{employee?.firstName} {employee?.lastName}</span>
              <span className="user-role">{employee?.role}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
      
      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <div className="page-title">
              <span className="page-title-icon">
                {currentPage.icon === "dashboard" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                )}
                {currentPage.icon === "product" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                )}
                {currentPage.icon === "orders" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                )}
                {currentPage.icon === "category" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zM3 21.5h8v-8H3v8z"/>
                  </svg>
                )}
                {currentPage.icon === "customer" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                )}
                {currentPage.icon === "report" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                )}
                {currentPage.icon === "offer" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
                  </svg>
                )}
                {currentPage.icon === "notification" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                  </svg>
                )}
                {currentPage.icon === "support" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                  </svg>
                )}
                {currentPage.icon === "wallet" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                )}
                {currentPage.icon === "loyalty" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                )}
                {currentPage.icon === "refund" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.5 6.9c1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-.53.12-1.03.3-1.48.54l1.47 1.47c.41-.17.91-.27 1.51-.27zm-2.6.98l7.14 7.14c.23-.55.36-1.13.36-1.72 0-2.09-1.53-3.53-4.04-3.93l-3.46-3.46zm10.31 9.25l-9.31-9.31-1.42-1.42-6.69-6.69L2.1 2.1l4.07 4.07C4.79 7.46 4 9.06 4 11.22c0 1.56.53 2.77 1.36 3.65l5.14-5.14.01.01-5.14 5.14c1.01.95 2.39 1.61 4.13 1.85V19h3v-2.27c1.04-.25 1.91-.7 2.57-1.32l4.13 4.13 1.37-1.37-6.7-6.7z"/>
                  </svg>
                )}
                {currentPage.icon === "inbox" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z"/>
                  </svg>
                )}
                {currentPage.icon === "messages" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                  </svg>
                )}
                {currentPage.icon === "employee" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
                {currentPage.icon === "settings" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                )}
                {currentPage.icon === "storage" && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z"/>
                  </svg>
                )}
                {(currentPage.icon === "brand" || currentPage.icon === "banner" || currentPage.icon === "gallery" || currentPage.icon === "attribute" || currentPage.icon === "pos") && (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
                  </svg>
                )}
              </span>
              <span className="page-title-text">{currentPage.title}</span>
              {currentPage.count !== undefined && (
                <span className="page-title-count">{currentPage.count}</span>
              )}
            </div>
          </div>
          <div className="header-right">
            <div className="header-search">
              <span className="search-hint">Search or</span>
              <kbd>Ctrl+K</kbd>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <button className="header-icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="notification-dot"></span>
            </button>
            <button className="header-icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button className="header-icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button className="header-icon-btn cart-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="cart-count">0</span>
            </button>
            <div className="header-user">
              <div className="user-avatar small">
                {employee?.firstName?.charAt(0)}{employee?.lastName?.charAt(0)}
              </div>
            </div>
          </div>
        </header>
        <div className="main-content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
