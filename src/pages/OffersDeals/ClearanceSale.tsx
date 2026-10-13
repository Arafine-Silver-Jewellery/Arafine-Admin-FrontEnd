import { useState, useEffect } from "react";
import { DataTable, StatusDropdown } from "../../components";
import "../../styles/ui-kit.css";

interface ClearanceProduct {
  id: string;
  productName: string;
  productImage: string;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  stock: number;
  status: "active" | "inactive";
}

const mockProducts: ClearanceProduct[] = [
  { id: "1", productName: "Organic Basmati Rice 5kg", productImage: "", originalPrice: 650, discountPrice: 520, discountPercent: 20, stock: 150, status: "active" },
  { id: "2", productName: "Fresh Alphonso Mangoes (Dozen)", productImage: "", originalPrice: 1200, discountPrice: 960, discountPercent: 20, stock: 45, status: "active" },
  { id: "3", productName: "Premium Cashew Nuts 500g", productImage: "", originalPrice: 850, discountPrice: 680, discountPercent: 20, stock: 80, status: "active" },
  { id: "4", productName: "Cold Pressed Coconut Oil 1L", productImage: "", originalPrice: 450, discountPrice: 360, discountPercent: 20, stock: 200, status: "active" },
  { id: "5", productName: "Assorted Dry Fruits Pack 1kg", productImage: "", originalPrice: 1500, discountPrice: 1200, discountPercent: 20, stock: 60, status: "inactive" },
  { id: "6", productName: "Organic Honey 500g", productImage: "", originalPrice: 550, discountPrice: 440, discountPercent: 20, stock: 90, status: "active" },
];

const statusFilterOptions = [
  { value: "", label: "All Status", color: "neutral" as const },
  { value: "active", label: "Active", color: "success" as const },
  { value: "inactive", label: "Inactive", color: "neutral" as const },
];

