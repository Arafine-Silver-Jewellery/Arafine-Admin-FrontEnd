import { useState } from "react";
import "../../styles/offers-deals.css";

export default function ClearanceSale() {
  const [activeTab, setActiveTab] = useState("inhouse");
  const [activeOffer, setActiveOffer] = useState(false);
  const [formData, setFormData] = useState({
    duration: "04/04/2026 12:00:00 AM - 04/04/2026 11:59:59 PM",
    discountType: "flat",
    discountAmount: "10",
    offerActiveTime: "always",
    showOnHomepage: true,
  });

  return (
    <div className="offers-deals-container">
      <div className="clearance-tabs">
        <button
          className={activeTab === "inhouse" ? "active" : ""}
          onClick={() => setActiveTab("inhouse")}
        >
          Manage Inhouse Offer
        </button>
        <button
          className={activeTab === "vendor" ? "active" : ""}
          onClick={() => setActiveTab("vendor")}
        >
          Manage Vendor Offer
        </button>
        <button
          className={activeTab === "priority" ? "active" : ""}
          onClick={() => setActiveTab("priority")}
        >
          Priority setup
        </button>
      </div>

      <div className="clearance-card">
        <div className="active-offer-row">
          <div className="offer-info">
            <h3>Active clearance sale offer ?</h3>
            <p>Show your offer in the store details page in customer website and apps</p>
          </div>
          <div className="offer-toggle">
            <span>Active Offer</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={activeOffer}
                onChange={() => setActiveOffer(!activeOffer)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="setup-section">
          <div className="section-header">
            <h3>Setup Offer Logics</h3>
            <button className="btn-link">Meta Data Setup →</button>
          </div>

          <div className="form-grid two-cols">
            <div className="form-group">
              <label>Duration*</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Discount Type*</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="discountType"
                    value="flat"
                    checked={formData.discountType === "flat"}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  />
                  <span>Flat Discount</span>
                </label>
                <label className="radio-label">
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

          <div className="form-grid two-cols">
            <div className="form-group">
              <label>Discount Amount (%)*</label>
              <div className="input-with-suffix">
                <input
                  type="text"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                />
                <span className="suffix">%</span>
              </div>
            </div>
            <div className="form-group">
              <label>Offer Active Time*</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="offerActiveTime"
                    value="always"
                    checked={formData.offerActiveTime === "always"}
                    onChange={(e) => setFormData({ ...formData, offerActiveTime: e.target.value })}
                  />
                  <span>Always</span>
                </label>
                <label className="radio-label">
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

          <div className="checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.showOnHomepage}
                onChange={(e) => setFormData({ ...formData, showOnHomepage: e.target.checked })}
              />
              <span>Also show in home page</span>
            </label>
          </div>

          <div className="form-actions">
            <button className="btn-reset">Reset</button>
            <button className="btn-submit">Update</button>
          </div>
        </div>
      </div>

      <div className="product-list-section">
        <div className="section-header">
          <h3>Product List</h3>
          <button className="btn-primary">+ Add Product</button>
        </div>

        <div className="empty-product-list">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="8" x2="12" y2="8.01" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
