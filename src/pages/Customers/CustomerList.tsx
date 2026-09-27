import { useState } from "react";
import "../../styles/customers.css";

interface Customer {
  sl: number;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  totalOrder: number;
  isBlocked: boolean;
}

const mockCustomers: Customer[] = [
  { sl: 1, name: "Janaki Bharath", avatar: "", email: "janakibharathsuman@gmail.com", phone: "+919885864333", totalOrder: 19, isBlocked: false },
  { sl: 2, name: "Vedam bharathsuman", avatar: "", email: "hello@bharathsuman.com", phone: "+916309264333", totalOrder: 5, isBlocked: false },
  { sl: 3, name: "Shekhar", avatar: "", email: "shekhar061122@gmail.com", phone: "+919705434240", totalOrder: 3, isBlocked: false },
  { sl: 4, name: "Harshitha", avatar: "", email: "harshastalks@gmail.com", phone: "+919381028172", totalOrder: 1, isBlocked: false },
  { sl: 5, name: "Srikrishna", avatar: "", email: "Sreekrishnavundavalli@gmail.com", phone: "+919876543210", totalOrder: 1, isBlocked: false },
  { sl: 6, name: "Priya Sharma", avatar: "", email: "priya.sharma@email.com", phone: "+918765432109", totalOrder: 8, isBlocked: false },
  { sl: 7, name: "Amit Kumar", avatar: "", email: "amit.kumar@email.com", phone: "+917654321098", totalOrder: 12, isBlocked: true },
  { sl: 8, name: "Sneha Gupta", avatar: "", email: "sneha.gupta@email.com", phone: "+916543210987", totalOrder: 4, isBlocked: false },
];

export default function CustomerList() {
  const [orderDate, setOrderDate] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [customerStatus, setCustomerStatus] = useState("Select status");
  const [sortBy, setSortBy] = useState("Select Customer sorting order");
  const [chooseFirst, setChooseFirst] = useState("Ex : 100");
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState(mockCustomers);

  const toggleBlock = (sl: number) => {
    setCustomers(customers.map(c => 
      c.sl === sl ? { ...c, isBlocked: !c.isBlocked } : c
    ));
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="customers-container">
      <div className="customers-header">
        <h1>
          <span className="header-icon">👥</span>
          Customer List
          <span className="count-badge">{filteredCustomers.length}</span>
        </h1>
      </div>

      <div className="filter-card">
        <div className="filter-grid">
          <div className="filter-group">
            <label>Order Date</label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              placeholder="Select Date"
            />
          </div>
          <div className="filter-group">
            <label>Customer Joining Date</label>
            <input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              placeholder="Select Date"
            />
          </div>
          <div className="filter-group">
            <label>Customer Status</label>
            <select value={customerStatus} onChange={(e) => setCustomerStatus(e.target.value)}>
              <option>Select status</option>
              <option>Active</option>
              <option>Blocked</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option>Select Customer sorting order</option>
              <option>Newest First</option>
              <option>Oldest First</option>
              <option>Most Orders</option>
              <option>Least Orders</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Choose First</label>
            <input
              type="text"
              value={chooseFirst}
              onChange={(e) => setChooseFirst(e.target.value)}
              placeholder="Ex : 100"
            />
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn-reset">Reset</button>
          <button className="btn-filter">Filter</button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>
            Customer List <span className="count">{filteredCustomers.length}</span>
          </h3>
          <div className="table-actions">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by Name or Email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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

        <div className="table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Customer Name</th>
                <th>Contact Info</th>
                <th>Total Order</th>
                <th>Block / Unblock</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.sl}>
                  <td>{customer.sl}</td>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-avatar">
                        {customer.name.charAt(0)}
                      </div>
                      <span className="customer-name">{customer.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <span className="email">{customer.email}</span>
                      <span className="phone">{customer.phone}</span>
                    </div>
                  </td>
                  <td>{customer.totalOrder}</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={!customer.isBlocked}
                        onChange={() => toggleBlock(customer.sl)}
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

        <div className="pagination">
          <button disabled>&lt;</button>
          <button className="active">1</button>
          <button>2</button>
          <button>3</button>
          <button>&gt;</button>
        </div>
      </div>
    </div>
  );
}
