import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute, { RequirePermission } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProductForm from "./pages/ProductForm";
import Users from "./pages/Users";
import Promotions from "./pages/Promotions";
import Campaigns from "./pages/Campaigns";
import StorageProviders from "./pages/StorageProviders";
import Employees from "./pages/Employees";
import POS from "./pages/POS";
import OrdersNew from "./pages/OrdersNew";
import OrderDetail from "./pages/OrderDetail";
import RefundRequests from "./pages/RefundRequests";
import { Categories, SubCategories, SubSubCategories } from "./pages/CategorySetup";
import { ProductList, AddNewProduct, ProductView, GenerateBarcode, LimitedStock, BulkImport, RequestRestockList } from "./pages/ProductsModule";
import BannerSetup from "./pages/BannerSetup";
import { Coupon, FlashDeals, DealOfTheDay, FeaturedDeal, ClearanceSale, Offers } from "./pages/OffersDeals";
import { SendNotification, PushNotificationsSetup } from "./pages/Notifications";
import { Inbox, Messages, SupportTicket } from "./pages/HelpSupport";
import { EarningReports, InhouseSales, VendorSales, TransactionReport, ProductReport, OrderReport } from "./pages/Reports";
import { CustomerList, CustomerReviews, Wallet, WalletBonusSetup, LoyaltyPoints } from "./pages/Customers";
import { Settings } from "./pages/Settings";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Home - shows Dashboard or Welcome based on permission */}
            <Route index element={<Home />} />
            
            {/* POS */}
            <Route path="pos" element={<RequirePermission permission="pos"><POS /></RequirePermission>} />
            
            {/* Orders Management */}
            <Route path="orders-management" element={<RequirePermission permission="orders"><OrdersNew statusFilter="all" /></RequirePermission>} />
            <Route path="orders-management/pending" element={<RequirePermission permission="orders"><OrdersNew statusFilter="pending" /></RequirePermission>} />
            <Route path="orders-management/processing" element={<RequirePermission permission="orders"><OrdersNew statusFilter="processing" /></RequirePermission>} />
            <Route path="orders-management/confirmed" element={<RequirePermission permission="orders"><OrdersNew statusFilter="confirmed" /></RequirePermission>} />
            <Route path="orders-management/shipped" element={<RequirePermission permission="orders"><OrdersNew statusFilter="shipped" /></RequirePermission>} />
            <Route path="orders/:id" element={<RequirePermission permission="orders"><OrderDetail /></RequirePermission>} />
            <Route path="orders-management/packaging" element={<RequirePermission permission="orders"><OrdersNew statusFilter="packaging" /></RequirePermission>} />
            <Route path="orders-management/out-for-delivery" element={<RequirePermission permission="orders"><OrdersNew statusFilter="out_for_delivery" /></RequirePermission>} />
            <Route path="orders-management/delivered" element={<RequirePermission permission="orders"><OrdersNew statusFilter="delivered" /></RequirePermission>} />
            <Route path="orders-management/returned" element={<RequirePermission permission="orders"><OrdersNew statusFilter="returned" /></RequirePermission>} />
            <Route path="orders-management/failed-to-deliver" element={<RequirePermission permission="orders"><OrdersNew statusFilter="failed_to_deliver" /></RequirePermission>} />
            <Route path="orders-management/canceled" element={<RequirePermission permission="orders"><OrdersNew statusFilter="cancelled" /></RequirePermission>} />
            
            {/* Refund Requests */}
            <Route path="refund-requests" element={<RequirePermission permission="refund-requests"><RefundRequests statusFilter="pending" /></RequirePermission>} />
            <Route path="refund-requests/all" element={<RequirePermission permission="refund-requests"><RefundRequests statusFilter="all" /></RequirePermission>} />
            <Route path="refund-requests/approved" element={<RequirePermission permission="refund-requests"><RefundRequests statusFilter="approved" /></RequirePermission>} />
            <Route path="refund-requests/refunded" element={<RequirePermission permission="refund-requests"><RefundRequests statusFilter="refunded" /></RequirePermission>} />
            <Route path="refund-requests/rejected" element={<RequirePermission permission="refund-requests"><RefundRequests statusFilter="rejected" /></RequirePermission>} />
            
            {/* Category Setup */}
            <Route path="category-setup" element={<RequirePermission permission="category-setup"><Categories /></RequirePermission>} />
            <Route path="category-setup/sub-categories" element={<RequirePermission permission="category-setup"><SubCategories /></RequirePermission>} />
            <Route path="category-setup/sub-sub-categories" element={<RequirePermission permission="category-setup"><SubSubCategories /></RequirePermission>} />
            <Route path="categories" element={<RequirePermission permission="category-setup"><Categories /></RequirePermission>} />
            
            {/* Products Module */}
            <Route path="products-module" element={<RequirePermission permission="products-module"><ProductList /></RequirePermission>} />
            <Route path="products-module/active" element={<RequirePermission permission="products-module"><ProductList filter="active" /></RequirePermission>} />
            <Route path="products-module/inactive" element={<RequirePermission permission="products-module"><ProductList filter="inactive" /></RequirePermission>} />
            <Route path="products-module/drafts" element={<RequirePermission permission="products-module"><ProductList filter="draft" /></RequirePermission>} />
            <Route path="products-module/out-of-stock" element={<RequirePermission permission="products-module"><ProductList filter="out_of_stock" /></RequirePermission>} />
            <Route path="products-module/add-new" element={<RequirePermission permission="products-module"><AddNewProduct /></RequirePermission>} />
            <Route path="products-module/view/:id" element={<RequirePermission permission="products-module"><ProductView /></RequirePermission>} />
            <Route path="products-module/edit/:id" element={<RequirePermission permission="products-module"><AddNewProduct /></RequirePermission>} />
            <Route path="products-module/barcode/:id" element={<RequirePermission permission="products-module"><GenerateBarcode /></RequirePermission>} />
            <Route path="products-module/limited-stock" element={<RequirePermission permission="products-module"><LimitedStock /></RequirePermission>} />
            <Route path="products-module/bulk-import" element={<RequirePermission permission="products-module"><BulkImport /></RequirePermission>} />
            <Route path="products-module/restock-requests" element={<RequirePermission permission="products-module"><RequestRestockList /></RequirePermission>} />
            
            {/* Banners */}
            <Route path="banners" element={<RequirePermission permission="banners"><BannerSetup /></RequirePermission>} />
            
            {/* Offers & Deals */}
            <Route path="offers-deals" element={<RequirePermission permission="offers-deals"><Coupon /></RequirePermission>} />
            <Route path="offers-deals/coupon" element={<RequirePermission permission="offers-deals"><Coupon /></RequirePermission>} />
            <Route path="offers-deals/offers" element={<RequirePermission permission="offers-deals"><Offers /></RequirePermission>} />
            <Route path="offers-deals/flash-deals" element={<RequirePermission permission="offers-deals"><FlashDeals /></RequirePermission>} />
            <Route path="offers-deals/deal-of-the-day" element={<RequirePermission permission="offers-deals"><DealOfTheDay /></RequirePermission>} />
            <Route path="offers-deals/featured-deal" element={<RequirePermission permission="offers-deals"><FeaturedDeal /></RequirePermission>} />
            <Route path="offers-deals/clearance-sale" element={<RequirePermission permission="offers-deals"><ClearanceSale /></RequirePermission>} />
            
            {/* Notifications */}
            <Route path="campaigns" element={<RequirePermission permission="promotions"><Campaigns /></RequirePermission>} />
            <Route path="notifications" element={<RequirePermission permission="notifications"><SendNotification /></RequirePermission>} />
            <Route path="notifications/send" element={<RequirePermission permission="notifications"><SendNotification /></RequirePermission>} />
            <Route path="notifications/push-setup" element={<RequirePermission permission="notifications"><PushNotificationsSetup /></RequirePermission>} />
            
            {/* Help & Support */}
            <Route path="inbox" element={<RequirePermission permission="inbox"><Inbox /></RequirePermission>} />
            <Route path="messages" element={<RequirePermission permission="messages"><Messages /></RequirePermission>} />
            <Route path="support-ticket" element={<RequirePermission permission="support-ticket"><SupportTicket /></RequirePermission>} />
            
            {/* Reports */}
            <Route path="reports/earning" element={<RequirePermission permission="reports"><EarningReports /></RequirePermission>} />
            <Route path="reports/inhouse-sales" element={<RequirePermission permission="reports"><InhouseSales /></RequirePermission>} />
            <Route path="reports/vendor-sales" element={<RequirePermission permission="reports"><VendorSales /></RequirePermission>} />
            <Route path="reports/transactions" element={<RequirePermission permission="reports"><TransactionReport /></RequirePermission>} />
            <Route path="reports/product" element={<RequirePermission permission="product-report"><ProductReport /></RequirePermission>} />
            <Route path="reports/order" element={<RequirePermission permission="order-report"><OrderReport /></RequirePermission>} />
            
            {/* Customers */}
            <Route path="customers" element={<RequirePermission permission="customers"><CustomerList /></RequirePermission>} />
            <Route path="customers/list" element={<RequirePermission permission="customers"><CustomerList /></RequirePermission>} />
            <Route path="customers/reviews" element={<RequirePermission permission="customers"><CustomerReviews /></RequirePermission>} />
            <Route path="customers/wallet" element={<RequirePermission permission="customers"><Wallet /></RequirePermission>} />
            <Route path="customers/wallet-bonus" element={<RequirePermission permission="customers"><WalletBonusSetup /></RequirePermission>} />
            <Route path="customers/loyalty-points" element={<RequirePermission permission="customers"><LoyaltyPoints /></RequirePermission>} />
            
            {/* Legacy routes */}
            <Route path="products/new" element={<RequirePermission permission="products-module"><ProductForm /></RequirePermission>} />
            <Route path="products/:id" element={<RequirePermission permission="products-module"><ProductForm /></RequirePermission>} />
            <Route path="users" element={<RequirePermission permission="customers"><Users /></RequirePermission>} />
            <Route path="promotions" element={<RequirePermission permission="offers-deals"><Promotions /></RequirePermission>} />
            
            {/* Settings */}
            {/* The sidebar shows this link under `storage`, so accept either
                key — otherwise a user holding only one of them sees the link
                and lands on "Access Denied". `hasPermission` treats an array
                as "any of these". */}
            <Route path="storage" element={<RequirePermission permission={["storage", "storage-settings"]}><StorageProviders /></RequirePermission>} />
            <Route path="settings" element={<Settings />} />
            
            {/* Employee Management - requires employees permission */}
            <Route path="employees" element={<RequirePermission permission="employees"><Employees /></RequirePermission>} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
