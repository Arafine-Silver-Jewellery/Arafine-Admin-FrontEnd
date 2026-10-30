import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { supportApi } from "../../api/support";
import { api } from "../../api/client";
import type { SupportTicket, TicketPriority, TicketStatus } from "../../types";
import { DataTable, StatusDropdown } from "../../components";
import { formatDateTime } from "../../utils/format";
import "../../styles/ui-kit.css";

const statusFilterOptions = [
  { value: "", label: "All Statuses", color: "neutral" as const },
  { value: "open", label: "Open", color: "info" as const },
  { value: "in_progress", label: "In Progress", color: "brand" as const },
  { value: "waiting_customer", label: "Waiting Customer", color: "warning" as const },
  { value: "resolved", label: "Resolved", color: "success" as const },
  { value: "closed", label: "Closed", color: "neutral" as const },
];

const priorityFilterOptions = [
  { value: "", label: "All Priorities", color: "neutral" as const },
  { value: "urgent", label: "Urgent", color: "danger" as const },
  { value: "high", label: "High", color: "warning" as const },
  { value: "normal", label: "Normal", color: "info" as const },
  { value: "low", label: "Low", color: "neutral" as const },
];

const statusBadge: Record<TicketStatus, string> = {
  open: "info",
  in_progress: "brand",
  waiting_customer: "warning",
  resolved: "success",
  closed: "neutral",
};

const statusLabel: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_customer: "Waiting Customer",
  resolved: "Resolved",
  closed: "Closed",
};

const priorityBadge: Record<TicketPriority, string> = {
  urgent: "danger",
  high: "warning",
  normal: "info",
  low: "neutral",
};

const categoryLabels: Record<string, string> = {
  order_issue: "Order Issue",
  product_inquiry: "Product Inquiry",
  return_refund: "Return / Refund",
  payment: "Payment",
  delivery: "Delivery",
  account: "Account",
  other: "Other",
};

interface EmployeeOption { id: string; name: string; }

