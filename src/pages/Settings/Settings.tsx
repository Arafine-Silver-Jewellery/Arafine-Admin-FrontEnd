import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { authApi } from "../../api/auth";
import { settingsApi } from "../../api/settings";
import type {
  ActiveSession,
  BusinessSettings,
  NotificationSettings,
  OrderSettings,
  PaymentSettings,
  SecuritySettings,
  ShippingSettings,
  SystemSettings,
} from "../../types";
import "../../styles/settings.css";

type SettingsTab = "business" | "orders" | "payments" | "shipping" | "security" | "system" | "notifications";

const DEFAULT_BUSINESS: BusinessSettings = {
  storeName: "Arafine",
  storeEmail: "support@arafine.com",
  storePhone: "+91 9876543210",
  storeAddress: "123 Business Street, City, State 560001",
  storeLogo: "",
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  youtubeUrl: "",
};

const DEFAULT_ORDERS: OrderSettings = {
  orderIdPrefix: "ORD-",
  minOrderAmount: 0,
  autoCancelHours: 24,
  enableGuestCheckout: false,
  enableOrderNotes: true,
  maxItemsPerOrder: 50,
};

const DEFAULT_PAYMENTS: PaymentSettings = {
  enableCOD: true,
  enableOnlinePayment: true,
  enableWallet: true,
  razorpayKeyId: "",
  razorpayKeySecret: "",
  gstPercentage: 18,
  gstNumber: "",
  enableTax: true,
};

const DEFAULT_SHIPPING: ShippingSettings = {
  freeShippingThreshold: 999,
  defaultDeliveryCharge: 50,
  expressDeliveryCharge: 100,
  estimatedDeliveryDays: 5,
  enableExpressDelivery: true,
  deliveryRadius: 50,
};

const DEFAULT_SECURITY: SecuritySettings = {
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  requireStrongPassword: true,
  enable2FA: false,
  passwordExpiryDays: 90,
};

const DEFAULT_SYSTEM: SystemSettings = {
  currency: "INR",
  currencySymbol: "₹",
  dateFormat: "DD MMM YYYY",
  timeFormat: "12h",
  timezone: "Asia/Kolkata",
  maintenanceMode: false,
  maintenanceMessage: "We are currently performing maintenance. Please check back soon.",
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailOrderPlaced: true,
  emailOrderShipped: true,
  emailOrderDelivered: true,
  emailOrderCancelled: true,
  smsOrderPlaced: false,
  smsOrderShipped: false,
  smsOrderDelivered: false,
  pushEnabled: false,
  adminEmailAlerts: true,
  lowStockAlerts: true,
  lowStockThreshold: 10,
};

