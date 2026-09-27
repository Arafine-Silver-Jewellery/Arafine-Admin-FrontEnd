import { useState } from "react";
import "../../styles/offers-deals.css";

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

  function toggleStatus(id: string) {
    setCoupons(prev =>
      prev.map(c => c.id === id ? { ...c, status: !c.status } : c)
    );
  }

  function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, couponCode: code });
  }

  const filteredCoupons = coupons.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="offers-deals-container">
      <div className="offers-header">
        <h1>
          <span className="header-icon">🎟️</span>
          Coupon Setup
        </h1>
      </div>

      <div className="coupon-form-card">
        <div className="form-grid">
          <div className="form-group">
            <label>Coupon type*</label>
            <select
              value={formData.couponType}
              onChange={(e) => setFormData({ ...formData, couponType: e.target.value })}
            >
              <option value="">Select coupon type</option>
              <option value="first_order">First Order</option>
              <option value="discount">Discount</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>
          <div className="form-group">
            <label>Coupon title*</label>
            <input
              type="text"
              placeholder="Title"
              value={formData.couponTitle}
              onChange={(e) => setFormData({ ...formData, couponTitle: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Coupon Code *</label>
            <div className="input-with-action">
              <input
                type="text"
                value={formData.couponCode}
                onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
              />
              <button className="btn-generate" onClick={generateCode}>Generate code</button>
            </div>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Coupon bearer*</label>
            <select
              value={formData.couponBearer}
              onChange={(e) => setFormData({ ...formData, couponBearer: e.target.value })}
            >
              <option value="">Select coupon bearer</option>
              <option value="admin">Admin</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
          <div className="form-group">
            <label>Vendor*</label>
            <select
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            >
              <option value="">Select vendor</option>
              <option value="all">All Vendors</option>
            </select>
          </div>
          <div className="form-group">
            <label>Customer*</label>
            <select
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
            >
              <option value="">Select customer</option>
              <option value="all">All Customers</option>
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Limit for same user*</label>
            <input
              type="text"
              placeholder="Ex: 10"
              value={formData.limitForSameUser}
              onChange={(e) => setFormData({ ...formData, limitForSameUser: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Discount type*</label>
            <select
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
            >
              <option value="Amount">Amount</option>
              <option value="Percentage">Percentage</option>
            </select>
          </div>
          <div className="form-group">
            <label>Discount Amount*(₹)</label>
            <input
              type="text"
              placeholder="Ex: 500"
              value={formData.discountAmount}
              onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Minimum purchase*(₹)</label>
            <input
              type="text"
              placeholder="Ex: 100"
              value={formData.minimumPurchase}
              onChange={(e) => setFormData({ ...formData, minimumPurchase: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Start Date*</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Expire date*</label>
            <input
              type="date"
              value={formData.expireDate}
              onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
            />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-reset">Reset</button>
          <button className="btn-submit">Submit</button>
        </div>
      </div>

      <div className="offers-card">
        <div className="offers-toolbar">
          <h3>Coupon list <span className="count">{filteredCoupons.length}</span></h3>
          <div className="toolbar-right">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by Title or Code or Discou"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <button className="btn-export">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
          </div>
        </div>

        <div className="offers-table-container">
          <table className="offers-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Coupon</th>
                <th>Coupon Type</th>
                <th>Duration</th>
                <th>User Limit</th>
                <th>Discount Bearer</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((coupon, index) => (
                <tr key={coupon.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="coupon-info">
                      <span className="coupon-title">{coupon.title}</span>
                      <span className="coupon-code">Code: {coupon.code}</span>
                    </div>
                  </td>
                  <td>{coupon.couponType}</td>
                  <td>{coupon.duration}</td>
                  <td>{coupon.userLimit}</td>
                  <td>{coupon.discountBearer}</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={coupon.status}
                        onChange={() => toggleStatus(coupon.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-view" title="View">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="btn-action btn-edit" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="btn-action btn-delete" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
