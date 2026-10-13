import { useState, useEffect } from "react";
import { DataTable, StatusDropdown } from "../../components";
import "../../styles/ui-kit.css";

interface FeaturedDealItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  activeExpired: "Active" | "Expired";
  status: boolean;
}

const mockFeaturedDeals: FeaturedDealItem[] = [
  { id: "1", title: "Featured Deal", startDate: "17-Mar-26", endDate: "31-Jul-26", activeExpired: "Expired", status: false },
];

const statusFilterOptions = [
  { value: "", label: "All Status", color: "neutral" as const },
  { value: "Active", label: "Active", color: "success" as const },
  { value: "Expired", label: "Expired", color: "danger" as const },
];

export default function FeaturedDeal() {
  const [featuredDeals, setFeaturedDeals] = useState(mockFeaturedDeals);
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

  function toggleStatus(id: string) {
    setFeaturedDeals((prev) => prev.map((d) => (d.id === id ? { ...d, status: !d.status } : d)));
  }

  const filteredDeals = featuredDeals.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = !statusFilter || d.activeExpired === statusFilter;
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
      render: (_: FeaturedDealItem, index: number) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "title",
      header: "Title",
      render: (deal: FeaturedDealItem) => <span className="ak-text-link" style={{ fontWeight: 600 }}>{deal.title}</span>,
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (deal: FeaturedDealItem) => <span className="ak-text-muted">{deal.startDate}</span>,
    },
    {
      key: "endDate",
      header: "End Date",
      render: (deal: FeaturedDealItem) => <span className="ak-text-muted">{deal.endDate}</span>,
    },
    {
      key: "activeExpired",
      header: "Active / Expired",
      render: (deal: FeaturedDealItem) => (
        <span className={`ak-status ak-status--${deal.activeExpired === "Active" ? "success" : "danger"}`}>
          <span className="ak-status__dot" />
          {deal.activeExpired}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "80px",
      render: (deal: FeaturedDealItem) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={deal.status} onChange={() => toggleStatus(deal.id)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "150px",
      render: (_deal: FeaturedDealItem) => (
        <div className="ak-row-actions">
          <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm">
            + Add product
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
            Featured Deals
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage featured deal promotions</p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Featured Deal
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
                  placeholder="Search by title…"
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
          emptyIcon="box"
          emptyTitle="No featured deals"
          emptyDescription="Create your first featured deal to highlight products."
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
