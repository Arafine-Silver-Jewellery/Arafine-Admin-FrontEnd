import { useState } from "react";
import "../../styles/customers.css";

interface Review {
  sl: number;
  reviewId: string;
  product: string;
  customer: string;
  rating: number;
  review: string;
  reviewImage: string;
  reply: string;
  date: string;
  isActive: boolean;
}

const mockReviews: Review[] = [
  {
    sl: 1,
    reviewId: "10000501",
    product: "Product not found",
    customer: "Janaki Bharath",
    rating: 5,
    review: "Very Nice Product",
    reviewImage: "",
    reply: "-",
    date: "28 May 2026",
    isActive: true,
  },
  {
    sl: 2,
    reviewId: "10000502",
    product: "Premium Basmati Rice 5kg",
    customer: "Priya Sharma",
    rating: 4,
    review: "Good quality rice, will buy again",
    reviewImage: "",
    reply: "Thank you!",
    date: "25 May 2026",
    isActive: true,
  },
  {
    sl: 3,
    reviewId: "10000503",
    product: "Organic Coconut Oil 1L",
    customer: "Amit Kumar",
    rating: 5,
    review: "Best coconut oil I've used",
    reviewImage: "",
    reply: "-",
    date: "20 May 2026",
    isActive: true,
  },
];

export default function CustomerReviews() {
  const [searchQuery, setSearchQuery] = useState("");
  const [reviews, setReviews] = useState(mockReviews);

  const toggleStatus = (sl: number) => {
    setReviews(reviews.map(r =>
      r.sl === sl ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const filteredReviews = reviews.filter(r =>
    r.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reviewId.includes(searchQuery)
  );

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
                placeholder="Search by Id, Product"
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
                <th>Review ID</th>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Reply</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.sl}>
                  <td>{review.sl}</td>
                  <td>{review.reviewId}</td>
                  <td>
                    <span className="product-link">{review.product}</span>
                  </td>
                  <td>{review.customer}</td>
                  <td>
                    <span className="rating-badge">
                      {review.rating} ⭐
                    </span>
                  </td>
                  <td>
                    <div className="review-content">
                      <p>{review.review}</p>
                      {review.reviewImage && (
                        <div className="review-image">
                          <img src={review.reviewImage} alt="Review" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{review.reply}</td>
                  <td>{review.date}</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={review.isActive}
                        onChange={() => toggleStatus(review.sl)}
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
                      <button className="btn-action btn-reply" title="Reply">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
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
          <button>&gt;</button>
        </div>
      </div>
    </div>
  );
}
