import { useState } from "react";
import "../../styles/offers-deals.css";

interface FeaturedDealItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  activeExpired: "Active" | "Expired";
  status: boolean;
}

const mockFeaturedDeals: FeaturedDealItem[] = [
  { id: "1", title: "Featured Deal", startDate: "17-Mar-26", endDate: "31-Jul-26", activeExpired: "Expired", status: false },
];

export default function FeaturedDeal() {
  const [featuredDeals, setFeaturedDeals] = useState(mockFeaturedDeals);
  const [searchQuery, setSearchQuery] = useState("");

  function toggleStatus(id: string) {
    setFeaturedDeals(prev =>
      prev.map(d => d.id === id ? { ...d, status: !d.status } : d)
    );
  }

  const filteredDeals = featuredDeals.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="offers-deals-container">
      <div className="offers-card">
        <div className="offers-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by title"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="toolbar-right">
          </div>
        </div>

        <div className="offers-table-container">
          <table className="offers-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Title</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Active / Expired</th>
                <th>Status</th>
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
                  <td>{deal.startDate}</td>
                  <td>{deal.endDate}</td>
                  <td>
                    <span className={`status-badge ${deal.activeExpired.toLowerCase()}`}>
                      {deal.activeExpired}
                    </span>
                  </td>
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
                      <button className="btn-add-product">+ Add product</button>
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
