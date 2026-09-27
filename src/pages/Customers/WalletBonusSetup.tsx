import { useState } from "react";
import "../../styles/customers.css";

interface WalletBonus {
  sl: number;
  bonusTitle: string;
  bonusInfo: string;
  bonusAmount: number;
  startedOn: string;
  expiresOn: string;
  status: boolean;
}

const mockBonuses: WalletBonus[] = [];

export default function WalletBonusSetup() {
  const [bonusTitle, setBonusTitle] = useState("ExcEID Dhamaka");
  const [shortDescription, setShortDescription] = useState("ExcEID Dhamaka");
  const [bonusType, setBonusType] = useState("Percentage(%)");
  const [bonusAmount, setBonusAmount] = useState("0");
  const [minimumAddAmount, setMinimumAddAmount] = useState("0");
  const [maximumBonus, setMaximumBonus] = useState("0");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [bonuses, setBonuses] = useState(mockBonuses);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  const handleReset = () => {
    setBonusTitle("");
    setShortDescription("");
    setBonusType("Percentage(%)");
    setBonusAmount("0");
    setMinimumAddAmount("0");
    setMaximumBonus("0");
    setStartDate("");
    setEndDate("");
  };

  const toggleStatus = (sl: number) => {
    setBonuses(bonuses.map(b =>
      b.sl === sl ? { ...b, status: !b.status } : b
    ));
  };

  return (
    <div className="customers-container">
      <div className="customers-header">
        <h1>
          <span className="header-icon">👛</span>
          Wallet Bonus Setup
        </h1>
        <a href="#" className="how-it-works">
          How it works <span className="info-icon">ⓘ</span>
        </a>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Bonus Title*</label>
              <input
                type="text"
                value={bonusTitle}
                onChange={(e) => setBonusTitle(e.target.value)}
                placeholder="Enter bonus title"
              />
            </div>
            <div className="form-group">
              <label>Short Description</label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Enter short description"
              />
            </div>
            <div className="form-group">
              <label>Bonus Type</label>
              <select value={bonusType} onChange={(e) => setBonusType(e.target.value)}>
                <option>Percentage(%)</option>
                <option>Fixed Amount</option>
              </select>
            </div>
            <div className="form-group">
              <label>Bonus Amount (%)</label>
              <input
                type="number"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Minimum Add Amount (₹)*</label>
              <input
                type="number"
                value={minimumAddAmount}
                onChange={(e) => setMinimumAddAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Maximum Bonus (₹)</label>
              <input
                type="number"
                value={maximumBonus}
                onChange={(e) => setMaximumBonus(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Start Date*</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="dd-mm-yyyy"
              />
            </div>
            <div className="form-group">
              <label>End Date*</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="dd-mm-yyyy"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-reset" onClick={handleReset}>Reset</button>
            <button type="submit" className="btn-submit">Submit</button>
          </div>
        </form>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>
            Wallet Bonus Table <span className="count">{bonuses.length}</span>
          </h3>
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by bonus title"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Bonus Title</th>
                <th>Bonus Info</th>
                <th>Bonus Amount</th>
                <th>Started On</th>
                <th>Expires On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bonuses.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-icon">📁</div>
                      <p>No bonus data found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                bonuses.map((bonus) => (
                  <tr key={bonus.sl}>
                    <td>{bonus.sl}</td>
                    <td>{bonus.bonusTitle}</td>
                    <td>{bonus.bonusInfo}</td>
                    <td>₹{bonus.bonusAmount.toFixed(2)}</td>
                    <td>{bonus.startedOn}</td>
                    <td>{bonus.expiresOn}</td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={bonus.status}
                          onChange={() => toggleStatus(bonus.sl)}
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
