import { useState } from "react";
import "../styles/banner-setup.css";

interface Banner {
  id: string;
  image: string;
  bannerType: "Carousel" | "2 X 2 Banner" | "Custom Banner";
  position: string;
  resourceType: "Custom" | "Category";
  resource: string;
  published: boolean;
}

const mockBanners: Banner[] = [
  { id: "1", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=80&h=50&fit=crop", bannerType: "Carousel", position: "Shop The Look", resourceType: "Custom", resource: "https://arafine.co/", published: true },
  { id: "2", image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=80&h=50&fit=crop", bannerType: "Carousel", position: "Shop The Look", resourceType: "Custom", resource: "https://arafine.co/", published: true },
  { id: "3", image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=80&h=50&fit=crop", bannerType: "2 X 2 Banner", position: "-", resourceType: "Category", resource: "Chains", published: false },
  { id: "4", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=80&h=50&fit=crop", bannerType: "2 X 2 Banner", position: "-", resourceType: "Category", resource: "Ear Rings", published: false },
  { id: "5", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=80&h=50&fit=crop", bannerType: "2 X 2 Banner", position: "-", resourceType: "Category", resource: "Bracelets", published: true },
  { id: "6", image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=80&h=50&fit=crop", bannerType: "Custom Banner", position: "-", resourceType: "Category", resource: "Bangles", published: false },
  { id: "7", image: "https://images.unsplash.com/photo-1599459183200-59c3f4b13c2e?w=80&h=50&fit=crop", bannerType: "Custom Banner", position: "-", resourceType: "Category", resource: "Ear Rings", published: false },
];

export default function BannerSetup() {
  const [banners, setBanners] = useState(mockBanners);
  const [filterType, setFilterType] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const filteredBanners = filterType === "all" 
    ? banners 
    : banners.filter(b => b.bannerType.toLowerCase().includes(filterType.toLowerCase()));

  function togglePublished(id: string) {
    setBanners(prev =>
      prev.map(b => b.id === id ? { ...b, published: !b.published } : b)
    );
  }

  return (
    <div className="banner-setup-container">
      <div className="banner-card">
        <div className="banner-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Search banners..." />
            </div>
          </div>
          <div className="toolbar-right">
            <select 
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All</option>
              <option value="carousel">Carousel</option>
              <option value="2 x 2">2 X 2 Banner</option>
              <option value="custom">Custom Banner</option>
            </select>
            <button className="btn-filter">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
              </svg>
              Filter
            </button>
            <button className="btn-add" onClick={() => setShowModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Banner
            </button>
          </div>
        </div>

        <div className="banner-table-container">
          <table className="banner-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Image</th>
                <th>Banner Type</th>
                <th>Position</th>
                <th>Resource Type</th>
                <th>Resource</th>
                <th>Published</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanners.map((banner, index) => (
                <tr key={banner.id}>
                  <td>{index + 1}</td>
                  <td>
                    <img src={banner.image} alt="" className="banner-thumb" />
                  </td>
                  <td>{banner.bannerType}</td>
                  <td>
                    {banner.position !== "-" ? (
                      <span className="position-link">{banner.position}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <span className="resource-type-link">{banner.resourceType}</span>
                  </td>
                  <td>
                    {banner.resourceType === "Custom" ? (
                      <span className="resource-link">{banner.resource}</span>
                    ) : (
                      <span className="resource-category">{banner.resource}</span>
                    )}
                  </td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={banner.published}
                        onChange={() => togglePublished(banner.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-edit" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Banner</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Banner Type *</label>
                <select>
                  <option value="">Select banner type</option>
                  <option value="carousel">Carousel</option>
                  <option value="2x2">2 X 2 Banner</option>
                  <option value="custom">Custom Banner</option>
                </select>
              </div>
              <div className="form-group">
                <label>Resource Type *</label>
                <select>
                  <option value="">Select resource type</option>
                  <option value="custom">Custom</option>
                  <option value="category">Category</option>
                </select>
              </div>
              <div className="form-group">
                <label>Resource URL</label>
                <input type="text" placeholder="Enter resource URL" />
              </div>
              <div className="form-group">
                <label>Banner Image *</label>
                <div className="upload-area">
                  <div className="upload-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21,15 16,10 5,21" />
                    </svg>
                    <p>Click to upload or drag and drop</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-reset" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-submit">Add Banner</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
