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
            <button className="btn-filter">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
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
            <button className="btn-add">
              + Add Sub Category
            </button>
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
