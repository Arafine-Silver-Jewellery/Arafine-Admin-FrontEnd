import { useState, useEffect } from "react";
import { DataTable } from "../../components";
import "../../styles/ui-kit.css";

interface DealItem {
  id: string;
  title: string;
  productInfo: string;
  status: boolean;
}

const mockDeals: DealItem[] = [];

export default function DealOfTheDay() {
  const [deals, setDeals] = useState(mockDeals);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFormCard, setShowFormCard] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    product: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function toggleStatus(id: string) {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, status: !d.status } : d)));
  }

  function handleReset() {
    setFormData({ title: "", product: "" });
  }

  function handleSubmit() {
    // TODO: API call
    setShowFormCard(false);
    handleReset();
  }

  const filteredDeals = deals.filter((d) => d.title.toLowerCase().includes(debouncedSearch.toLowerCase()));

  // Paginated data
  const totalItems = filteredDeals.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedDeals = filteredDeals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "60px",
      render: (_: DealItem, index: number) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "title",
      header: "Title",
      render: (deal: DealItem) => <span style={{ fontWeight: 600 }}>{deal.title}</span>,
    },
    {
      key: "productInfo",
      header: "Product Info",
      render: (deal: DealItem) => <span className="ak-text-muted">{deal.productInfo}</span>,
    },
    {
      key: "status",
      header: "Status",
      width: "80px",
      render: (deal: DealItem) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={deal.status} onChange={() => toggleStatus(deal.id)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "100px",
      render: () => (
        <div className="ak-row-actions">
          <button type="button" className="ak-icon-btn ak-icon-btn--edit" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button type="button" className="ak-icon-btn ak-icon-btn--delete" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
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
            Deal Of The Day
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage daily spotlight deals</p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--primary" onClick={() => setShowFormCard(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Deal
          </button>
        </div>
      </div>

      {/* Add Deal Form Card */}
      {showFormCard && (
        <div className="ak-card" style={{ marginBottom: 24 }}>
          <div className="ak-card__header">
            <h3 className="ak-card__title">Add New Deal</h3>
            <button type="button" className="ak-icon-btn" onClick={() => setShowFormCard(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="ak-card__body">
            <div className="ak-form-grid ak-form-grid--2">
              <div className="ak-form-group">
                <label className="ak-label">Title (EN) *</label>
                <input
                  type="text"
                  className="ak-input"
                  placeholder="Ex: Daily Spotlight Deal"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Products *</label>
                <select className="ak-select" value={formData.product} onChange={(e) => setFormData({ ...formData, product: e.target.value })}>
                  <option value="">Select product</option>
                  <option value="1">Product 1</option>
                  <option value="2">Product 2</option>
                </select>
              </div>
            </div>
          </div>
          <div className="ak-card__footer">
            <button type="button" className="ak-btn ak-btn--ghost" onClick={handleReset}>
              Reset
            </button>
            <button type="button" className="ak-btn ak-btn--primary" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Page Body */}
      <div className="ak-page-body">
        {/* Toolbar */}
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
                  placeholder="Search by Title…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedDeals}
          loading={false}
          emptyIcon="bell"
          emptyTitle="No deals found"
          emptyDescription="Add your first deal of the day to highlight products."
          emptyAction={{ label: "Add Deal", onClick: () => setShowFormCard(true) }}
          keyExtractor={(deal) => deal.id}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
