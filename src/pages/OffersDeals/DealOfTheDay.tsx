import { useState } from "react";
import "../../styles/offers-deals.css";

interface DealItem {
  id: string;
  title: string;
  productInfo: string;
  status: boolean;
}

const mockDeals: DealItem[] = [];

export default function DealOfTheDay() {
  const [deals, setDeals] = useState(mockDeals);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    product: "",
  });

  function toggleStatus(id: string) {
    setDeals(prev =>
      prev.map(d => d.id === id ? { ...d, status: !d.status } : d)
    );
  }

  const filteredDeals = deals.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="offers-deals-container">
      <div className="offers-header">
        <h1>
          <span className="header-icon red">🏷️</span>
          Deal Of The Day
        </h1>
      </div>

      <div className="deal-form-card">
        <div className="language-tabs">
          <button className="active">English(EN)</button>
        </div>

        <div className="form-content">
          <div className="form-group">
            <label>Title (EN) *</label>
            <input
              type="text"
              placeholder="Ex: Daily Spotlight Deal"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Products *</label>
            <select
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
            >
              <option value="">Select product</option>
              <option value="1">Product 1</option>
              <option value="2">Product 2</option>
            </select>
          </div>

          <div className="form-actions">
            <button className="btn-reset">Reset</button>
            <button className="btn-submit">Submit</button>
          </div>
        </div>
      </div>

      <div className="offers-card">
        <div className="offers-toolbar">
          <h3>Deal Of The Day <span className="count">{filteredDeals.length}</span></h3>
          <div className="toolbar-right">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by Title"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
          </div>
        </div>

        <div className="offers-table-container">
          <table className="offers-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Title</th>
                <th>Product Info</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          <circle cx="12" cy="13" r="1" fill="currentColor" />
                          <path d="M12 10v1" />
                        </svg>
                      </div>
                      <p>No deals found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal, index) => (
                  <tr key={deal.id}>
                    <td>{index + 1}</td>
                    <td>{deal.title}</td>
                    <td>{deal.productInfo}</td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={deal.status}
                          onChange={() => toggleStatus(deal.id)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td>
                      <div className="action-buttons">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
