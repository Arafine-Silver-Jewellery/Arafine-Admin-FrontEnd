import { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatDateTime } from "../utils/format";
import { DataTable, StatusDropdown, FilterDrawer } from "../components";
import type { User } from "../types";
import "../styles/ui-kit.css";

const statusOptions = [
  { value: "", label: "All Status", color: "neutral" as const },
  { value: "active", label: "Active", color: "success" as const },
  { value: "suspended", label: "Suspended", color: "warning" as const },
  { value: "deleted", label: "Deleted", color: "danger" as const },
];

const userStatusChangeOptions = [
  { value: "active", label: "Active", color: "success" as const },
  { value: "suspended", label: "Suspended", color: "warning" as const },
  { value: "deleted", label: "Deleted", color: "danger" as const },
];

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [tempStatusFilter, setTempStatusFilter] = useState("");

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await api.getUsers({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setUsers(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [page, statusFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadUsers();
  }

  function openFilterDrawer() {
    setTempStatusFilter(statusFilter);
    setShowFilterDrawer(true);
  }

  function applyFilters() {
    setStatusFilter(tempStatusFilter);
    setPage(1);
    setShowFilterDrawer(false);
  }

  function resetFilters() {
    setTempStatusFilter("");
    setStatusFilter("");
    setPage(1);
    setShowFilterDrawer(false);
  }

  const activeFilterCount = statusFilter ? 1 : 0;

  async function handleStatusUpdate(userId: string, newStatus: string) {
    try {
      await api.updateUserStatus(userId, newStatus);
      loadUsers();
    } catch (error) {
      console.error("Failed to update user status:", error);
      alert("Failed to update user status");
    }
  }

  function getStatusVariant(status: string): string {
    switch (status) {
      case "active": return "success";
      case "suspended": return "warning";
      case "deleted": return "danger";
      default: return "neutral";
    }
  }

  const columns = [
    {
      key: "name",
      header: "Customer",
      render: (user: User) => (
        <div className="ak-user-cell">
          <div className="ak-user-cell__initials">{user.firstName[0]}{user.lastName[0]}</div>
          <div className="ak-user-cell__info">
            <span className="ak-user-cell__name">{user.firstName} {user.lastName}</span>
            <span className="ak-user-cell__email">{user.mobileNumber}</span>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (user: User) => <span className="ak-code">{user.mobileNumber}</span> },
    {
      key: "status",
      header: "Status",
      render: (user: User) => (
        <span className={`ak-status ak-status--${getStatusVariant(user.status)}`}>
          <span className="ak-status__dot" />
          {user.status}
        </span>
      ),
    },
    { key: "joined", header: "Joined", render: (user: User) => <span className="ak-text-muted">{formatDateTime(user.createdAt)}</span> },
    {
      key: "actions",
      header: "Actions",
      width: "160px",
      render: (user: User) => (
        <div onClick={(e) => e.stopPropagation()}>
          <StatusDropdown
            options={userStatusChangeOptions}
            value={user.status}
            onChange={(val) => handleStatusUpdate(user.id, val)}
            size="sm"
          />
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
          <p className="ak-page-header__subtitle">Manage customer accounts and status</p>
        </div>
      </div>

      {/* Page Body */}
      <div className="ak-page-body">
        {/* Toolbar */}
        <div className="ak-toolbar">
          <form onSubmit={handleSearch} className="ak-toolbar__search">
            <div className="ak-searchbar">
              <div className="ak-searchbar__form">
                <svg className="ak-searchbar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input type="text" className="ak-searchbar__input" placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </form>

          <div className="ak-toolbar__filters">
            <StatusDropdown
              options={statusOptions}
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              placeholder="All Status"
              size="sm"
            />
            {activeFilterCount > 0 && <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => { setStatusFilter(""); setPage(1); }}>Clear</button>}
          </div>

          <div className="ak-toolbar__actions">
            <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={openFilterDrawer}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><circle cx="4" cy="12" r="2" /><circle cx="12" cy="10" r="2" /><circle cx="20" cy="14" r="2" /></svg>
              Filters
            </button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          loadingText="Loading customers…"
          emptyIcon="users"
          emptyTitle="No customers found"
          emptyDescription={search || statusFilter ? "Try adjusting your filters or search query." : "When customers sign up, they'll appear here."}
          keyExtractor={(user) => user.id}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={20}
          onPageChange={setPage}
        />
      </div>

      {/* Filter Drawer */}
      <FilterDrawer isOpen={showFilterDrawer} onClose={() => setShowFilterDrawer(false)} title="Filter Customers" onApply={applyFilters} onReset={resetFilters}>
        <div className="ak-filter-field">
          <label className="ak-filter-field__label">Status</label>
          <StatusDropdown options={statusOptions} value={tempStatusFilter} onChange={setTempStatusFilter} placeholder="All Status" />
        </div>
      </FilterDrawer>
    </div>
  );
}
