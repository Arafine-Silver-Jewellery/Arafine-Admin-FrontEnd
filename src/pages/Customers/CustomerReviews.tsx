import { useState, useEffect } from "react";
import { api } from "../../api/client";
import "../../styles/customers.css";

interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  userId: string;
  customerName: string;
  customerPhone: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  imageUrls: string[];
  isVerifiedPurchase: boolean;
  isVisible: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerReviews() {
  const [searchQuery, setSearchQuery] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.getReviews({
        page,
        pageSize,
        search: searchQuery || undefined,
      });
      setReviews(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      fetchReviews();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const toggleVisibility = async (reviewId: string, currentVisibility: boolean) => {
    try {
      await api.updateReviewVisibility(reviewId, !currentVisibility);
      setReviews(reviews.map(r =>
        r.id === reviewId ? { ...r, isVisible: !currentVisibility } : r
      ));
    } catch (error) {
      console.error("Failed to update review visibility:", error);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await api.deleteReview(reviewId);
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error("Failed to delete review:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  return (
    <div className="customers-container">
      <div className="table-card">
        <div className="table-header">
          <h3>Customer Reviews List</h3>
          <div className="table-actions">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by Product Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn-filter-outline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
              </svg>
              Filter
            </button>
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
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "32px" }}>Loading...</td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "32px" }}>No reviews found</td>
                </tr>
              ) : (
                reviews.map((review, index) => (
                  <tr key={review.id}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {review.productImage && (
                          <img
                            src={review.productImage}
                            alt={review.productName}
                            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                          />
                        )}
                        <span className="product-link">{review.productName}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>{review.customerName}</div>
                        {review.customerPhone && (
                          <small style={{ color: "#666" }}>{review.customerPhone}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="rating-badge" style={{ color: "#f59e0b" }}>
                        {renderStars(review.rating)}
                      </span>
                    </td>
                    <td style={{ maxWidth: 300 }}>
                      <div className="review-content">
                        {review.title && <strong>{review.title}</strong>}
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#555" }}>
                          {review.comment || "—"}
                        </p>
                        {review.isVerifiedPurchase && (
                          <span style={{ fontSize: "0.7rem", color: "#22c55e", fontWeight: 600 }}>
                            ✓ Verified Purchase
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{formatDate(review.createdAt)}</td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={review.isVisible}
                          onChange={() => toggleVisibility(review.id, review.isVisible)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-icon-delete"
                          title="Delete"
                          onClick={() => handleDelete(review.id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="#ef4444" strokeWidth="2"/>
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

        <div className="pagination">
          <span style={{ marginRight: "auto", fontSize: "0.85rem", color: "#666" }}>
            Showing {reviews.length} of {total} reviews
          </span>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            &lt;
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
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
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
