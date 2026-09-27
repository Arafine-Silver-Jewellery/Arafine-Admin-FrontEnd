import { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatDateTime } from "../utils/format";
import type { User } from "../types";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
    }
    catch (error) {
      console.error("Failed to load users:", error);
    }
    finally {
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

  async function handleStatusUpdate(userId: string, newStatus: string) {
    try {
      await api.updateUserStatus(userId, newStatus);
      loadUsers();
    }
    catch (error) {
      console.error("Failed to update user status:", error);
      alert("Failed to update user status");
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "active":
        return { bg: "#dcfce7", color: "#22c55e" };
      case "suspended":
        return { bg: "#fef3c7", color: "#f59e0b" };
      case "deleted":
        return { bg: "#fee2e2", color: "#ef4444" };
      default:
        return { bg: "#f3f4f6", color: "#6b7280" };
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Users</h1>
      </header>
      <div className="page-content">
        {/* Filters */}
        <div className="search-filters">
          <form onSubmit={handleSearch} className="search-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </form>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="loading">Loading...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">No users found</td>
                  </tr>
                ) : (
                  users.map(user => {
                    const statusColors = getStatusColor(user.status);
                    return (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                background: "#1a1a2e",
                                color: "#fff",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 500,
                              }}
                            >
                              {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500 }}>
                                {user.firstName} {user.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{user.mobileNumber}</td>
                        <td>
                          <span
                            className="badge"
                            style={{ background: statusColors.bg, color: statusColors.color }}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td>{formatDateTime(user.createdAt)}</td>
                        <td>
                          <select
                            value={user.status}
                            onChange={e => handleStatusUpdate(user.id, e.target.value)}
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.8125rem",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                            }}
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="deleted">Deleted</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  className={page === pageNum ? "active" : ""}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
