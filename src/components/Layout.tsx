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
  { path: "/products-module/add-new", label: "Add New Product" },
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

          <NavLink to="/attributes" className={({ isActive }) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            Product Attribute Setup
          </NavLink>
          
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
