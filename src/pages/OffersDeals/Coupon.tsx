import { useState, useEffect } from "react";
import { DataTable } from "../../components";
import "../../styles/ui-kit.css";

interface CouponItem {
  id: string;
  title: string;
  code: string;
  couponType: string;
  duration: string;
  userLimit: string;
  discountBearer: string;
  status: boolean;
}

const mockCoupons: CouponItem[] = [
  { id: "1", title: "First Order", code: "ara10", couponType: "First Order", duration: "23 May, 26 - 23 Jul, 26", userLimit: "Limit: , Used: 1", discountBearer: "Admin", status: true },
  { id: "2", title: "first10", code: "first10", couponType: "First Order", duration: "18 Jun, 26 - 30 Jun, 26", userLimit: "Limit: , Used: 0", discountBearer: "Admin", status: true },
];

export default function Coupon() {
  const [coupons, setCoupons] = useState(mockCoupons);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFormCard, setShowFormCard] = useState(false);
  const [formData, setFormData] = useState({
    couponType: "",
    couponTitle: "",
    couponCode: "FHWF00R3RA",
    couponBearer: "",
    vendor: "",
    customer: "",
    limitForSameUser: "10",
    discountType: "Amount",
    discountAmount: "500",
    minimumPurchase: "100",
    startDate: "",
    expireDate: "",
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

  function toggleStatus(id: string) {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, status: !c.status } : c)));
  }

  function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, couponCode: code });
  }

  function handleReset() {
    setFormData({
      couponType: "",
      couponTitle: "",
      couponCode: "FHWF00R3RA",
      couponBearer: "",
      vendor: "",
      customer: "",
      limitForSameUser: "10",
      discountType: "Amount",
      discountAmount: "500",
      minimumPurchase: "100",
      startDate: "",
      expireDate: "",
    });
  }

  function handleSubmit() {
    // TODO: API call
    setShowFormCard(false);
    handleReset();
  }

  const filteredCoupons = coupons.filter(
    (c) => c.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || c.code.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Paginated data
  const totalItems = filteredCoupons.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedCoupons = filteredCoupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "60px",
      render: (_: CouponItem, index: number) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "coupon",
      header: "Coupon",
      render: (coupon: CouponItem) => (
        <div>
          <span style={{ fontWeight: 600, display: "block" }}>{coupon.title}</span>
          <span className="ak-text-muted ak-text-sm">Code: {coupon.code}</span>
        </div>
      ),
    },
    {
      key: "couponType",
      header: "Coupon Type",
      render: (coupon: CouponItem) => (
        <span className="ak-status ak-status--info">
          <span className="ak-status__dot" />
          {coupon.couponType}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (coupon: CouponItem) => <span className="ak-text-muted">{coupon.duration}</span>,
    },
    {
      key: "userLimit",
      header: "User Limit",
      render: (coupon: CouponItem) => <span>{coupon.userLimit}</span>,
    },
    {
      key: "discountBearer",
      header: "Discount Bearer",
      render: (coupon: CouponItem) => (
        <span className={`ak-status ak-status--${coupon.discountBearer === "Admin" ? "success" : "warning"}`}>
          <span className="ak-status__dot" />
          {coupon.discountBearer}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "80px",
      render: (coupon: CouponItem) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={coupon.status} onChange={() => toggleStatus(coupon.id)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "120px",
      render: (_coupon: CouponItem) => (
        <div className="ak-row-actions">
          <button type="button" className="ak-icon-btn ak-icon-btn--view" title="View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button type="button" className="ak-icon-btn ak-icon-btn--edit" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button type="button" className="ak-icon-btn ak-icon-btn--delete" title="Delete">
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
          <h1 className="ak-page-header__title">
            Coupons
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage discount coupons for your customers</p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--primary" onClick={() => setShowFormCard(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Coupon
          </button>
        </div>
      </div>

      {/* Add Coupon Form Card */}
      {showFormCard && (
        <div className="ak-card" style={{ marginBottom: 24 }}>
          <div className="ak-card__header">
            <h3 className="ak-card__title">Add New Coupon</h3>
            <button type="button" className="ak-icon-btn" onClick={() => setShowFormCard(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="ak-card__body">
            <div className="ak-form-grid ak-form-grid--3">
              <div className="ak-form-group">
                <label className="ak-label">Coupon type*</label>
                <select className="ak-select" value={formData.couponType} onChange={(e) => setFormData({ ...formData, couponType: e.target.value })}>
                  <option value="">Select coupon type</option>
                  <option value="first_order">First Order</option>
                  <option value="discount">Discount</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Coupon title*</label>
                <input
                  type="text"
                  className="ak-input"
                  placeholder="Title"
                  value={formData.couponTitle}
                  onChange={(e) => setFormData({ ...formData, couponTitle: e.target.value })}
                />
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Coupon Code *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    className="ak-input"
                    value={formData.couponCode}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="ak-btn ak-btn--ghost" onClick={generateCode}>
                    Generate
                  </button>
                </div>
              </div>
            </div>

            <div className="ak-form-grid ak-form-grid--3">
              <div className="ak-form-group">
                <label className="ak-label">Coupon bearer*</label>
                <select className="ak-select" value={formData.couponBearer} onChange={(e) => setFormData({ ...formData, couponBearer: e.target.value })}>
                  <option value="">Select coupon bearer</option>
                  <option value="admin">Admin</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Vendor*</label>
                <select className="ak-select" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}>
                  <option value="">Select vendor</option>
                  <option value="all">All Vendors</option>
                </select>
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Customer*</label>
                <select className="ak-select" value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })}>
                  <option value="">Select customer</option>
                  <option value="all">All Customers</option>
                </select>
              </div>
            </div>

            <div className="ak-form-grid ak-form-grid--3">
              <div className="ak-form-group">
                <label className="ak-label">Limit for same user*</label>
                <input
                  type="text"
                  className="ak-input"
                  placeholder="Ex: 10"
                  value={formData.limitForSameUser}
                  onChange={(e) => setFormData({ ...formData, limitForSameUser: e.target.value })}
                />
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Discount type*</label>
                <select className="ak-select" value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}>
                  <option value="Amount">Amount</option>
                  <option value="Percentage">Percentage</option>
                </select>
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Discount Amount*(₹)</label>
                <input
                  type="text"
                  className="ak-input"
                  placeholder="Ex: 500"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="ak-form-grid ak-form-grid--3">
              <div className="ak-form-group">
                <label className="ak-label">Minimum purchase*(₹)</label>
                <input
                  type="text"
                  className="ak-input"
                  placeholder="Ex: 100"
                  value={formData.minimumPurchase}
                  onChange={(e) => setFormData({ ...formData, minimumPurchase: e.target.value })}
                />
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Start Date*</label>
                <input type="date" className="ak-input" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Expire date*</label>
                <input type="date" className="ak-input" value={formData.expireDate} onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="ak-card__footer">
            <button type="button" className="ak-btn ak-btn--ghost" onClick={handleReset}>
              Reset
            </button>
            <button type="button" className="ak-btn ak-btn--primary" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </div>
      )}

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
                  placeholder="Search by Title or Code…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="ak-toolbar__filters">
            <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedCoupons}
          loading={false}
          emptyIcon="cart"
          emptyTitle="No coupons found"
          emptyDescription="Create your first coupon to offer discounts to customers."
          emptyAction={{ label: "Add Coupon", onClick: () => setShowFormCard(true) }}
          keyExtractor={(coupon) => coupon.id}
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
