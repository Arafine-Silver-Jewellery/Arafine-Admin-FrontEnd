import { useState, useEffect } from "react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { DataTable, StatusDropdown } from "../../components";
import "../../styles/ui-kit.css";

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

const statusFilterOptions = [
  { value: "", label: "All Status", color: "neutral" as const },
  { value: "active", label: "Active", color: "success" as const },
  { value: "blocked", label: "Blocked", color: "danger" as const },
];

export default function CustomerList() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // View modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter]);

  async function loadCustomers() {
    setLoading(true);
    try {
      const response = await api.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        status: statusFilter === "active" ? "active" : undefined,
        isBlocked: statusFilter === "blocked" ? "true" : undefined,
      });
      setCustomers(response.data || []);
      setTotalItems(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 0);
    } catch (error) {
      console.error("Failed to load customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  async function toggleBlock(customer: Customer) {
    try {
      await api.toggleUserBlock(customer.id, !customer.isBlocked);
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, isBlocked: !c.isBlocked } : c))
      );
      toast.success(customer.isBlocked ? "Customer unblocked" : "Customer blocked");
    } catch (error) {
      console.error("Failed to toggle block:", error);
      toast.error("Failed to update customer");
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
      toast.error("Failed to load customer details");
      setShowViewModal(false);
    } finally {
      setLoadingDetails(false);
    }
  }

  function openDeleteModal(customer: Customer) {
    setDeletingCustomer(customer);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeletingCustomer(null);
  }

  async function handleConfirmDelete() {
    if (!deletingCustomer) return;
    setDeleting(true);
    try {
      await api.deleteUser(deletingCustomer.id);
      toast.success("Customer deleted successfully");
      loadCustomers();
      closeDeleteModal();
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast.error("Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  }

  function handleExport() {
    const exportUrl = api.exportUsersCSV({ search: debouncedSearch || undefined });
    window.open(exportUrl, "_blank");
  }

  function formatPrice(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function getInitials(name: string): string {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  const columns = [
    {
      key: "customer",
      header: "Customer",
      render: (customer: Customer) => (
        <div className="ak-user-cell">
          <div className="ak-user-cell__initials">{getInitials(customer.fullName)}</div>
          <div>
            <span className="ak-user-cell__name">{customer.fullName}</span>
            <span className="ak-text-muted ak-text-sm" style={{ display: "block" }}>
              {customer.email || customer.mobileNumber}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (customer: Customer) => <span className="ak-text-muted">{customer.mobileNumber}</span>,
    },
    {
      key: "orders",
      header: "Orders",
      width: "100px",
      render: (customer: Customer) => <span>{customer.orderCount}</span>,
    },
    {
      key: "spent",
      header: "Total Spent",
      render: (customer: Customer) => (
        <span style={{ fontWeight: 500, color: "var(--color-success)" }}>{formatPrice(customer.totalSpentPaise)}</span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      width: "120px",
      render: (customer: Customer) => <span className="ak-text-muted">{formatDate(customer.createdAt)}</span>,
    },
    {
      key: "block",
      header: "Block",
      width: "80px",
      render: (customer: Customer) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={customer.isBlocked} onChange={() => toggleBlock(customer)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "100px",
      render: (customer: Customer) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--view"
            title="View"
            onClick={(e) => {
              e.stopPropagation();
              handleViewCustomer(customer);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--delete"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(customer);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
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
            Customers
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage customer accounts</p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--ghost" onClick={handleExport}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </div>

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
                  placeholder="Search customers…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="ak-toolbar__filters">
            <StatusDropdown options={statusFilterOptions} value={statusFilter} onChange={setStatusFilter} placeholder="All Status" size="sm" />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          loadingText="Loading customers…"
          emptyIcon="users"
          emptyTitle="No customers found"
          emptyDescription={debouncedSearch || statusFilter ? "Try adjusting your filters." : "Customers will appear here once they register."}
          keyExtractor={(customer) => customer.id}
          onRowClick={(customer) => handleViewCustomer(customer)}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* View Customer Modal */}
      {showViewModal && (
        <div className="ak-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="ak-modal" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Customer Details</h2>
              <button type="button" className="ak-modal__close" onClick={() => setShowViewModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              {loadingDetails ? (
                <p>Loading…</p>
              ) : selectedCustomer ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div
                      className="ak-user-cell__initials"
                      style={{ width: 60, height: 60, fontSize: "1.25rem" }}
                    >
                      {getInitials(selectedCustomer.fullName)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 600 }}>{selectedCustomer.fullName}</h3>
                      <p className="ak-text-muted" style={{ margin: "0.25rem 0 0" }}>
                        {selectedCustomer.email || "No email"}
                      </p>
                      <p className="ak-text-muted" style={{ margin: 0 }}>{selectedCustomer.mobileNumber}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                    <span className={`ak-status ak-status--${selectedCustomer.isBlocked ? "danger" : "success"}`}>
                      <span className="ak-status__dot" />
                      {selectedCustomer.isBlocked ? "Blocked" : "Active"}
                    </span>
                    <span className="ak-text-muted">Joined {formatDate(selectedCustomer.createdAt)}</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div style={{ padding: "1rem", background: "var(--surface-alt)", borderRadius: "var(--radius-md)" }}>
                      <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-strong)" }}>
                        {selectedCustomer.orderCount}
                      </span>
                      <span className="ak-text-muted" style={{ display: "block" }}>
                        Total Orders
                      </span>
                    </div>
                    <div style={{ padding: "1rem", background: "var(--surface-alt)", borderRadius: "var(--radius-md)" }}>
                      <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-success)" }}>
                        {formatPrice(selectedCustomer.totalSpentPaise)}
                      </span>
                      <span className="ak-text-muted" style={{ display: "block" }}>
                        Total Spent
                      </span>
                    </div>
                  </div>

                  {selectedCustomer.recentOrders && selectedCustomer.recentOrders.length > 0 && (
                    <>
                      <h4 style={{ marginBottom: "0.75rem", fontWeight: 600 }}>Recent Orders</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {selectedCustomer.recentOrders.slice(0, 5).map((order) => (
                          <div
                            key={order.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "0.75rem",
                              background: "var(--surface)",
                              border: "1px solid var(--border-color)",
                              borderRadius: "var(--radius-md)",
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 500 }}>{order.orderNumber}</span>
                              <span className="ak-text-muted ak-text-sm" style={{ display: "block" }}>
                                {formatDate(order.createdAt)}
                              </span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ fontWeight: 500 }}>{formatPrice(Number(order.totalPaise))}</span>
                              <span
                                className={`ak-status ak-status--${order.status === "delivered" ? "success" : order.status === "cancelled" ? "danger" : "warning"}`}
                                style={{ display: "block", marginTop: "0.25rem" }}
                              >
                                <span className="ak-status__dot" />
                                {order.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : null}
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingCustomer && (
        <div className="ak-modal-overlay" onClick={closeDeleteModal}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Delete Customer</h2>
              <button type="button" className="ak-modal__close" onClick={closeDeleteModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p>
                Are you sure you want to delete <strong>"{deletingCustomer.fullName}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={closeDeleteModal} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
