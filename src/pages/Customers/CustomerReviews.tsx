import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { reviewsApi } from "../../api/reviews";
import { DataTable, StatusDropdown } from "../../components";
import { formatDateTime } from "../../utils/format";
import "../../styles/customers.css";
import "../../styles/ui-kit.css";

interface AdminReviewRow {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  imageUrls: string[];
  helpfulCount: number;
  isVisible: boolean;
  adminReply: string | null;
  adminReplyAt: string | null;
  userId: string;
  productId: string;
  productName: string | null;
  createdAt: string;
}

const statusOptions = [
  { value: "", label: "All Statuses", color: "neutral" as const },
  { value: "pending", label: "Pending", color: "info" as const },
  { value: "approved", label: "Approved", color: "success" as const },
  { value: "rejected", label: "Rejected", color: "danger" as const },
];

export default function CustomerReviews() {
  const toast = useToast();

  const [reviews, setReviews] = useState<AdminReviewRow[]>([]);
  const [stats, setStats] = useState<{ total: number; pending: number; approved: number; rejected: number } | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [replyTarget, setReplyTarget] = useState<AdminReviewRow | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [replyError, setReplyError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await reviewsApi.getReviews({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: (filterStatus || undefined) as "pending" | "approved" | "rejected" | undefined,
      });
      setReviews(res.data ?? []);
      setStats(res.stats ?? null);
      setTotalItems(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    }
    catch (err) {
      setReviews([]);
      setError(err instanceof Error ? err.message : "Could not load the reviews");
    }
    finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  async function moderate(review: AdminReviewRow, approve: boolean) {
    try {
      await reviewsApi.moderate(review.id, approve);
      toast.success(approve ? "Review published" : "Review hidden");
      await load();
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the review");
    }
  }

  async function sendReply() {
    if (!replyTarget || !replyText.trim()) return;
    setSaving(true);
    setReplyError("");
    try {
      await reviewsApi.reply(replyTarget.id, replyText.trim());
      toast.success("Reply sent");
      setReplyTarget(null);
      setReplyText("");
      await load();
    }
    catch (err) {
      setReplyError(err instanceof Error ? err.message : "Could not send the reply");
    }
    finally {
      setSaving(false);
    }
  }

  const columns = [
    {
      key: "review",
      header: "Review",
      render: (review: AdminReviewRow) => (
        <div>
          <div style={{ fontWeight: 600 }}>{review.title || "(no title)"}</div>
          <div className="ak-text-muted ak-text-sm">
            {review.productName ?? "Unknown product"} · {review.rating}★ · {formatDateTime(review.createdAt)}
          </div>
          {review.comment && <div className="ak-text-sm" style={{ marginTop: 4 }}>{review.comment}</div>}
          {review.imageUrls.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {review.imageUrls.map(url => (
                <img
                  key={url}
                  src={url}
                  alt="Review image"
                  style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                />
              ))}
            </div>
          )}
          {review.adminReply && (
            <div className="ak-text-sm" style={{ marginTop: 6, color: "var(--color-info)" }}>
              Reply: {review.adminReply}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "helpful",
      header: "Helpful",
      width: "90px",
      align: "right" as const,
      render: (review: AdminReviewRow) => review.helpfulCount,
    },
    {
      key: "visibility",
      header: "Status",
      width: "110px",
      render: (review: AdminReviewRow) => (
        <span className={`ak-status ak-status--${review.isVisible ? "success" : "danger"}`}>
          <span className="ak-status__dot" />
          {review.isVisible ? "Published" : "Hidden"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "190px",
      render: (review: AdminReviewRow) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-btn ak-btn--ghost ak-btn--sm"
            onClick={() => {
              setReplyTarget(review);
              setReplyText(review.adminReply ?? "");
              setReplyError("");
            }}
          >
            Reply
          </button>
          <button
            type="button"
            className="ak-btn ak-btn--ghost ak-btn--sm"
            onClick={() => void moderate(review, !review.isVisible)}
          >
            {review.isVisible ? "Hide" : "Publish"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="customers-container">
      <div className="summary-section">
        <h3>Summary</h3>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon balance">📝</div>
            <span className="summary-label">Total reviews</span>
            <span className="summary-value balance">{stats?.total ?? 0}</span>
          </div>
          <div className="summary-card">
            <div className="summary-icon credit">⏳</div>
            <span className="summary-label">Pending</span>
            <span className="summary-value credit">{stats?.pending ?? 0}</span>
          </div>
          <div className="summary-card">
            <div className="summary-icon debit">🚫</div>
            <span className="summary-label">Hidden</span>
            <span className="summary-value debit">{stats?.rejected ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>
            Customer Reviews <span className="count">{totalItems}</span>
          </h3>
          <div className="table-actions">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, comment or product"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <StatusDropdown
              options={statusOptions}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="All Statuses"
              size="sm"
            />
          </div>
        </div>

        {error ? (
          <div className="empty-state">
            <p>{error}</p>
            <button type="button" className="btn-filter-outline" onClick={load}>Retry</button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={reviews}
            loading={loading}
            loadingText="Loading reviews…"
            emptyIcon="users"
            emptyTitle="No reviews yet"
            emptyDescription="Customer reviews show up here for moderation."
            keyExtractor={(review: AdminReviewRow) => review.id}
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={20}
            onPageChange={setPage}
          />
        )}
      </div>

      {replyTarget && (
        <div className="ak-modal-overlay" onClick={() => !saving && setReplyTarget(null)}>
          <div className="ak-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Reply to review</h2>
              <button type="button" className="ak-modal__close" onClick={() => setReplyTarget(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p className="ak-text-muted ak-text-sm" style={{ marginBottom: 12 }}>
                {replyTarget.productName} · {replyTarget.rating}★
              </p>
              <div className="ak-form-group">
                <label className="ak-label">Your reply *</label>
                <textarea
                  className="ak-input"
                  rows={4}
                  placeholder="Shown to the customer under the review"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>
              {replyError && <div className="ak-alert ak-alert--danger" style={{ marginTop: 12 }}>{replyError}</div>}
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setReplyTarget(null)} disabled={saving}>Cancel</button>
              <button
                type="button"
                className="ak-btn ak-btn--primary"
                disabled={saving || !replyText.trim()}
                onClick={() => void sendReply()}
              >
                {saving ? "Sending…" : "Send reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