export default function Settings() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>("business");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Settings state
  const [business, setBusiness] = useState<BusinessSettings>(DEFAULT_BUSINESS);
  const [orders, setOrders] = useState<OrderSettings>(DEFAULT_ORDERS);
  const [payments, setPayments] = useState<PaymentSettings>(DEFAULT_PAYMENTS);
  const [shipping, setShipping] = useState<ShippingSettings>(DEFAULT_SHIPPING);
  const [security, setSecurity] = useState<SecuritySettings>(DEFAULT_SECURITY);
  const [system, setSystem] = useState<SystemSettings>(DEFAULT_SYSTEM);
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Load the stored settings (falling back to the defaults when the store
  // settings have never been saved).
  useEffect(() => {
    let cancelled = false;
    settingsApi
      .get()
      .then((stored) => {
        if (cancelled) return;
        setBusiness({ ...DEFAULT_BUSINESS, ...stored.business });
        setOrders({ ...DEFAULT_ORDERS, ...stored.orders });
        setPayments({ ...DEFAULT_PAYMENTS, ...stored.payments });
        setShipping({ ...DEFAULT_SHIPPING, ...stored.shipping });
        setSecurity({ ...DEFAULT_SECURITY, ...stored.security });
        setSystem({ ...DEFAULT_SYSTEM, ...stored.system });
        setNotifications({ ...DEFAULT_NOTIFICATIONS, ...stored.notifications });
      })
      .catch(() => {
        // Keep the defaults — the form stays usable even if the API is down.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const settings = { business, orders, payments, shipping, security, system, notifications };
      const saved = await settingsApi.save(settings);

      setBusiness({ ...DEFAULT_BUSINESS, ...saved.business });
      setOrders({ ...DEFAULT_ORDERS, ...saved.orders });
      setPayments({ ...DEFAULT_PAYMENTS, ...saved.payments });
      setShipping({ ...DEFAULT_SHIPPING, ...saved.shipping });
      setSecurity({ ...DEFAULT_SECURITY, ...saved.security });
      setSystem({ ...DEFAULT_SYSTEM, ...saved.system });
      setNotifications({ ...DEFAULT_NOTIFICATIONS, ...saved.notifications });

      toast.success("Settings saved successfully");
      setHasChanges(false);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [business, orders, payments, shipping, security, system, notifications, toast]);

  const updateBusiness = (updates: Partial<BusinessSettings>) => {
    setBusiness((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateOrders = (updates: Partial<OrderSettings>) => {
    setOrders((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updatePayments = (updates: Partial<PaymentSettings>) => {
    setPayments((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateShipping = (updates: Partial<ShippingSettings>) => {
    setShipping((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateSecurity = (updates: Partial<SecuritySettings>) => {
    setSecurity((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateSystem = (updates: Partial<SystemSettings>) => {
    setSystem((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateNotifications = (updates: Partial<NotificationSettings>) => {
    setNotifications((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  // Active sessions for the signed-in admin (Security tab).
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const response = await authApi.listSessions();
      setSessions(response.sessions ?? []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "security") return;
    void loadSessions();
  }, [activeTab, loadSessions]);

  async function revokeSession(id: string) {
    try {
      await authApi.revokeSession(id);
      toast.success("Device signed out");
      await loadSessions();
    } catch {
      toast.error("Could not sign out that device");
    }
  }

  async function signOutEverywhere() {
    try {
      await authApi.logoutAll();
      toast.success("Signed out of all devices");
      window.location.assign("/login");
    } catch {
      toast.error("Could not sign out everywhere");
    }
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "business",
      label: "Business Info",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: "orders",
      label: "Orders",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      id: "payments",
      label: "Payments & Tax",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
    },
    {
      id: "shipping",
      label: "Shipping",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      id: "security",
      label: "Security",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      id: "system",
      label: "System",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
  ];

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your store configuration</p>
        </div>
        <button
          className={`settings-save-btn ${hasChanges ? "has-changes" : ""}`}
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <>
              <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="settings-layout">
        {/* Sidebar Tabs */}
        <div className="settings-sidebar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
          {/* Business Info Tab */}
          {activeTab === "business" && (
            <div className="settings-section">
              <h2>Business Information</h2>
              <p className="settings-section-desc">Basic information about your store</p>

              <div className="settings-form">
                <div className="settings-form-group">
                  <label htmlFor="storeName">Store Name</label>
                  <input
                    id="storeName"
                    type="text"
                    value={business.storeName}
                    onChange={(e) => updateBusiness({ storeName: e.target.value })}
                    placeholder="Enter store name"
                  />
                </div>

                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="storeEmail">Contact Email</label>
                    <input
                      id="storeEmail"
                      type="email"
                      value={business.storeEmail}
                      onChange={(e) => updateBusiness({ storeEmail: e.target.value })}
                      placeholder="support@example.com"
                    />
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="storePhone">Contact Phone</label>
                    <input
                      id="storePhone"
                      type="tel"
                      value={business.storePhone}
                      onChange={(e) => updateBusiness({ storePhone: e.target.value })}
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <div className="settings-form-group">
                  <label htmlFor="storeAddress">Business Address</label>
                  <textarea
                    id="storeAddress"
                    value={business.storeAddress}
                    onChange={(e) => updateBusiness({ storeAddress: e.target.value })}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>

                <div className="settings-divider" />

                <h3>Social Media Links</h3>
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="facebookUrl">Facebook</label>
                    <input
                      id="facebookUrl"
                      type="url"
                      value={business.facebookUrl}
                      onChange={(e) => updateBusiness({ facebookUrl: e.target.value })}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="instagramUrl">Instagram</label>
                    <input
                      id="instagramUrl"
                      type="url"
                      value={business.instagramUrl}
                      onChange={(e) => updateBusiness({ instagramUrl: e.target.value })}
                      placeholder="https://instagram.com/yourpage"
                    />
                  </div>
                </div>
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="twitterUrl">Twitter / X</label>
                    <input
                      id="twitterUrl"
                      type="url"
                      value={business.twitterUrl}
                      onChange={(e) => updateBusiness({ twitterUrl: e.target.value })}
                      placeholder="https://twitter.com/yourpage"
                    />
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="youtubeUrl">YouTube</label>
                    <input
                      id="youtubeUrl"
                      type="url"
                      value={business.youtubeUrl}
                      onChange={(e) => updateBusiness({ youtubeUrl: e.target.value })}
                      placeholder="https://youtube.com/yourchannel"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="settings-section">
              <h2>Order Settings</h2>
              <p className="settings-section-desc">Configure order processing options</p>

              <div className="settings-form">
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="orderIdPrefix">Order ID Prefix</label>
                    <input
                      id="orderIdPrefix"
                      type="text"
                      value={orders.orderIdPrefix}
                      onChange={(e) => updateOrders({ orderIdPrefix: e.target.value })}
                      placeholder="ORD-"
                    />
                    <span className="settings-form-hint">Example: ORD-001234</span>
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="minOrderAmount">Minimum Order Amount (₹)</label>
                    <input
                      id="minOrderAmount"
                      type="number"
                      min="0"
                      value={orders.minOrderAmount}
                      onChange={(e) => updateOrders({ minOrderAmount: Number(e.target.value) })}
                    />
                    <span className="settings-form-hint">Set to 0 for no minimum</span>
                  </div>
                </div>

                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="autoCancelHours">Auto-cancel Pending Orders After (hours)</label>
                    <input
                      id="autoCancelHours"
                      type="number"
                      min="1"
                      value={orders.autoCancelHours}
                      onChange={(e) => updateOrders({ autoCancelHours: Number(e.target.value) })}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="maxItemsPerOrder">Max Items Per Order</label>
                    <input
                      id="maxItemsPerOrder"
                      type="number"
                      min="1"
                      value={orders.maxItemsPerOrder}
                      onChange={(e) => updateOrders({ maxItemsPerOrder: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="settings-divider" />

                <h3>Order Options</h3>
                <div className="settings-toggle-group">
                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Guest Checkout</span>
                      <span className="settings-toggle-desc">Allow customers to checkout without creating an account</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={orders.enableGuestCheckout}
                        onChange={(e) => updateOrders({ enableGuestCheckout: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Order Notes</span>
                      <span className="settings-toggle-desc">Allow customers to add notes to their orders</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={orders.enableOrderNotes}
                        onChange={(e) => updateOrders({ enableOrderNotes: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="settings-section">
              <h2>Notification Settings</h2>
              <p className="settings-section-desc">Configure how notifications are sent to customers</p>

              <div className="settings-form">
                <h3>Email Notifications</h3>
                <div className="settings-toggle-group">
                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Order Placed</span>
                      <span className="settings-toggle-desc">Send email when a new order is placed</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={notifications.emailOrderPlaced}
                        onChange={(e) => updateNotifications({ emailOrderPlaced: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Order Shipped</span>
                      <span className="settings-toggle-desc">Send email when order is shipped</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={notifications.emailOrderShipped}
                        onChange={(e) => updateNotifications({ emailOrderShipped: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Order Delivered</span>
                      <span className="settings-toggle-desc">Send email when order is delivered</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={notifications.emailOrderDelivered}
                        onChange={(e) => updateNotifications({ emailOrderDelivered: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Order Cancelled</span>
                      <span className="settings-toggle-desc">Send email when order is cancelled</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={notifications.emailOrderCancelled}
                        onChange={(e) => updateNotifications({ emailOrderCancelled: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>

                <div className="settings-divider" />

                <h3>SMS Notifications</h3>
                <div className="settings-toggle-group">
                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Order Placed SMS</span>
                      <span className="settings-toggle-desc">Send SMS when a new order is placed</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={notifications.smsOrderPlaced}
                        onChange={(e) => updateNotifications({ smsOrderPlaced: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Order Shipped SMS</span>
                      <span className="settings-toggle-desc">Send SMS when order is shipped</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={notifications.smsOrderShipped}
                        onChange={(e) => updateNotifications({ smsOrderShipped: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Order Delivered SMS</span>
                      <span className="settings-toggle-desc">Send SMS when order is delivered</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={notifications.smsOrderDelivered}
                        onChange={(e) => updateNotifications({ smsOrderDelivered: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>

                <div className="settings-divider" />

                <h3>Admin Alerts</h3>
                <div className="settings-toggle-group">
                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Push Notifications</span>
                      <span className="settings-toggle-desc">Enable push notifications for customers</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={notifications.pushEnabled}
                        onChange={(e) => updateNotifications({ pushEnabled: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Admin Email Alerts</span>
                      <span className="settings-toggle-desc">Receive email alerts for new orders</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={notifications.adminEmailAlerts}
                        onChange={(e) => updateNotifications({ adminEmailAlerts: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Low Stock Alerts</span>
                      <span className="settings-toggle-desc">Receive alerts when products are low in stock</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={notifications.lowStockAlerts}
                        onChange={(e) => updateNotifications({ lowStockAlerts: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>

                {notifications.lowStockAlerts && (
                  <div className="settings-form-group" style={{ marginTop: "16px", maxWidth: "300px" }}>
                    <label htmlFor="lowStockThreshold">Low Stock Threshold</label>
                    <input
                      id="lowStockThreshold"
                      type="number"
                      min="1"
                      value={notifications.lowStockThreshold}
                      onChange={(e) => updateNotifications({ lowStockThreshold: Number(e.target.value) })}
                    />
                    <span className="settings-form-hint">Alert when stock falls below this number</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="settings-section">
              <h2>Payment & Tax Settings</h2>
              <p className="settings-section-desc">Configure payment methods and tax settings</p>

              <div className="settings-form">
                <h3>Payment Methods</h3>
                <div className="settings-toggle-group">
                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Cash on Delivery (COD)</span>
                      <span className="settings-toggle-desc">Allow customers to pay on delivery</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={payments.enableCOD}
                        onChange={(e) => updatePayments({ enableCOD: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Online Payment</span>
                      <span className="settings-toggle-desc">Accept payments via Razorpay</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={payments.enableOnlinePayment}
                        onChange={(e) => updatePayments({ enableOnlinePayment: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Wallet Payment</span>
                      <span className="settings-toggle-desc">Allow customers to pay using wallet balance</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={payments.enableWallet}
                        onChange={(e) => updatePayments({ enableWallet: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>

                {payments.enableOnlinePayment && (
                  <>
                    <div className="settings-divider" />
                    <h3>Razorpay Configuration</h3>
                    <div className="settings-form-row">
                      <div className="settings-form-group">
                        <label htmlFor="razorpayKeyId">Razorpay Key ID</label>
                        <input
                          id="razorpayKeyId"
                          type="text"
                          value={payments.razorpayKeyId}
                          onChange={(e) => updatePayments({ razorpayKeyId: e.target.value })}
                          placeholder="rzp_live_xxxxxxxx"
                        />
                      </div>
                      <div className="settings-form-group">
                        <label htmlFor="razorpayKeySecret">Razorpay Key Secret</label>
                        <input
                          id="razorpayKeySecret"
                          type="password"
                          value={payments.razorpayKeySecret}
                          onChange={(e) => updatePayments({ razorpayKeySecret: e.target.value })}
                          placeholder="••••••••••••"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="settings-divider" />

                <h3>Tax Settings</h3>
                <div className="settings-toggle-group">
                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Enable Tax</span>
                      <span className="settings-toggle-desc">Apply GST on orders</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={payments.enableTax}
                        onChange={(e) => updatePayments({ enableTax: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>

                {payments.enableTax && (
                  <div className="settings-form-row" style={{ marginTop: "16px" }}>
                    <div className="settings-form-group">
                      <label htmlFor="gstPercentage">GST Percentage (%)</label>
                      <input
                        id="gstPercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={payments.gstPercentage}
                        onChange={(e) => updatePayments({ gstPercentage: Number(e.target.value) })}
                      />
                    </div>
                    <div className="settings-form-group">
                      <label htmlFor="gstNumber">GST Number</label>
                      <input
                        id="gstNumber"
                        type="text"
                        value={payments.gstNumber}
                        onChange={(e) => updatePayments({ gstNumber: e.target.value })}
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Tab */}
          {activeTab === "shipping" && (
            <div className="settings-section">
              <h2>Shipping & Delivery</h2>
              <p className="settings-section-desc">Configure delivery charges and options</p>

              <div className="settings-form">
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="freeShippingThreshold">Free Shipping Threshold (₹)</label>
                    <input
                      id="freeShippingThreshold"
                      type="number"
                      min="0"
                      value={shipping.freeShippingThreshold}
                      onChange={(e) => updateShipping({ freeShippingThreshold: Number(e.target.value) })}
                    />
                    <span className="settings-form-hint">Free delivery for orders above this amount</span>
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="defaultDeliveryCharge">Default Delivery Charge (₹)</label>
                    <input
                      id="defaultDeliveryCharge"
                      type="number"
                      min="0"
                      value={shipping.defaultDeliveryCharge}
                      onChange={(e) => updateShipping({ defaultDeliveryCharge: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="estimatedDeliveryDays">Estimated Delivery Days</label>
                    <input
                      id="estimatedDeliveryDays"
                      type="number"
                      min="1"
                      value={shipping.estimatedDeliveryDays}
                      onChange={(e) => updateShipping({ estimatedDeliveryDays: Number(e.target.value) })}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="deliveryRadius">Delivery Radius (km)</label>
                    <input
                      id="deliveryRadius"
                      type="number"
                      min="1"
                      value={shipping.deliveryRadius}
                      onChange={(e) => updateShipping({ deliveryRadius: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="settings-divider" />

                <h3>Express Delivery</h3>
                <div className="settings-toggle-group">
                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Enable Express Delivery</span>
                      <span className="settings-toggle-desc">Offer faster delivery option to customers</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={shipping.enableExpressDelivery}
                        onChange={(e) => updateShipping({ enableExpressDelivery: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>

                {shipping.enableExpressDelivery && (
                  <div className="settings-form-group" style={{ marginTop: "16px", maxWidth: "300px" }}>
                    <label htmlFor="expressDeliveryCharge">Express Delivery Charge (₹)</label>
                    <input
                      id="expressDeliveryCharge"
                      type="number"
                      min="0"
                      value={shipping.expressDeliveryCharge}
                      onChange={(e) => updateShipping({ expressDeliveryCharge: Number(e.target.value) })}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              <p className="settings-section-desc">Configure account security options</p>

              <div className="settings-form">
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="sessionTimeoutMinutes">Session Timeout (minutes)</label>
                    <input
                      id="sessionTimeoutMinutes"
                      type="number"
                      min="5"
                      value={security.sessionTimeoutMinutes}
                      onChange={(e) => updateSecurity({ sessionTimeoutMinutes: Number(e.target.value) })}
                    />
                    <span className="settings-form-hint">Auto logout after inactivity</span>
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="maxLoginAttempts">Max Login Attempts</label>
                    <input
                      id="maxLoginAttempts"
                      type="number"
                      min="1"
                      value={security.maxLoginAttempts}
                      onChange={(e) => updateSecurity({ maxLoginAttempts: Number(e.target.value) })}
                    />
                    <span className="settings-form-hint">Lock account after failed attempts</span>
                  </div>
                </div>

                <div className="settings-form-group" style={{ maxWidth: "300px" }}>
                  <label htmlFor="passwordExpiryDays">Password Expiry (days)</label>
                  <input
                    id="passwordExpiryDays"
                    type="number"
                    min="0"
                    value={security.passwordExpiryDays}
                    onChange={(e) => updateSecurity({ passwordExpiryDays: Number(e.target.value) })}
                  />
                  <span className="settings-form-hint">Set to 0 to disable password expiry</span>
                </div>

                <div className="settings-divider" />

                <h3>Security Options</h3>
                <div className="settings-toggle-group">
                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Require Strong Password</span>
                      <span className="settings-toggle-desc">Enforce minimum 8 characters with uppercase, lowercase, and numbers</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={security.requireStrongPassword}
                        onChange={(e) => updateSecurity({ requireStrongPassword: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Two-Factor Authentication</span>
                      <span className="settings-toggle-desc">Require 2FA for admin login</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={security.enable2FA}
                        onChange={(e) => updateSecurity({ enable2FA: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-divider" />

              <h3>Active Sessions</h3>
              <p className="settings-section-desc">Devices currently signed in to this admin account</p>
              {sessionsLoading && <p className="settings-section-desc">Loading sessions…</p>}
              {!sessionsLoading && sessions.length === 0 && (
                <p className="settings-section-desc">No other active sessions.</p>
              )}
              {sessions.map(session => (
                <div className="settings-toggle-item" key={session.id}>
                  <div>
                    <span className="settings-toggle-label">
                      {session.device}
                      {session.current && " (this device)"}
                    </span>
                    <span className="settings-toggle-desc">
                      {session.ip || "unknown IP"} · last active {new Date(session.lastActivityAt).toLocaleString()}
                    </span>
                  </div>
                  {!session.current && (
                    <button type="button" className="btn-secondary" onClick={() => void revokeSession(session.id)}>
                      Sign out
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn-danger" onClick={() => void signOutEverywhere()}>
                Sign out of all devices
              </button>
            </div>
          )}

          {/* System Tab */}
          {activeTab === "system" && (
            <div className="settings-section">
              <h2>System Settings</h2>
              <p className="settings-section-desc">General system configuration</p>

              <div className="settings-form">
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="currency">Currency</label>
                    <select
                      id="currency"
                      value={system.currency}
                      onChange={(e) => updateSystem({ currency: e.target.value })}
                    >
                      <option value="INR">Indian Rupee (INR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option>
                    </select>
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="currencySymbol">Currency Symbol</label>
                    <input
                      id="currencySymbol"
                      type="text"
                      value={system.currencySymbol}
                      onChange={(e) => updateSystem({ currencySymbol: e.target.value })}
                      maxLength={3}
                    />
                  </div>
                </div>

                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="dateFormat">Date Format</label>
                    <select
                      id="dateFormat"
                      value={system.dateFormat}
                      onChange={(e) => updateSystem({ dateFormat: e.target.value })}
                    >
                      <option value="DD MMM YYYY">DD MMM YYYY (25 Oct 2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (10/25/2026)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (25/10/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-25)</option>
                    </select>
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="timeFormat">Time Format</label>
                    <select
                      id="timeFormat"
                      value={system.timeFormat}
                      onChange={(e) => updateSystem({ timeFormat: e.target.value as SystemSettings["timeFormat"] })}
                    >
                      <option value="12h">12-hour (2:30 PM)</option>
                      <option value="24h">24-hour (14:30)</option>
                    </select>
                  </div>
                </div>

                <div className="settings-form-group" style={{ maxWidth: "400px" }}>
                  <label htmlFor="timezone">Timezone</label>
                  <select
                    id="timezone"
                    value={system.timezone}
                    onChange={(e) => updateSystem({ timezone: e.target.value })}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </div>

                <div className="settings-divider" />

                <h3>Maintenance Mode</h3>
                <div className="settings-toggle-group">
                  <div className="settings-toggle-item">
                    <div>
                      <span className="settings-toggle-label">Enable Maintenance Mode</span>
                      <span className="settings-toggle-desc">Show maintenance page to customers (admin access remains)</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={system.maintenanceMode}
                        onChange={(e) => updateSystem({ maintenanceMode: e.target.checked })}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>

                {system.maintenanceMode && (
                  <div className="settings-form-group" style={{ marginTop: "16px" }}>
                    <label htmlFor="maintenanceMessage">Maintenance Message</label>
                    <textarea
                      id="maintenanceMessage"
                      value={system.maintenanceMessage}
                      onChange={(e) => updateSystem({ maintenanceMessage: e.target.value })}
                      rows={3}
                      placeholder="Enter message to display during maintenance"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
