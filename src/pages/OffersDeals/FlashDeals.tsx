import { useState, useEffect } from "react";
import { DataTable, StatusDropdown } from "../../components";
import "../../styles/ui-kit.css";

interface FlashDeal {
  id: string;
  title: string;
  duration: string;
  status: "Active" | "Expired";
  activeProducts: number;
  publish: boolean;
}

const mockFlashDeals: FlashDeal[] = [
  { id: "1", title: "FlashDeals", duration: "29-May-26 - 31-May-26", status: "Expired", activeProducts: 0, publish: true },
];

const statusFilterOptions = [
  { value: "", label: "All Status", color: "neutral" as const },
  { value: "Active", label: "Active", color: "success" as const },
  { value: "Expired", label: "Expired", color: "danger" as const },
];

export default function FlashDeals() {
  const [flashDeals, setFlashDeals] = useState(mockFlashDeals);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  function togglePublish(id: string) {
    setFlashDeals((prev) => prev.map((d) => (d.id === id ? { ...d, publish: !d.publish } : d)));
  }

  const filteredDeals = flashDeals.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = !statusFilter || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginated data
  const totalItems = filteredDeals.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedDeals = filteredDeals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "60px",
      render: (_: FlashDeal, index: number) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "title",
      header: "Title",
      render: (deal: FlashDeal) => <span className="ak-text-link" style={{ fontWeight: 600 }}>{deal.title}</span>,
    },
    {
      key: "duration",
      header: "Duration",
      render: (deal: FlashDeal) => <span className="ak-text-muted">{deal.duration}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (deal: FlashDeal) => (
        <span className={`ak-status ak-status--${deal.status === "Active" ? "success" : "danger"}`}>
          <span className="ak-status__dot" />
          {deal.status}
        </span>
      ),
    },
    {
      key: "activeProducts",
      header: "Active Products",
      width: "130px",
      align: "center" as const,
      render: (deal: FlashDeal) => (
        <span className={`ak-status ak-status--${deal.activeProducts > 0 ? "info" : "neutral"}`}>
          <span className="ak-status__dot" />
          {deal.activeProducts}
        </span>
      ),
    },
    {
      key: "publish",
      header: "Publish",
      width: "80px",
      render: (deal: FlashDeal) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={deal.publish} onChange={() => togglePublish(deal.id)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "150px",
      render: (_deal: FlashDeal) => (
        <div className="ak-row-actions">
          <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm">
            + Add Product
          </button>
          <button type="button" className="ak-icon-btn ak-icon-btn--edit" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
            Flash Deals
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage time-limited flash sale deals</p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Flash Deal
          </button>
        </div>
      </div>

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
          <div className="ak-toolbar__filters">
            <StatusDropdown
              options={statusFilterOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Status"
              size="sm"
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedDeals}
          loading={false}
          emptyIcon="bell"
          emptyTitle="No flash deals"
          emptyDescription="Create your first flash deal to offer limited-time discounts."
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