export default function SupportTicket() {
  const toast = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number>; unassigned: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Detail drawer
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    loadTickets();
  }, [debouncedSearch, filterStatus, filterPriority, currentPage]);

  // Staff list for the assignment dropdown
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getEmployees();
        if (cancelled) return;
        setEmployees((res.data ?? [])
          .map((e: { id?: unknown; firstName?: unknown; lastName?: unknown }) => ({
            id: String(e.id ?? ""),
            name: [e.firstName, e.lastName].filter(Boolean).join(" "),
          }))
          .filter((e: EmployeeOption) => e.id && e.name));
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await supportApi.getTickets({
        search: debouncedSearch || undefined,
        status: (filterStatus || undefined) as TicketStatus | undefined,
        priority: (filterPriority || undefined) as TicketPriority | undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      setTickets(response.data ?? []);
      setStats(response.stats ?? null);
      setTotalItems(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 0);
    }
    catch (err) {
      setTickets([]);
      setLoadError(err instanceof Error ? err.message : "Failed to load tickets");
    }
    finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterStatus, filterPriority, currentPage, itemsPerPage]);

  async function openTicket(ticket: SupportTicket) {
    setSelected(ticket);
    setDetailLoading(true);
    setReply("");
    setInternalNote(false);
    try {
      const detail = await supportApi.getTicket(ticket.id);
      setSelected(detail);
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load ticket");
    }
    finally {
      setDetailLoading(false);
    }
  }

  async function patchSelected(patch: { status?: TicketStatus; priority?: TicketPriority; assignedToId?: string | null }) {
    if (!selected) return;
    try {
      const updated = await supportApi.updateTicket(selected.id, patch);
      setSelected((prev) => (prev ? { ...prev, ...updated } : prev));
      toast.success("Ticket updated");
      await loadTickets();
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update ticket");
    }
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const updated = await supportApi.replyTicket(selected.id, reply.trim(), internalNote);
      setSelected(updated);
      setReply("");
      setInternalNote(false);
      toast.success(internalNote ? "Internal note added" : "Reply sent");
      await loadTickets();
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reply");
    }
    finally {
      setSending(false);
    }
  }

  const columns = [
    {
      key: "ticket",
      header: "Ticket",
      render: (t: SupportTicket) => (
        <div>
          <div style={{ fontWeight: 600 }}>{t.subject}</div>
          <div className="ak-text-muted ak-text-sm">
            {t.ticketNumber} · {t.customerName}
            {t.customerMobile ? ` · ${t.customerMobile}` : ""}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      width: "140px",
      render: (t: SupportTicket) => (
        <span className="ak-text-sm">{categoryLabels[t.category] ?? t.category}</span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      width: "110px",
      render: (t: SupportTicket) => (
        <span className={`ak-status ak-status--${priorityBadge[t.priority]}`}>
          <span className="ak-status__dot" />
          {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "160px",
      render: (t: SupportTicket) => (
        <span className={`ak-status ak-status--${statusBadge[t.status]}`}>
          <span className="ak-status__dot" />
          {statusLabel[t.status]}
        </span>
      ),
    },
    {
      key: "assigned",
      header: "Assigned",
      width: "140px",
      render: (t: SupportTicket) => (
        <span className="ak-text-sm">{t.assignedToName ?? "—"}</span>
      ),
    },
    {
      key: "created",
      header: "Received",
      width: "150px",
      render: (t: SupportTicket) => (
        <span className="ak-text-sm">{formatDateTime(t.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "90px",
      render: (t: SupportTicket) => (
        <button
          type="button"
          className="ak-btn ak-btn--ghost ak-btn--sm"
          onClick={(e) => {
            e.stopPropagation();
            void openTicket(t);
          }}
        >
          Open
        </button>
      ),
    },
  ];

  return (
    <div className="ak-page">
      <div className="ak-page-header">
        <div className="ak-page-header__left">
          <h1 className="ak-page-header__title">
            Support Tickets
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">
            {stats
              ? `${stats.byStatus.open ?? 0} open · ${stats.byStatus.waiting_customer ?? 0} waiting on customer · ${stats.unassigned} unassigned`
              : "Customer support requests"}
          </p>
        </div>
      </div>

      <div className="ak-page-body">
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
                  placeholder="Search by subject, number, name or mobile…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="ak-toolbar__filters">
            <StatusDropdown options={statusFilterOptions} value={filterStatus} onChange={setFilterStatus} placeholder="All Statuses" size="sm" />
            <StatusDropdown options={priorityFilterOptions} value={filterPriority} onChange={setFilterPriority} placeholder="All Priorities" size="sm" />
          </div>
        </div>

        {loadError ? (
          <div className="ak-card" style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "var(--color-danger)", marginBottom: 16 }}>Could not load tickets: {loadError}</p>
            <button type="button" className="ak-btn ak-btn--primary" onClick={loadTickets}>Retry</button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={tickets}
            loading={loading}
            loadingText="Loading tickets…"
            emptyIcon="bell"
            emptyTitle="No tickets yet"
            emptyDescription="Customer support requests will land here."
            keyExtractor={(t: SupportTicket) => t.id}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onRowClick={(t: SupportTicket) => void openTicket(t)}
          />
        )}
      </div>

      {/* Ticket detail */}
      {selected && (
        <div className="ak-modal-overlay" onClick={() => setSelected(null)}>
          <div className="ak-modal" style={{ maxWidth: "720px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">
                {selected.subject}
                <span className="ak-text-muted ak-text-sm" style={{ marginLeft: 8, fontWeight: 400 }}>
                  {selected.ticketNumber}
                </span>
              </h2>
              <button type="button" className="ak-modal__close" onClick={() => setSelected(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="ak-modal__body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div className="ak-form-group" style={{ marginBottom: 0 }}>
                  <label className="ak-label">Status</label>
                  <select
                    className="ak-select"
                    value={selected.status}
                    onChange={(e) => void patchSelected({ status: e.target.value as TicketStatus })}
                  >
                    {(Object.keys(statusLabel) as TicketStatus[]).map(status => (
                      <option key={status} value={status}>{statusLabel[status]}</option>
                    ))}
                  </select>
                </div>
                <div className="ak-form-group" style={{ marginBottom: 0 }}>
                  <label className="ak-label">Priority</label>
                  <select
                    className="ak-select"
                    value={selected.priority}
                    onChange={(e) => void patchSelected({ priority: e.target.value as TicketPriority })}
                  >
                    {(Object.keys(priorityBadge) as TicketPriority[]).map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
                <div className="ak-form-group" style={{ marginBottom: 0, gridColumn: "1 / -1" }}>
                  <label className="ak-label">Assigned to</label>
                  <select
                    className="ak-select"
                    value={selected.assignedToId ?? ""}
                    onChange={(e) => void patchSelected({ assignedToId: e.target.value || null })}
                  >
                    <option value="">Unassigned</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ak-text-muted ak-text-sm" style={{ marginBottom: 12 }}>
                {selected.customerName}
                {selected.customerEmail ? ` · ${selected.customerEmail}` : ""}
                {selected.customerMobile ? ` · ${selected.customerMobile}` : ""}
                {" · "}
                {categoryLabels[selected.category] ?? selected.category}
                {selected.orderId ? ` · order ${selected.orderId.slice(0, 8)}` : ""}
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 12, maxHeight: 320, overflowY: "auto" }}>
                {detailLoading && <p className="ak-text-muted">Loading conversation…</p>}
                {!detailLoading && (selected.messages ?? []).length === 0 && (
                  <p className="ak-text-muted">No messages yet.</p>
                )}
                {(selected.messages ?? []).map((message) => (
                  <div
                    key={message.id}
                    style={{
                      marginBottom: 12,
                      padding: 10,
                      borderRadius: 6,
                      background: message.isInternalNote
                        ? "var(--surface-2)"
                        : message.authorType === "admin"
                          ? "var(--color-info-light)"
                          : "var(--surface-2)",
                      borderLeft: `3px solid ${message.authorType === "admin" ? "var(--color-info)" : "var(--border-color)"}`,
                    }}
                  >
                    <div className="ak-text-sm" style={{ fontWeight: 600 }}>
                      {message.authorName}
                      <span className="ak-text-muted" style={{ fontWeight: 400, marginLeft: 8 }}>
                        {formatDateTime(message.createdAt)}
                        {message.isInternalNote ? " · internal note" : ""}
                      </span>
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{message.body}</div>
                  </div>
                ))}
              </div>

              <div className="ak-form-group" style={{ marginTop: 12 }}>
                <label className="ak-label">Reply</label>
                <textarea
                  className="ak-input"
                  rows={3}
                  placeholder={internalNote ? "Internal note — the customer never sees this" : "Write a reply to the customer…"}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={internalNote}
                    onChange={(e) => setInternalNote(e.target.checked)}
                  />
                  <span className="ak-text-sm">Internal note</span>
                </label>
              </div>
            </div>

            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setSelected(null)}>Close</button>
              <button
                type="button"
                className="ak-btn ak-btn--primary"
                disabled={sending || !reply.trim()}
                onClick={() => void sendReply()}
              >
                {sending ? "Sending…" : internalNote ? "Add note" : "Send reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
