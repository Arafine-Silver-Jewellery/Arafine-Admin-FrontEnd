import { useState, useEffect } from "react";
import { api } from "../../api/client";
import "../../styles/customers.css";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  mobileNumber: string;
  status: string;
  isBlocked: boolean;
  isDeleted: boolean;
  orderCount: number;
  totalSpentPaise: number;
  createdAt: string;
}

interface CustomerDetails extends Customer {
  recentOrders: {
    id: string;
    orderNumber: string;
    createdAt: string;
    totalPaise: number;
    status: string;
    paymentStatus: string;
  }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CustomerList() {
  // Filter states
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [joinDateFrom, setJoinDateFrom] = useState("");
  const [joinDateTo, setJoinDateTo] = useState("");
  const [customerStatus, setCustomerStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [limitFilter, setLimitFilter] = useState("20");
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Confirm modal states
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: "warning" | "danger";
    onConfirm: () => void;
  } | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadCustomers();
  }, [pagination.page]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function loadCustomers() {
    setLoading(true);
    try {
      const response = await api.getUsers({
        page: pagination.page,
        limit: parseInt(limitFilter) || 20,
        search: searchQuery || undefined,
        status: customerStatus !== "all" ? customerStatus : undefined,
        isBlocked: customerStatus === "blocked" ? "true" : undefined,
        sortBy,
        joinDateFrom: joinDateFrom || undefined,
        joinDateTo: joinDateTo || undefined,
        orderDateFrom: orderDateFrom || undefined,
        orderDateTo: orderDateTo || undefined,
      });

      setCustomers(response.data || []);
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination!.total,
          totalPages: response.pagination!.totalPages,
        }));
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
      showToast("Failed to load customers", "error");
    } finally {
      setLoading(false);
    }
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
  }

  function handleFilter() {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadCustomers();
  }

  function handleReset() {
    setOrderDateFrom("");
    setOrderDateTo("");
    setJoinDateFrom("");
    setJoinDateTo("");
    setCustomerStatus("all");
    setSortBy("newest");
    setLimitFilter("20");
    setSearchQuery("");
    setPagination(prev => ({ ...prev, page: 1 }));
    // Load with reset values
    setTimeout(() => loadCustomers(), 0);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadCustomers();
  }

  async function toggleBlock(customer: Customer) {
    try {
      await api.toggleUserBlock(customer.id, !customer.isBlocked);
      setCustomers(prev =>
        prev.map(c =>
          c.id === customer.id ? { ...c, isBlocked: !c.isBlocked } : c
        )
      );
      showToast(
        customer.isBlocked ? "Customer unblocked" : "Customer blocked",
        "success"
      );
    } catch (error) {
      console.error("Failed to toggle block:", error);
      showToast("Failed to update customer", "error");
    }
  }

  async function handleViewCustomer(customer: Customer) {
    setLoadingDetails(true);
    setShowViewModal(true);
    try {
      const details = await api.getUser(customer.id);
      setSelectedCustomer(details);
    } catch (error) {
      console.error("Failed to load customer details:", error);
      showToast("Failed to load customer details", "error");
      setShowViewModal(false);
    } finally {
      setLoadingDetails(false);
    }
  }

  function handleDeleteCustomer(customer: Customer) {
    setConfirmModal({
      show: true,
      title: "Delete Customer",
      message: `Are you sure you want to delete "${customer.fullName}"? This action can be undone by an admin.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await api.deleteUser(customer.id);
          setCustomers(prev => prev.filter(c => c.id !== customer.id));
          showToast("Customer deleted successfully", "success");
        } catch (error) {
          console.error("Failed to delete customer:", error);
          showToast("Failed to delete customer", "error");
        }
        setConfirmModal(null);
      },
    });
  }

  function handleExport() {
    const exportUrl = api.exportUsersCSV({
      search: searchQuery || undefined,
      status: customerStatus !== "all" ? customerStatus : undefined,
    });
    window.open(exportUrl, "_blank");
  }

  function formatPrice(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getInitials(name: string): string {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  function getAvatarColor(name: string): string {
    const colors = [
      "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
      "#ef4444", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  return (
    <div className="customers-container">
      {/* Filter Card */}
      <div className="filter-card">
        <div className="filter-grid">
          <div className="filter-group">
            <label>Order Date</label>
            <input
              type="date"
              value={orderDateFrom}
              onChange={(e) => setOrderDateFrom(e.target.value)}
              placeholder="dd-mm-yyyy"
            />
          </div>
          <div className="filter-group">
            <label>Customer Joining Date</label>
            <input
              type="date"
              value={joinDateFrom}
              onChange={(e) => setJoinDateFrom(e.target.value)}
              placeholder="dd-mm-yyyy"
            />
          </div>
          <div className="filter-group">
            <label>Customer Status</label>
            <select value={customerStatus} onChange={(e) => setCustomerStatus(e.target.value)}>
              <option value="all">Select status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Choose First</label>
            <input
              type="text"
              value={limitFilter}
              onChange={(e) => setLimitFilter(e.target.value)}
              placeholder="Ex : 100"
            />
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn-reset" onClick={handleReset}>Reset</button>
          <button className="btn-filter" onClick={handleFilter}>Filter</button>
        </div>
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="table-header">
          <h3>
            Customer List <span className="count">{pagination.total}</span>
          </h3>
          <div className="table-actions">
            <form className="search-box" onSubmit={handleSearch}>
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
            </form>
            <button className="btn-export" onClick={handleExport}>
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
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                    Loading...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer, index) => (
                  <tr key={customer.id}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td>
                      <div className="customer-cell">
                        <div
                          className="customer-avatar"
                          style={{ backgroundColor: getAvatarColor(customer.fullName) }}
                        >
                          {getInitials(customer.fullName)}
                        </div>
                        <span className="customer-name">{customer.fullName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <span className="email">{customer.email || "-"}</span>
                        <span className="phone">{customer.mobileNumber}</span>
                      </div>
                    </td>
                    <td>{customer.orderCount}</td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={!customer.isBlocked}
                          onChange={() => toggleBlock(customer)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-icon-view"
                          title="View"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#4f46e5" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="3" stroke="#4f46e5" strokeWidth="2"/>
                          </svg>
                        </button>
                        <button
                          className="btn-action btn-icon-delete"
                          title="Delete"
                          onClick={() => handleDeleteCustomer(customer)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <polyline points="3,6 5,6 21,6" stroke="#ef4444" strokeWidth="2"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#ef4444" strokeWidth="2"/>
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
            >
              &lt;
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (pagination.totalPages > 5) {
                if (pagination.page > 3) {
                  pageNum = pagination.page - 2 + i;
                }
                if (pageNum > pagination.totalPages) {
                  pageNum = pagination.totalPages - 4 + i;
                }
              }
              return (
                <button
                  key={pageNum}
                  className={pagination.page === pageNum ? "active" : ""}
                  onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* View Customer Modal */}
      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Customer Details</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="modal-content">
              {loadingDetails ? (
                <div className="loading-state">Loading...</div>
              ) : selectedCustomer ? (
                <>
                  {/* Customer Info */}
                  <div className="customer-details-header">
                    <div
                      className="customer-avatar-large"
                      style={{ backgroundColor: getAvatarColor(selectedCustomer.fullName) }}
                    >
                      {getInitials(selectedCustomer.fullName)}
                    </div>
                    <div className="customer-details-info">
                      <h3>{selectedCustomer.fullName}</h3>
                      <p className="customer-email">{selectedCustomer.email || "No email"}</p>
                      <p className="customer-phone">{selectedCustomer.mobileNumber}</p>
                      <div className="customer-badges">
                        <span className={`badge ${selectedCustomer.isBlocked ? "badge-blocked" : "badge-active"}`}>
                          {selectedCustomer.isBlocked ? "Blocked" : "Active"}
                        </span>
                        <span className="badge badge-info">
                          Joined {formatDate(selectedCustomer.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="customer-stats">
                    <div className="stat-card">
                      <span className="stat-value">{selectedCustomer.orderCount}</span>
                      <span className="stat-label">Total Orders</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-value">{formatPrice(selectedCustomer.totalSpentPaise)}</span>
                      <span className="stat-label">Total Spent</span>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className="customer-orders">
                    <h4>Recent Orders</h4>
                    {selectedCustomer.recentOrders && selectedCustomer.recentOrders.length > 0 ? (
                      <div className="orders-list">
                        {selectedCustomer.recentOrders.slice(0, 10).map((order) => (
                          <div key={order.id} className="order-item">
                            <div className="order-info">
                              <span className="order-number">{order.orderNumber}</span>
                              <span className="order-date">{formatDateTime(order.createdAt)}</span>
                            </div>
                            <div className="order-status">
                              <span className={`status-badge status-${order.status}`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="order-amount">
                              {formatPrice(Number(order.totalPaise))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-orders">No orders yet</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`confirm-icon ${confirmModal.type}`}>
              {confirmModal.type === "danger" ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
            </div>
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setConfirmModal(null)}>Cancel</button>
              <button className={`btn-confirm ${confirmModal.type}`} onClick={confirmModal.onConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === "success" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