export default function ClearanceSale() {
  const [activeTab, setActiveTab] = useState("inhouse");
  const [activeOffer, setActiveOffer] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [products] = useState(mockProducts);
  const [formData, setFormData] = useState({
    duration: "04/04/2026 12:00:00 AM - 04/04/2026 11:59:59 PM",
    discountType: "flat",
    discountAmount: "20",
    offerActiveTime: "always",
    showOnHomepage: true,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.productName.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === "active").length;
  const totalSavings = products.reduce((sum, p) => sum + (p.originalPrice - p.discountPrice) * p.stock, 0);

  // Paginated data
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "60px",
      render: (_: ClearanceProduct, index: number) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "product",
      header: "Product",
      render: (product: ClearanceProduct) => (
        <div className="ak-product-cell">
          <div className="ak-product-cell__placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <span className="ak-product-cell__name">{product.productName}</span>
        </div>
      ),
    },
    {
      key: "originalPrice",
      header: "Original Price",
      width: "120px",
      render: (product: ClearanceProduct) => (
        <span style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>₹{product.originalPrice.toLocaleString()}</span>
      ),
    },
    {
      key: "discountPrice",
      header: "Discount Price",
      width: "120px",
      render: (product: ClearanceProduct) => (
        <span style={{ fontWeight: 600, color: "var(--color-success)" }}>₹{product.discountPrice.toLocaleString()}</span>
      ),
    },
    {
      key: "discountPercent",
      header: "Discount %",
      width: "100px",
      render: (product: ClearanceProduct) => (
        <span className="ak-status ak-status--success">
          <span className="ak-status__dot" />
          {product.discountPercent}% OFF
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      width: "80px",
      align: "center" as const,
      render: (product: ClearanceProduct) => <span>{product.stock}</span>,
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      render: (product: ClearanceProduct) => (
        <span className={`ak-status ak-status--${product.status === "active" ? "success" : "neutral"}`}>
          <span className="ak-status__dot" />
          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "100px",
      render: () => (
        <div className="ak-row-actions">
          <button type="button" className="ak-icon-btn ak-icon-btn--edit" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button type="button" className="ak-icon-btn ak-icon-btn--delete" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ak-page">
      {/* Page Header */}
      <div className="ak-page-header">
        <div className="ak-page-header__left">
          <h1 className="ak-page-header__title">Clearance Sale</h1>
          <p className="ak-page-header__subtitle">Manage clearance sale offers and discounts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="ak-tabs" style={{ marginBottom: 24 }}>
        <button type="button" className={`ak-tab ${activeTab === "inhouse" ? "ak-tab--active" : ""}`} onClick={() => setActiveTab("inhouse")}>
          Manage Inhouse Offer
        </button>
        <button type="button" className={`ak-tab ${activeTab === "vendor" ? "ak-tab--active" : ""}`} onClick={() => setActiveTab("vendor")}>
          Manage Vendor Offer
        </button>
        <button type="button" className={`ak-tab ${activeTab === "priority" ? "ak-tab--active" : ""}`} onClick={() => setActiveTab("priority")}>
          Priority setup
        </button>
      </div>

      {/* Settings Card */}
      <div className="ak-card" style={{ marginBottom: 24 }}>
        <div className="ak-card__body">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Active clearance sale offer?</h3>
              <p className="ak-text-muted ak-text-sm" style={{ margin: "4px 0 0" }}>
                Show your offer in the store details page in customer website and apps
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="ak-text-sm">Active Offer</span>
              <label className="ak-toggle">
                <input type="checkbox" checked={activeOffer} onChange={() => setActiveOffer(!activeOffer)} />
                <span className="ak-toggle__slider" />
              </label>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Setup Offer Logics</h4>
            <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm">
              Meta Data Setup →
            </button>
          </div>

          <div className="ak-form-grid ak-form-grid--2">
            <div className="ak-form-group">
              <label className="ak-label">Duration*</label>
              <input
                type="text"
                className="ak-input"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div className="ak-form-group">
              <label className="ak-label">Discount Type*</label>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="discountType"
                    value="flat"
                    checked={formData.discountType === "flat"}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  />
                  <span>Flat Discount</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="discountType"
                    value="product"
                    checked={formData.discountType === "product"}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  />
                  <span>Product wise discount</span>
                </label>
              </div>
            </div>
          </div>

          <div className="ak-form-grid ak-form-grid--2">
            <div className="ak-form-group">
              <label className="ak-label">Discount Amount (%)*</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="ak-input"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                  style={{ paddingRight: 40 }}
                />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>%</span>
              </div>
            </div>
            <div className="ak-form-group">
              <label className="ak-label">Offer Active Time*</label>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="offerActiveTime"
                    value="always"
                    checked={formData.offerActiveTime === "always"}
                    onChange={(e) => setFormData({ ...formData, offerActiveTime: e.target.value })}
                  />
                  <span>Always</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="offerActiveTime"
                    value="specific"
                    checked={formData.offerActiveTime === "specific"}
                    onChange={(e) => setFormData({ ...formData, offerActiveTime: e.target.value })}
                  />
                  <span>Specific time in a day</span>
                </label>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.showOnHomepage}
                onChange={(e) => setFormData({ ...formData, showOnHomepage: e.target.checked })}
              />
              <span>Also show in home page</span>
            </label>
          </div>
        </div>
        <div className="ak-card__footer">
          <button type="button" className="ak-btn ak-btn--ghost">
            Reset
          </button>
          <button type="button" className="ak-btn ak-btn--primary">
            Update
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="ak-stats-grid" style={{ marginBottom: 24 }}>
        <div className="ak-stat-card">
          <div className="ak-stat-card__icon ak-stat-card__icon--success">🏷️</div>
          <div className="ak-stat-card__content">
            <h2 className="ak-stat-card__value">{totalProducts}</h2>
            <p className="ak-stat-card__label">Total Products</p>
          </div>
        </div>
        <div className="ak-stat-card">
          <div className="ak-stat-card__icon ak-stat-card__icon--info">✅</div>
          <div className="ak-stat-card__content">
            <h2 className="ak-stat-card__value">{activeProducts}</h2>
            <p className="ak-stat-card__label">Active Products</p>
          </div>
        </div>
        <div className="ak-stat-card">
          <div className="ak-stat-card__icon ak-stat-card__icon--warning">💰</div>
          <div className="ak-stat-card__content">
            <h2 className="ak-stat-card__value">₹{totalSavings.toLocaleString()}</h2>
            <p className="ak-stat-card__label">Potential Savings</p>
          </div>
        </div>
        <div className="ak-stat-card">
          <div className="ak-stat-card__icon ak-stat-card__icon--primary">📊</div>
          <div className="ak-stat-card__content">
            <h2 className="ak-stat-card__value">{formData.discountAmount}%</h2>
            <p className="ak-stat-card__label">Flat Discount</p>
          </div>
        </div>
      </div>

      {/* Page Body */}
      <div className="ak-page-body">
        {/* Toolbar */}
        <div className="ak-toolbar">
          <div className="ak-toolbar__search">
            <div className="ak-searchbar">
              <div className="ak-searchbar__form">
                <svg className="ak-searchbar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="ak-searchbar__input"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="ak-toolbar__filters">
            <StatusDropdown options={statusFilterOptions} value={statusFilter} onChange={setStatusFilter} placeholder="All Status" size="sm" />
            <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
            <button type="button" className="ak-btn ak-btn--primary ak-btn--sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Product
            </button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedProducts}
          loading={false}
          emptyIcon="box"
          emptyTitle="No products in clearance sale"
          emptyDescription="Add products to your clearance sale to offer discounts."
          keyExtractor={(product) => product.id}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
