import { useState } from "react";
import "../../styles/category-setup.css";

interface SubCategory {
  id: string;
  name: string;
  image: string;
  mainCategory: string;
  priority: number;
}

const mockSubCategories: SubCategory[] = [
  { id: "22", name: "Gold Plated", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=80&h=80&fit=crop", mainCategory: "Shop by Color", priority: 0 },
  { id: "23", name: "Rose Gold Plated", image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=80&h=80&fit=crop", mainCategory: "Shop by Color", priority: 9 },
  { id: "24", name: "Silver", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=80&h=80&fit=crop", mainCategory: "Shop by Color", priority: 8 },
  { id: "19", name: "Below 7999", image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=80&h=80&fit=crop", mainCategory: "By Pricing", priority: 10 },
  { id: "18", name: "Under 5999", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=80&h=80&fit=crop", mainCategory: "By Pricing", priority: 9 },
  { id: "17", name: "Under 3999", image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=80&h=80&fit=crop", mainCategory: "By Pricing", priority: 8 },
  { id: "15", name: "Daily Wear", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=80&h=80&fit=crop", mainCategory: "Anklets", priority: 5 },
  { id: "14", name: "Traditional", image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=80&h=80&fit=crop", mainCategory: "Bangles", priority: 4 },
];

export default function SubCategories() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubCategories = mockSubCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.mainCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="category-setup-container">
      <div className="category-card">
        <div className="category-card-header">
          <div className="category-actions">
            <div className="category-actions-left">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by sub category name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
            </div>
            <div className="category-actions-right">
              <button className="btn-export">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
              <button className="btn-add">
                + Add Sub Category
              </button>
            </div>
          </div>
        </div>

        <div className="category-table-container">
          <table className="category-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Sub Category Image</th>
                <th>Sub Category Name</th>
                <th>Main Category Name</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubCategories.map((category, index) => (
                <tr key={category.id}>
                  <td>{index + 1}</td>
                  <td>
                    <img src={category.image} alt="" className="sub-category-image" />
                  </td>
                  <td>
                    <div className="sub-category-name">
                      <span className="name">{category.name}</span>
                      <span className="id">ID #{category.id}</span>
                    </div>
                  </td>
                  <td>
                    <a href="#" className="main-category-link">{category.mainCategory}</a>
                  </td>
                  <td>{category.priority}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-icon-view" title="View">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#4f46e5" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="#4f46e5" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button className="btn-action btn-icon-edit" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#f59e0b" strokeWidth="2"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#f59e0b" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button className="btn-action btn-icon-delete" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <polyline points="3,6 5,6 21,6" stroke="#ef4444" strokeWidth="2"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#ef4444" strokeWidth="2"/>
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
