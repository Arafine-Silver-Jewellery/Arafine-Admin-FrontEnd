import { useState } from "react";
import "../../styles/category-setup.css";

interface Category {
  id: string;
  name: string;
  images: string[];
  priority: number;
  homeStatus: boolean;
}

const mockCategories: Category[] = [
  { id: "21", name: "Shop by Color", images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=60&h=60&fit=crop"], priority: 1, homeStatus: true },
  { id: "16", name: "By Pricing", images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=60&h=60&fit=crop"], priority: 0, homeStatus: true },
  { id: "13", name: "Anklets", images: ["https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=60&h=60&fit=crop"], priority: 10, homeStatus: true },
  { id: "8", name: "Bangles", images: ["https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=60&h=60&fit=crop"], priority: 9, homeStatus: true },
  { id: "5", name: "Rings", images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=60&h=60&fit=crop"], priority: 3, homeStatus: true },
  { id: "4", name: "Chains", images: ["https://images.unsplash.com/photo-1599459183200-59c3f4b13c2e?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=60&h=60&fit=crop"], priority: 2, homeStatus: true },
];

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState(mockCategories);

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function toggleHomeStatus(id: string) {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, homeStatus: !cat.homeStatus } : cat
      )
    );
  }

  return (
    <div className="category-setup-container">
      <div className="category-header">
        <h1>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Category Setup
        </h1>
      </div>

      <div className="category-card">
        <div className="category-card-header">
          <h2>Category List <span className="count">{filteredCategories.length}</span></h2>
          <div className="category-actions">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by category"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <button className="btn-export">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
            <button className="btn-add">
              + Add Category
            </button>
          </div>
        </div>

        <div className="category-table-container">
          <table className="category-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Category Name</th>
                <th>Priority</th>
                <th>Home Category Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category, index) => (
                <tr key={category.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="category-name-cell">
                      <div className="category-images">
                        {category.images.slice(0, 3).map((img, i) => (
                          <img key={i} src={img} alt="" className="category-thumb" />
                        ))}
                      </div>
                      <div className="category-info">
                        <span className="name">{category.name}</span>
                        <span className="id">ID #{category.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>{category.priority}</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={category.homeStatus}
                        onChange={() => toggleHomeStatus(category.id)}
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
    </div>
  );
}
