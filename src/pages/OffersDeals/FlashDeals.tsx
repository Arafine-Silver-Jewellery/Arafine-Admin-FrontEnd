import { useState } from "react";
import "../../styles/offers-deals.css";

interface FlashDeal {
  id: string;
  title: string;
  duration: string;
  status: "Active" | "Expired";
  activeProducts: number;
  publish: boolean;
}

const mockFlashDeals: FlashDeal[] = [
  { id: "1", title: "FlashDeals", duration: "29-May-26 - 31-May-26", status: "Expired", activeProducts: 0, publish: true },
];

export default function FlashDeals() {
  const [flashDeals, setFlashDeals] = useState(mockFlashDeals);
  const [searchQuery, setSearchQuery] = useState("");

  function togglePublish(id: string) {
    setFlashDeals(prev =>
      prev.map(d => d.id === id ? { ...d, publish: !d.publish } : d)
    );
  }

  const filteredDeals = flashDeals.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="offers-deals-container">
      <div className="offers-header">
        <h1>
          <span className="header-icon yellow">⚡</span>
          Flash Deals
        </h1>
        <div className="header-actions">
          <button className="btn-secondary">Product Priority Setup</button>
          <button className="btn-primary">+ Create Flash Deals</button>
        </div>
      </div>

      <div className="offers-card">
        <div className="offers-toolbar">
          <h3>Flash Deal Table <span className="count">{filteredDeals.length}</span></h3>
          <div className="toolbar-right">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by Title"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-clear">×</button>
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
                <th>Duration</th>
                <th>Status</th>
                <th>Active Products</th>
                <th>Publish</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal, index) => (
                <tr key={deal.id}>
                  <td>{index + 1}</td>
                  <td>
                    <span className="deal-title-link">{deal.title}</span>
                  </td>
                  <td>{deal.duration}</td>
                  <td>
                    <span className={`status-badge ${deal.status.toLowerCase()}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td>{deal.activeProducts}</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={deal.publish}
                        onChange={() => togglePublish(deal.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-add-product">+ Add Product</button>
                      <button className="btn-action btn-edit" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
