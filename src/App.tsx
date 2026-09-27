import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductForm from "./pages/ProductForm";
import Users from "./pages/Users";
import Promotions from "./pages/Promotions";
import SmtpConfigs from "./pages/SmtpConfigs";
import StorageProviders from "./pages/StorageProviders";
import Employees from "./pages/Employees";
import POS from "./pages/POS";
import OrdersNew from "./pages/OrdersNew";
import RefundRequests from "./pages/RefundRequests";
import { Categories, SubCategories, SubSubCategories } from "./pages/CategorySetup";
import { ProductList, AddNewProduct, LimitedStock, BulkImport, RequestRestockList } from "./pages/ProductsModule";
import BannerSetup from "./pages/BannerSetup";
import { Coupon, FlashDeals, DealOfTheDay, FeaturedDeal, ClearanceSale } from "./pages/OffersDeals";
import { SendNotification, PushNotificationsSetup } from "./pages/Notifications";
import { Inbox, Messages, SupportTicket } from "./pages/HelpSupport";
import { EarningReports, InhouseSales, VendorSales, TransactionReport, ProductReport, OrderReport } from "./pages/Reports";
import { CustomerList, CustomerReviews, Wallet, WalletBonusSetup, LoyaltyPoints } from "./pages/Customers";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
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
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="orders-management" element={<OrdersNew statusFilter="all" />} />
            <Route path="orders-management/pending" element={<OrdersNew statusFilter="pending" />} />
            <Route path="orders-management/confirmed" element={<OrdersNew statusFilter="confirmed" />} />
            <Route path="orders-management/packaging" element={<OrdersNew statusFilter="packaging" />} />
            <Route path="orders-management/out-for-delivery" element={<OrdersNew statusFilter="out_for_delivery" />} />
            <Route path="orders-management/delivered" element={<OrdersNew statusFilter="delivered" />} />
            <Route path="orders-management/returned" element={<OrdersNew statusFilter="returned" />} />
            <Route path="orders-management/failed-to-deliver" element={<OrdersNew statusFilter="failed_to_deliver" />} />
            <Route path="orders-management/canceled" element={<OrdersNew statusFilter="canceled" />} />
            <Route path="refund-requests" element={<RefundRequests statusFilter="pending" />} />
            <Route path="refund-requests/approved" element={<RefundRequests statusFilter="approved" />} />
            <Route path="refund-requests/refunded" element={<RefundRequests statusFilter="refunded" />} />
            <Route path="refund-requests/rejected" element={<RefundRequests statusFilter="rejected" />} />
            <Route path="category-setup" element={<Categories />} />
            <Route path="category-setup/sub-categories" element={<SubCategories />} />
            <Route path="category-setup/sub-sub-categories" element={<SubSubCategories />} />
            <Route path="categories" element={<Categories />} />
            <Route path="products-module" element={<ProductList />} />
            <Route path="products-module/add-new" element={<AddNewProduct />} />
            <Route path="products-module/limited-stock" element={<LimitedStock />} />
            <Route path="products-module/bulk-import" element={<BulkImport />} />
            <Route path="products-module/restock-requests" element={<RequestRestockList />} />
            <Route path="banners" element={<BannerSetup />} />
            <Route path="offers-deals" element={<Coupon />} />
            <Route path="offers-deals/coupon" element={<Coupon />} />
            <Route path="offers-deals/flash-deals" element={<FlashDeals />} />
            <Route path="offers-deals/deal-of-the-day" element={<DealOfTheDay />} />
            <Route path="offers-deals/featured-deal" element={<FeaturedDeal />} />
            <Route path="offers-deals/clearance-sale" element={<ClearanceSale />} />
            <Route path="notifications" element={<SendNotification />} />
            <Route path="notifications/send" element={<SendNotification />} />
            <Route path="notifications/push-setup" element={<PushNotificationsSetup />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="messages" element={<Messages />} />
            <Route path="support-ticket" element={<SupportTicket />} />
            <Route path="reports/earning" element={<EarningReports />} />
            <Route path="reports/inhouse-sales" element={<InhouseSales />} />
            <Route path="reports/vendor-sales" element={<VendorSales />} />
            <Route path="reports/transactions" element={<TransactionReport />} />
            <Route path="reports/product" element={<ProductReport />} />
            <Route path="reports/order" element={<OrderReport />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/list" element={<CustomerList />} />
            <Route path="customers/reviews" element={<CustomerReviews />} />
            <Route path="customers/wallet" element={<Wallet />} />
            <Route path="customers/wallet-bonus" element={<WalletBonusSetup />} />
            <Route path="customers/loyalty-points" element={<LoyaltyPoints />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductForm />} />
            <Route path="users" element={<Users />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="smtp" element={<SmtpConfigs />} />
            <Route path="storage" element={<StorageProviders />} />
            <Route path="employees" element={<Employees />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
