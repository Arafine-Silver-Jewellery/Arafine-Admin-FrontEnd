import { useState } from "react";
import "../../styles/reports.css";

interface EarningData {
  sl: number;
  duration: string;
  inHouseEarning: number;
  commissionEarning: number;
  earnFromShipping: number;
  deliverymanIncentive: number;
  discountGiven: number;
  vatTax: number;
  refundGiven: number;
  totalEarning: number;
}

const mockEarnings: EarningData[] = [
  { sl: 1, duration: "Jan", inHouseEarning: 0, commissionEarning: 0, earnFromShipping: 0, deliverymanIncentive: 0, discountGiven: 0, vatTax: 0, refundGiven: 0, totalEarning: 0 },
  { sl: 2, duration: "Feb", inHouseEarning: 0, commissionEarning: 0, earnFromShipping: 0, deliverymanIncentive: 0, discountGiven: 0, vatTax: 0, refundGiven: 0, totalEarning: 0 },
  { sl: 3, duration: "Mar", inHouseEarning: 2000, commissionEarning: 0, earnFromShipping: 0, deliverymanIncentive: 0, discountGiven: 0, vatTax: 0, refundGiven: 0, totalEarning: 2000 },
  { sl: 4, duration: "Apr", inHouseEarning: 1, commissionEarning: 0, earnFromShipping: 5, deliverymanIncentive: 0, discountGiven: 0, vatTax: 0, refundGiven: 0, totalEarning: 6 },
  { sl: 5, duration: "May", inHouseEarning: 4, commissionEarning: 0, earnFromShipping: 0, deliverymanIncentive: 0, discountGiven: 0, vatTax: 0, refundGiven: 0, totalEarning: 4 },
  { sl: 6, duration: "Jun", inHouseEarning: 19995, commissionEarning: 0, earnFromShipping: 0, deliverymanIncentive: 0, discountGiven: 2979.20, vatTax: 0, refundGiven: 0, totalEarning: 17015.80 },
  { sl: 7, duration: "Jul", inHouseEarning: 3279.20, commissionEarning: 0, earnFromShipping: 0, deliverymanIncentive: 0, discountGiven: 0, vatTax: 0, refundGiven: 0, totalEarning: 3279.20 },
  { sl: 8, duration: "Aug", inHouseEarning: 48537.93, commissionEarning: 0, earnFromShipping: 0, deliverymanIncentive: 0, discountGiven: 0, vatTax: 0, refundGiven: 0, totalEarning: 48537.93 },
];

