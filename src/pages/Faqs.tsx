import { useCallback, useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { faqsApi } from "../api/faqs";
import type { Faq, FaqCategory } from "../types";
import { DataTable, StatusDropdown } from "../components";
import "../styles/ui-kit.css";

const categoryOptions = [
  { value: "", label: "All Categories", color: "neutral" as const },
  { value: "orders", label: "Orders", color: "info" as const },
  { value: "products", label: "Products", color: "brand" as const },
  { value: "payments", label: "Payments", color: "success" as const },
  { value: "delivery", label: "Delivery", color: "info" as const },
  { value: "returns", label: "Returns", color: "warning" as const },
  { value: "account", label: "Account", color: "neutral" as const },
  { value: "general", label: "General", color: "neutral" as const },
];

const statusOptions = [
  { value: "", label: "All Statuses", color: "neutral" as const },
  { value: "published", label: "Published", color: "success" as const },
  { value: "draft", label: "Draft", color: "warning" as const },
];

const categoryLabels: Record<FaqCategory, string> = {
  orders: "Orders",
  products: "Products",
  payments: "Payments",
  delivery: "Delivery",
  returns: "Returns",
  account: "Account",
  general: "General",
};

interface FormState {
  question: string;
  answer: string;
  category: FaqCategory;
  sortOrder: string;
  isPublished: boolean;
}

const emptyForm: FormState = {
  question: "",
  answer: "",
  category: "general",
  sortOrder: "0",
  isPublished: true,
};

export default function Faqs() {
  const toast = useToast();

  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [stats, setStats] = useState<{ total: number; published: number; drafts: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await faqsApi.getFaqs({
        search: debouncedSearch || undefined,
        category: filterCategory || undefined,
        status: (filterStatus || undefined) as "published" | "draft" | undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      setFaqs(response.data ?? []);
      setStats(response.stats ?? null);
      setTotalItems(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 0);
    }
    catch (err) {
      setFaqs([]);
      setLoadError(err instanceof Error ? err.message : "Failed to load FAQs");
    }
    finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterCategory, filterStatus, currentPage, itemsPerPage]);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  useEffect(() => {
    if (showModal) return;
    setForm(emptyForm);
    setEditingFaq(null);
    setFormError("");
    setSubmitting(false);
  }, [showModal]);

  function openAddModal() {
    setEditingFaq(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(faq: Faq) {
    setEditingFaq(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sortOrder: String(faq.sortOrder),
      isPublished: faq.isPublished,
    });
    setFormError("");
    setShowModal(true);
  }

  function validate(): string {
    if (!form.question.trim()) return "Please enter the question.";
    if (!form.answer.trim()) return "Please enter the answer.";
    return "";
  }

  async function handleSubmit() {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        category: form.category,
        sortOrder: Number(form.sortOrder) || 0,
        isPublished: form.isPublished,
      };
      if (editingFaq) {
        await faqsApi.updateFaq(editingFaq.id, payload);
        toast.success("FAQ updated");
      } else {
        await faqsApi.createFaq(payload);
        toast.success("FAQ created");
      }
      setShowModal(false);
      await loadFaqs();
    }
    catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save FAQ");
    }
    finally {
      setSubmitting(false);
    }
  }

  async function togglePublished(faq: Faq) {
    const next = !faq.isPublished;
    setFaqs((prev) => prev.map((f) => (f.id === faq.id ? { ...f, isPublished: next } : f)));
    try {
      await faqsApi.updateFaq(faq.id, { isPublished: next });
      toast.success(next ? "FAQ published" : "FAQ unpublished");
    }
    catch (err) {
      setFaqs((prev) => prev.map((f) => (f.id === faq.id ? { ...f, isPublished: !next } : f)));
      toast.error(err instanceof Error ? err.message : "Failed to update FAQ");
    }
  }

  async function confirmDeleteFaq() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await faqsApi.deleteFaq(deleteTarget.id);
      toast.success("FAQ deleted");
      setDeleteTarget(null);
      await loadFaqs();
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete FAQ");
    }
    finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "question",
      header: "Question",
      render: (faq: Faq) => (
        <div>
          <div style={{ fontWeight: 600 }}>{faq.question}</div>
          <div className="ak-text-muted ak-text-sm" style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>{faq.answer}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      width: "130px",
      render: (faq: Faq) => (
        <span className="ak-text-sm">{categoryLabels[faq.category] ?? faq.category}</span>
      ),
    },
    {
      key: "sortOrder",
      header: "Order",
      width: "90px",
      align: "right" as const,
      render: (faq: Faq) => faq.sortOrder,
    },
    {
      key: "published",
      header: "Published",
      width: "100px",
      render: (faq: Faq) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={faq.isPublished} onChange={() => togglePublished(faq)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "100px",
      render: (faq: Faq) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--edit"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(faq);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--delete"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(faq);
            }}
          >
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
      <div className="ak-page-header">
        <div className="ak-page-header__left">
          <h1 className="ak-page-header__title">
            FAQs
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">
            {stats
              ? `${stats.published} published · ${stats.drafts} drafts`
              : "Answers shown to customers on the help page"}
          </p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--primary" onClick={openAddModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add FAQ
          </button>
        </div>
      </div>

      <div className="ak-page-body">
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
                  placeholder="Search questions and answers…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="ak-toolbar__filters">
            <StatusDropdown options={categoryOptions} value={filterCategory} onChange={setFilterCategory} placeholder="All Categories" size="sm" />
            <StatusDropdown options={statusOptions} value={filterStatus} onChange={setFilterStatus} placeholder="All Statuses" size="sm" />
          </div>
        </div>

        {loadError ? (
          <div className="ak-card" style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "var(--color-danger)", marginBottom: 16 }}>Could not load FAQs: {loadError}</p>
            <button type="button" className="ak-btn ak-btn--primary" onClick={loadFaqs}>Retry</button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={faqs}
            loading={loading}
            loadingText="Loading FAQs…"
            emptyIcon="file"
            emptyTitle="No FAQs yet"
            emptyDescription="Add the questions customers ask most often."
            emptyAction={{ label: "Add FAQ", onClick: openAddModal }}
            keyExtractor={(faq: Faq) => faq.id}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {showModal && (
        <div className="ak-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ak-modal" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">{editingFaq ? "Edit FAQ" : "Add New FAQ"}</h2>
              <button type="button" className="ak-modal__close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <div className="ak-form-group">
                <label className="ak-label">Question *</label>
                <input
                  type="text"
                  className="ak-input"
                  placeholder="e.g. How do I track my order?"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                />
              </div>

              <div className="ak-form-group">
                <label className="ak-label">Answer *</label>
                <textarea
                  className="ak-input"
                  rows={5}
                  placeholder="Answer shown to the customer"
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ak-form-group">
                  <label className="ak-label">Category</label>
                  <select
                    className="ak-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as FaqCategory })}
                  >
                    {(Object.keys(categoryLabels) as FaqCategory[]).map(category => (
                      <option key={category} value={category}>{categoryLabels[category]}</option>
                    ))}
                  </select>
                </div>
                <div className="ak-form-group">
                  <label className="ak-label">Display order</label>
                  <input
                    type="number"
                    className="ak-input"
                    min="0"
                    step="1"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  />
                </div>
              </div>

              <div className="ak-form-group" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <label className="ak-label" style={{ marginBottom: 0 }}>Published</label>
                  <span className="ak-text-muted ak-text-sm">Only published FAQs are visible to customers</span>
                </div>
                <label className="ak-toggle">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                  <span className="ak-toggle__slider" />
                </label>
              </div>

              {formError && <div className="ak-alert ak-alert--danger" style={{ marginTop: 16 }}>{formError}</div>}
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
              <button type="button" className="ak-btn ak-btn--primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving…" : editingFaq ? "Save Changes" : "Create FAQ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="ak-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Delete FAQ?</h2>
              <button type="button" className="ak-modal__close" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p>
                This will remove <strong>{deleteTarget.question}</strong> from the help page. This action cannot be undone.
              </p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={confirmDeleteFaq} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
