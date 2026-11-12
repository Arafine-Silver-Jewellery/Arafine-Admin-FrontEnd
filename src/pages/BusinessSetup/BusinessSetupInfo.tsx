import { useState } from "react";
import "../../styles/ui-kit.css";
import "../../styles/reports.css";

// Tab types
type TabType = "general" | "website" | "vendors" | "products" | "delivery" | "customer" | "orders" | "refund" | "shipping" | "delivery-zone" | "invoice";

const TABS: { id: TabType; label: string }[] = [
  { id: "general", label: "General" },
  { id: "website", label: "Website Setup" },
  { id: "vendors", label: "Vendors" },
  { id: "products", label: "Products" },
  { id: "delivery", label: "Delivery Men" },
  { id: "customer", label: "Customer" },
  { id: "orders", label: "Orders" },
  { id: "refund", label: "Refund" },
  { id: "shipping", label: "Shipping Method" },
  { id: "delivery-zone", label: "Delivery Zone" },
  { id: "invoice", label: "Invoice" },
];

// Icons
const icons = {
  business: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

// Coming Soon component for non-general tabs
function ComingSoonTab({ tabName }: { tabName: string }) {
  return (
    <div className="table-card" style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{
          width: "80px",
          height: "80px",
          margin: "0 auto 20px",
          background: "linear-gradient(135deg, var(--color-champagne-gold-light, #fef7ed) 0%, var(--color-champagne-gold, #d4a574) 100%)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: "1.25rem", fontWeight: 600 }}>{tabName}</h3>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>This section is coming soon.</p>
      </div>
    </div>
  );
}

export default function BusinessSetupInfo() {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  
  // Form state for General tab
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "Arafine Silver Jewellery",
    email: "info@arafine.co",
    phone: "7799766737",
    phoneCode: "+91",
    country: "India",
    timeZone: "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi",
    pagination: "50",
    address: "Flat No 101, Chandreshwari Towers, 7-1-64/1, Dharam Karan Rd, opp. GHMC Ground, Jamuna Tirth, Ameerpet, Hyderabad, Telangana 500016",
    latitude: "-33.8688",
    longitude: "151.2195",
  });

  const [currencySettings, setCurrencySettings] = useState({
    currency: "Indian Rupi",
    currencyPosition: "left",
    decimalDigits: "2",
  });

  const [businessModel, setBusinessModel] = useState<"single" | "multi">("single");

  const [paymentOptions, setPaymentOptions] = useState({
    cashOnDelivery: true,
    digitalPayment: true,
    offlinePayment: false,
  });

  const [saving, setSaving] = useState(false);

  // Website Setup tab state
  const [websiteSettings, setWebsiteSettings] = useState({
    headerLogo: "",
    headerLogoMobile: "",
    footerLogo: "",
    favicon: "",
    loadingGif: "",
    primaryColor: "#1455AC",
    secondaryColor: "#F58300",
    panelSidebarColor: "#073B74",
    primaryLightColor: "#073B74",
    enableOfferMarquee: true,
    appleStoreLink: "",
    appleStoreLinkEnabled: false,
    playStoreLink: "",
    playStoreLinkEnabled: false,
  });

  async function handleSave() {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  }

  function handleReset() {
    // Reset to defaults
    setFormData({
      companyName: "",
      email: "",
      phone: "",
      phoneCode: "+91",
      country: "India",
      timeZone: "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi",
      pagination: "50",
      address: "",
      latitude: "",
      longitude: "",
    });
  }

  return (
    <div className="reports-container">
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
        <span style={{ color: "var(--color-champagne-gold)" }}>{icons.business}</span>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>Business Setup</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "24px", marginBottom: "24px", borderBottom: "2px solid #e5e7eb" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0 0 12px 0",
              marginBottom: "-2px",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--color-champagne-gold)" : "2px solid transparent",
              background: "transparent",
              fontSize: "14px",
              fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? "var(--color-champagne-gold)" : "#6b7280",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab Content */}
      {activeTab === "general" && (
        <>
          {/* Maintenance Mode Card */}
          <div className="table-card" style={{ marginBottom: "24px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px",
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Maintenance Mode</h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Turn on the maintenance mode will temporarily deactivate your selected systems as of your chosen date and time.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Maintenance Mode</span>
                <label className="ak-toggle">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                  />
                  <span className="ak-toggle__slider" />
                </label>
              </div>
            </div>
          </div>

          {/* Basic Information Card */}
          <div className="table-card" style={{ marginBottom: "24px" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color-light)" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Basic Information</h3>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Here you setup your all business information.
              </p>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Left Column - Form Fields */}
                <div>
                  {/* Company Name & Email */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                        Company Name <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="ak-input"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                        Email <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="email"
                        className="ak-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Phone & Country */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                        Phone <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <select
                          className="ak-input"
                          value={formData.phoneCode}
                          onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
                          style={{ width: "90px" }}
                        >
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                        </select>
                        <input
                          type="text"
                          className="ak-input"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                        Country <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <select
                        className="ak-input"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      >
                        <option value="India">India</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                      </select>
                    </div>
                  </div>

                  {/* Time Zone & Pagination */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                        Time Zone <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <select
                        className="ak-input"
                        value={formData.timeZone}
                        onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                      >
                        <option value="(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi">(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                        <option value="(GMT+00:00) London">(GMT+00:00) London</option>
                        <option value="(GMT-05:00) New York">(GMT-05:00) New York</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                        Pagination <span style={{ color: "#ef4444" }}>*</span>
                        <span style={{ color: "var(--text-muted)" }}>{icons.info}</span>
                      </label>
                      <input
                        type="number"
                        className="ak-input"
                        value={formData.pagination}
                        onChange={(e) => setFormData({ ...formData, pagination: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                      Address <span style={{ color: "#ef4444" }}>*</span>
                      <span style={{ color: "var(--text-muted)" }}>{icons.info}</span>
                    </label>
                    <input
                      type="text"
                      className="ak-input"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "var(--color-champagne-gold)" }}>
                      ℹ For the address setup you can simply drag the map to pick for the perfect <span style={{ color: "#3b82f6", cursor: "pointer" }}>Lat(Latitude)</span> & <span style={{ color: "#3b82f6", cursor: "pointer" }}>Long(Longitude)</span> Value.
                    </p>
                  </div>
                </div>

                {/* Right Column - Map Placeholder */}
                <div>
                  <div style={{
                    width: "100%",
                    height: "300px",
                    background: "#e5e7eb",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    <div style={{ textAlign: "center" }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "8px" }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <p style={{ margin: 0 }}>Map Preview</p>
                    </div>
                    {/* Lat/Long display */}
                    <div style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      background: "white",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}>
                      Lat : {formData.latitude} Long : {formData.longitude}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* General Setup - Currency */}
          <div className="table-card" style={{ marginBottom: "24px" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color-light)" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>General Setup</h3>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Here you can manage currency settings to match with your business criteria
              </p>
            </div>
            <div style={{ padding: "24px" }}>
              {/* Currency Setup */}
              <div style={{ background: "var(--color-pearl, #f9fafb)", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 600 }}>Currency Setup</h4>
                <p style={{ margin: "0 0 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Here you can manage currency settings to match with your business criteria
                </p>

                {/* Warning */}
                <div style={{
                  background: "#fef3c7",
                  border: "1px solid #f59e0b",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}>
                  <span style={{ color: "#f59e0b" }}>⚠</span>
                  <span style={{ fontSize: "0.85rem", color: "#92400e" }}>
                    Currently no payment gateway supported for Indian Rupi currency. Select at least one gateway that support Indian Rupi to digital payment work properly.
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                      Select Currency <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      className="ak-input"
                      value={currencySettings.currency}
                      onChange={(e) => setCurrencySettings({ ...currencySettings, currency: e.target.value })}
                    >
                      <option value="Indian Rupi">Indian Rupi</option>
                      <option value="US Dollar">US Dollar</option>
                      <option value="Euro">Euro</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                      Currency Position <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: "20px", marginTop: "12px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="currencyPosition"
                          checked={currencySettings.currencyPosition === "left"}
                          onChange={() => setCurrencySettings({ ...currencySettings, currencyPosition: "left" })}
                          style={{ accentColor: "var(--color-champagne-gold)" }}
                        />
                        <span style={{ fontSize: "0.9rem" }}>(₹) Left</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="currencyPosition"
                          checked={currencySettings.currencyPosition === "right"}
                          onChange={() => setCurrencySettings({ ...currencySettings, currencyPosition: "right" })}
                          style={{ accentColor: "var(--color-champagne-gold)" }}
                        />
                        <span style={{ fontSize: "0.9rem" }}>(₹) Right</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                      Digit After Decimal Point <span style={{ color: "#ef4444" }}>*</span>
                      <span style={{ color: "var(--text-muted)" }}>{icons.info}</span>
                    </label>
                    <input
                      type="number"
                      className="ak-input"
                      value={currencySettings.decimalDigits}
                      onChange={(e) => setCurrencySettings({ ...currencySettings, decimalDigits: e.target.value })}
                    />
                  </div>
                </div>

                <p style={{ margin: "16px 0 0", fontSize: "0.85rem", color: "var(--color-champagne-gold)" }}>
                  ℹ You can also set up your default and multiple currency from <span style={{ color: "#3b82f6", cursor: "pointer" }}>Currency Setup</span>
                </p>
              </div>
            </div>
          </div>

          {/* Business Model Setup */}
          <div className="table-card" style={{ marginBottom: "24px" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color-light)" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Business Model Setup</h3>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Here you can setup which type of business model you want to sell your products you can choose only one option at a time.
              </p>
            </div>
            <div style={{ padding: "24px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 500, marginBottom: "16px" }}>
                Select Business Model <span style={{ color: "#ef4444" }}>*</span>
                <span style={{ color: "var(--text-muted)" }}>{icons.info}</span>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Single Vendor */}
                <div
                  onClick={() => setBusinessModel("single")}
                  style={{
                    padding: "20px",
                    border: businessModel === "single" ? "2px solid var(--color-champagne-gold)" : "1px solid var(--border-color-light)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: businessModel === "single" ? "var(--color-champagne-gold-light, #fef7ed)" : "white",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <input
                      type="radio"
                      name="businessModel"
                      checked={businessModel === "single"}
                      onChange={() => setBusinessModel("single")}
                      style={{ accentColor: "var(--color-champagne-gold)" }}
                    />
                    <span style={{ fontWeight: 600 }}>Single Vendor</span>
                  </div>
                  <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "var(--text-muted)", paddingLeft: "24px" }}>
                    Sell products exclusively from your in-house shops only
                  </p>
                  <div style={{ paddingLeft: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#f59e0b" }}>●</span>
                    <span style={{ fontSize: "0.85rem" }}>
                      You can change setup of your shop from here <span style={{ color: "#3b82f6", cursor: "pointer" }}>In house Shop Settings</span>
                    </span>
                  </div>
                </div>

                {/* Multi Vendor */}
                <div
                  onClick={() => setBusinessModel("multi")}
                  style={{
                    padding: "20px",
                    border: businessModel === "multi" ? "2px solid var(--color-champagne-gold)" : "1px solid var(--border-color-light)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: businessModel === "multi" ? "var(--color-champagne-gold-light, #fef7ed)" : "white",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <input
                      type="radio"
                      name="businessModel"
                      checked={businessModel === "multi"}
                      onChange={() => setBusinessModel("multi")}
                      style={{ accentColor: "var(--color-champagne-gold)" }}
                    />
                    <span style={{ fontWeight: 600 }}>Multi Vendor</span>
                  </div>
                  <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "var(--text-muted)", paddingLeft: "24px" }}>
                    Alongside your store multiple vendor can register and open their store
                  </p>
                  <div style={{ paddingLeft: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#3b82f6" }}>●</span>
                    <span style={{ fontSize: "0.85rem" }}>
                      After turn on you can setup more setting for other vendors from <span style={{ color: "#3b82f6", cursor: "pointer" }}>Vendor Settings</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="table-card" style={{ marginBottom: "24px" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color-light)" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Payment Options</h3>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Enable preferred payment methods to make payments from customer app and website
              </p>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                {/* Cash on Delivery */}
                <div style={{
                  padding: "20px",
                  border: "1px solid var(--border-color-light)",
                  borderRadius: "12px",
                  background: paymentOptions.cashOnDelivery ? "var(--color-champagne-gold-light, #fef7ed)" : "white",
                }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={paymentOptions.cashOnDelivery}
                      onChange={(e) => setPaymentOptions({ ...paymentOptions, cashOnDelivery: e.target.checked })}
                      style={{ accentColor: "var(--color-champagne-gold)", marginTop: "2px", width: "18px", height: "18px" }}
                    />
                    <div>
                      <span style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>Cash on delivery</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        Enabling cash on delivery (COD) Will make it available as a payment option for customers during the checkout process
                      </span>
                    </div>
                  </label>
                </div>

                {/* Digital Payment */}
                <div style={{
                  padding: "20px",
                  border: "1px solid var(--border-color-light)",
                  borderRadius: "12px",
                  background: paymentOptions.digitalPayment ? "var(--color-champagne-gold-light, #fef7ed)" : "white",
                }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={paymentOptions.digitalPayment}
                      onChange={(e) => setPaymentOptions({ ...paymentOptions, digitalPayment: e.target.checked })}
                      style={{ accentColor: "var(--color-champagne-gold)", marginTop: "2px", width: "18px", height: "18px" }}
                    />
                    <div>
                      <span style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>Digital payment</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        Enabling digital payment will make it available as a payment option for customers during the checkout process. <span style={{ color: "#3b82f6", cursor: "pointer" }}>Digital payment methods</span>
                      </span>
                    </div>
                  </label>
                </div>

                {/* Offline Payment */}
                <div style={{
                  padding: "20px",
                  border: "1px solid var(--border-color-light)",
                  borderRadius: "12px",
                  background: paymentOptions.offlinePayment ? "var(--color-champagne-gold-light, #fef7ed)" : "white",
                }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={paymentOptions.offlinePayment}
                      onChange={(e) => setPaymentOptions({ ...paymentOptions, offlinePayment: e.target.checked })}
                      style={{ accentColor: "var(--color-champagne-gold)", marginTop: "2px", width: "18px", height: "18px" }}
                    />
                    <div>
                      <span style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>Offline payment</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        Enabling offline payment will make it available as a payment option for customers during the checkout process. <span style={{ color: "#3b82f6", cursor: "pointer" }}>Offline payment methods</span>
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: "12px 32px",
                borderRadius: "6px",
                border: "1px solid var(--border-color-light)",
                background: "white",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.9rem",
              }}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "12px 32px",
                borderRadius: "6px",
                border: "none",
                background: "var(--color-champagne-gold)",
                color: "white",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 500,
                fontSize: "0.9rem",
                opacity: saving ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              💾 {saving ? "Saving..." : "Save Information"}
            </button>
          </div>
        </>
      )}

      {/* Other Tabs - Coming Soon */}
      {activeTab !== "general" && (
        <ComingSoonTab tabName={TABS.find(t => t.id === activeTab)?.label || "This section"} />
      )}
    </div>
  );
}