export default function EarningReports() {
  const [activeTab, setActiveTab] = useState<"admin" | "vendor">("admin");
  const [dateFilter, setDateFilter] = useState("This Year");

  const totalEarnings = 80769.33;
  const commission = 0;
  const inHouse = 83743.53;
  const shipping = 5;

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>
          <span className="header-icon">📊</span>
          Earning Reports
        </h1>
      </div>

      <div className="report-tabs">
        <button
          className={activeTab === "admin" ? "active" : ""}
          onClick={() => setActiveTab("admin")}
        >
          Admin Earning
        </button>
        <button
          className={activeTab === "vendor" ? "active" : ""}
          onClick={() => setActiveTab("vendor")}
        >
          Vendor Earning
        </button>
      </div>

      <div className="filter-card">
        <h3>Filter Data</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Select Date</label>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option>This Year</option>
              <option>This Month</option>
              <option>This Week</option>
              <option>Today</option>
            </select>
          </div>
          <button className="btn-filter-primary">Filter</button>
        </div>
      </div>

      {activeTab === "admin" ? (
        <>
          <div className="stats-grid">
            <div className="stat-card wide">
              <div className="stat-icon blue">💰</div>
              <div className="stat-content">
                <h2>₹{totalEarnings.toLocaleString()}</h2>
                <p>Total earnings</p>
                <div className="stat-breakdown">
                  <div className="breakdown-item red">
                    <span>₹{commission.toFixed(2)}</span>
                    <label>Commission</label>
                  </div>
                  <div className="breakdown-item blue">
                    <span>₹{inHouse.toLocaleString()}</span>
                    <label>In House</label>
                  </div>
                  <div className="breakdown-item green">
                    <span>₹{shipping.toFixed(2)}</span>
                    <label>Shipping</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon yellow">🏷️</div>
              <div className="stat-content">
                <h2>242</h2>
                <p>Total In House Products</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon red">🏪</div>
              <div className="stat-content">
                <h2>0</h2>
                <p>Total Shop</p>
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <h3>Earning Statistics</h3>
              <div className="chart-placeholder">
                <div className="chart-bars">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, i) => (
                    <div key={month} className="chart-bar-group">
                      <div 
                        className="chart-bar" 
                        style={{ height: `${i === 7 ? 80 : i === 5 ? 40 : i === 2 ? 20 : 5}%` }}
                      ></div>
                      <span>{month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="chart-card">
              <h3>Payment Statistics</h3>
              <div className="payment-stats">
                <div className="donut-chart">
                  <div className="donut-center">
                    <span className="donut-value">₹65.1K+</span>
                    <span className="donut-label">Payments Amount</span>
                  </div>
                </div>
                <div className="payment-legend">
                  <div className="legend-item">
                    <span className="dot green"></span>
                    Cash payments (₹48,940.01)
                  </div>
                  <div className="legend-item">
                    <span className="dot blue"></span>
                    Digital payments (₹16,125.80)
                  </div>
                  <div className="legend-item">
                    <span className="dot yellow"></span>
                    Wallet (₹0.00)
                  </div>
                  <div className="legend-item">
                    <span className="dot gray"></span>
                    Offline payments (₹0.00)
                  </div>
                  <div className="legend-item">
                    <span className="dot orange"></span>
                    Returned Amount (₹0.00)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>Total Earnings <span className="count">12</span></h3>
              <button className="btn-export">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
            </div>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>SL</th>
                    <th>Duration</th>
                    <th>In-House Earning</th>
                    <th>Commission Earning</th>
                    <th>Earn From Shipping</th>
                    <th>Deliveryman Incentive</th>
                    <th>Discount Given</th>
                    <th>VAT/TAX</th>
                    <th>Refund Given</th>
                    <th>Total Earning</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockEarnings.map((row) => (
                    <tr key={row.sl}>
                      <td>{row.sl}</td>
                      <td>{row.duration}</td>
                      <td>₹{row.inHouseEarning.toFixed(2)}</td>
                      <td>₹{row.commissionEarning.toFixed(2)}</td>
                      <td>₹{row.earnFromShipping.toFixed(2)}</td>
                      <td>₹{row.deliverymanIncentive.toFixed(2)}</td>
                      <td>₹{row.discountGiven.toFixed(2)}</td>
                      <td>₹{row.vatTax.toFixed(2)}</td>
                      <td>₹{row.refundGiven.toFixed(2)}</td>
                      <td>₹{row.totalEarning.toFixed(2)}</td>
                      <td>
                        <button className="btn-action btn-download">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7,10 12,15 17,10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="vendor-earning-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon red">🏪</div>
              <div className="stat-content">
                <h2>0</h2>
                <p>Total Vendor</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon yellow">🛒</div>
              <div className="stat-content">
                <h2>0</h2>
                <p>Total Vendor Products</p>
                <div className="stat-breakdown">
                  <div className="breakdown-item red">
                    <span>0</span>
                    <label>Denied</label>
                  </div>
                  <div className="breakdown-item blue">
                    <span>0</span>
                    <label>Pending Request</label>
                  </div>
                  <div className="breakdown-item green">
                    <span>0</span>
                    <label>Approved</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">💵</div>
              <div className="stat-content">
                <h2>₹0.00</h2>
                <p>Total Earning</p>
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <h3>Earning Statistics</h3>
              <p className="chart-subtitle">Average Earning Value : ₹0.00</p>
              <div className="chart-placeholder empty">
                <div className="chart-bars">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
                    <div key={month} className="chart-bar-group">
                      <div className="chart-bar" style={{ height: "2%" }}></div>
                      <span>{month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="chart-card">
              <h3>Vendor Wallet Status</h3>
              <div className="wallet-stats">
                <div className="wallet-amount">
                  <span className="amount">₹0.00</span>
                  <span className="label">Wallet Amount</span>
                </div>
                <div className="wallet-legend">
                  <div className="legend-item">
                    <span className="dot blue"></span>
                    Withdrawable Balance (₹0.00)
                  </div>
                  <div className="legend-item">
                    <span className="dot dark-blue"></span>
                    Pending Withdraws (₹0.00)
                  </div>
                  <div className="legend-item">
                    <span className="dot yellow"></span>
                    Already Withdrawn (₹0.00)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
