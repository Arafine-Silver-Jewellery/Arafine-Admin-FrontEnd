import { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { subscriptionsApi } from "../api/subscriptions";
import type {
  BillingCycle,
  CustomerSubscription,
  PlanTier,
  SubscriptionPlan,
  SubscriptionStatus,
} from "../types";
import { DataTable, StatusDropdown } from "../components";
import { formatDate, formatPrice } from "../utils/format";
import "../styles/ui-kit.css";

type Tab = "plans" | "subscribers";

const tierOptions = [
  { value: "", label: "All Tiers", color: "neutral" as const },
  { value: "basic", label: "Basic", color: "info" as const },
  { value: "premium", label: "Premium", color: "brand" as const },
  { value: "vip", label: "VIP", color: "success" as const },
];

const planStatusOptions = [
  { value: "", label: "All Statuses", color: "neutral" as const },
  { value: "active", label: "Active", color: "success" as const },
  { value: "inactive", label: "Inactive", color: "warning" as const },
];

const subStatusOptions = [
  { value: "", label: "All Statuses", color: "neutral" as const },
  { value: "active", label: "Active", color: "success" as const },
  { value: "grace", label: "Grace", color: "warning" as const },
  { value: "cancelled", label: "Cancelled", color: "neutral" as const },
  { value: "expired", label: "Expired", color: "neutral" as const },
];

const tierBadge: Record<PlanTier, string> = {
  basic: "info",
  premium: "brand",
  vip: "success",
};

const statusBadge: Record<SubscriptionStatus, string> = {
  active: "success",
  grace: "warning",
  cancelled: "neutral",
  expired: "neutral",
};

const statusLabel: Record<SubscriptionStatus, string> = {
  active: "Active",
  grace: "Grace",
  cancelled: "Cancelled",
  expired: "Expired",
};

interface FormState {
  name: string;
  description: string;
  tier: PlanTier;
  billingCycle: BillingCycle;
  price: string;
  discountPercent: string;
  pointsMultiplier: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  tier: "basic",
  billingCycle: "monthly",
  price: "",
  discountPercent: "0",
  pointsMultiplier: "1",
  isActive: true,
};

export default function Subscriptions({ tab: initialTab = "plans" }: { tab?: Tab }) {
  const toast = useToast();

  const [tab, setTab] = useState<Tab>(initialTab);

  // Plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [planStats, setPlanStats] = useState<{ total: number; active: number; inactive: number } | null>(null);
  const [planSearch, setPlanSearch] = useState("");
  const [debouncedPlanSearch, setDebouncedPlanSearch] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [filterPlanStatus, setFilterPlanStatus] = useState("");
  const [planPage, setPlanPage] = useState(1);
  const [planTotal, setPlanTotal] = useState(0);
  const [planTotalPages, setPlanTotalPages] = useState(0);

  // Subscribers
  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>([]);
  const [subStats, setSubStats] = useState<{ total: number; byStatus: Record<string, number> } | null>(null);
  const [subSearch, setSubSearch] = useState("");
  const [debouncedSubSearch, setDebouncedSubSearch] = useState("");
  const [filterSubStatus, setFilterSubStatus] = useState("");
  const [subPage, setSubPage] = useState(1);
  const [subTotal, setSubTotal] = useState(0);
  const [subTotalPages, setSubTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Plan form
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeletePlan, setConfirmDeletePlan] = useState<SubscriptionPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Subscriber ops
  const [cancelTarget, setCancelTarget] = useState<CustomerSubscription | null>(null);
  const [busySubId, setBusySubId] = useState("");
  const [opError, setOpError] = useState("");

  useEffect(() => {
    const key = tab === "plans" ? planSearch : subSearch;
    const setter = tab === "plans" ? setDebouncedPlanSearch : setDebouncedSubSearch;
    const pageSetter = tab === "plans" ? setPlanPage : setSubPage;
    const t = setTimeout(() => {
      setter(key);
      pageSetter(1);
    }, 350);
    return () => clearTimeout(t);
  }, [planSearch, subSearch, tab]);

  useEffect(() => {
    if (tab === "plans") {
      loadPlans();
    } else {
      loadSubscriptions();
    }
  }, [tab, debouncedPlanSearch, filterTier, filterPlanStatus, planPage, debouncedSubSearch, filterSubStatus, subPage]);

  async function loadPlans() {
    setLoading(true);
    setLoadError("");
    try {
      const res = await subscriptionsApi.getPlans({
        search: debouncedPlanSearch || undefined,
        tier: filterTier || undefined,
        status: filterPlanStatus || undefined,
        page: planPage,
        limit: 20,
      });
      setPlans(res.data ?? []);
      setPlanStats(res.stats ?? null);
      setPlanTotal(res.pagination?.total || 0);
      setPlanTotalPages(res.pagination?.totalPages || 0);
    } catch (err) {
      setPlans([]);
      setLoadError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }

  async function loadSubscriptions() {
    setLoading(true);
    setLoadError("");
    try {
      const res = await subscriptionsApi.getSubscriptions({
        search: debouncedSubSearch || undefined,
        status: filterSubStatus || undefined,
        page: subPage,
        limit: 20,
      });
      setSubscriptions(res.data ?? []);
      setSubStats(res.stats ?? null);
      setSubTotal(res.pagination?.total || 0);
      setSubTotalPages(res.pagination?.totalPages || 0);
    } catch (err) {
      setSubscriptions([]);
      setLoadError(err instanceof Error ? err.message : "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (showModal) return;
    setForm(emptyForm);
    setEditingPlan(null);
    setFormError("");
    setSubmitting(false);
  }, [showModal]);

  function openAddModal() {
    setEditingPlan(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(plan: SubscriptionPlan) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      tier: plan.tier,
      billingCycle: plan.billingCycle,
      price: String(plan.price),
      discountPercent: String(plan.discountPercent),
      pointsMultiplier: String(plan.pointsMultiplier),
      isActive: plan.isActive,
    });
    setFormError("");
    setShowModal(true);
  }

  function validate(): string {
    if (!form.name.trim()) return "Please give the plan a name.";
    if (!form.price || Number(form.price) < 1) return "Price must be at least ₹1.";
    if (Number(form.pointsMultiplier) < 1) return "Points multiplier must be at least 1.";
    if (Number(form.discountPercent) === 0 && Number(form.pointsMultiplier) === 1) {
      return "Give the plan at least one benefit (discount or points multiplier).";
    }
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
        name: form.name.trim(),
        description: form.description.trim() || null,
        tier: form.tier,
        billingCycle: form.billingCycle,
        price: Number(form.price),
        discountPercent: Number(form.discountPercent) || 0,
        pointsMultiplier: Number(form.pointsMultiplier) || 1,
        isActive: form.isActive,
      };

      if (editingPlan) {
        await subscriptionsApi.updatePlan(editingPlan.id, payload);
        toast.success("Plan updated");
      } else {
        await subscriptionsApi.createPlan(payload);
        toast.success("Plan created");
      }
      setShowModal(false);
      await loadPlans();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save plan");
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePlanActive(plan: SubscriptionPlan) {
    const next = !plan.isActive;
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, isActive: next } : p)));
    try {
      await subscriptionsApi.updatePlan(plan.id, { isActive: next });
      toast.success(next ? "Plan activated" : "Plan deactivated");
    } catch (err) {
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, isActive: !next } : p)));
      toast.error(err instanceof Error ? err.message : "Failed to update plan");
    }
  }

  async function confirmDelete() {
    if (!confirmDeletePlan) return;
    setDeleting(true);
    try {
      await subscriptionsApi.deletePlan(confirmDeletePlan.id);
      toast.success("Plan deleted");
      setConfirmDeletePlan(null);
      await loadPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete plan");
    } finally {
      setDeleting(false);
    }
  }

  async function runSubOp(id: string, op: () => Promise<unknown>, successMessage: string) {
    setBusySubId(id);
    setOpError("");
    try {
      await op();
      toast.success(successMessage);
      await loadSubscriptions();
      return true;
    } catch (err) {
      setOpError(err instanceof Error ? err.message : "Operation failed");
      toast.error(err instanceof Error ? err.message : "Operation failed");
      return false;
    } finally {
      setBusySubId("");
    }
  }

  const planColumns = [
    {
      key: "name",
      header: "Plan",
      render: (plan: SubscriptionPlan) => (
        <div>
          <div style={{ fontWeight: 600 }}>{plan.name}</div>
          {plan.description && <div className="ak-text-muted ak-text-sm">{plan.description}</div>}
        </div>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      width: "110px",
      render: (plan: SubscriptionPlan) => (
        <span className={`ak-status ak-status--${tierBadge[plan.tier]}`}>
          <span className="ak-status__dot" />
          {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      width: "140px",
      render: (plan: SubscriptionPlan) => (
        <span>{formatPrice(plan.price)}<span className="ak-text-muted"> / {plan.billingCycle === "monthly" ? "month" : "year"}</span></span>
      ),
    },
    {
      key: "benefits",
      header: "Benefits",
      render: (plan: SubscriptionPlan) => (
        <span className="ak-text-sm">
          {plan.discountPercent > 0 && plan.pointsMultiplier > 1
            ? `${plan.discountPercent}% off every order · ${plan.pointsMultiplier}× points`
            : plan.discountPercent > 0
              ? `${plan.discountPercent}% off every order`
              : `${plan.pointsMultiplier}× points`}
        </span>
      ),
    },
    {
      key: "active",
      header: "Active",
      width: "90px",
      render: (plan: SubscriptionPlan) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={plan.isActive} onChange={() => togglePlanActive(plan)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "100px",
      render: (plan: SubscriptionPlan) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--edit"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(plan);
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
              setConfirmDeletePlan(plan);
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

  const subColumns = [
    {
      key: "customer",
      header: "Customer",
      render: (sub: CustomerSubscription) => (
        <div>
          <div style={{ fontWeight: 600 }}>{sub.user?.name ?? "Unknown"}</div>
          {sub.user?.mobileNumber && <div className="ak-text-muted ak-text-sm">{sub.user.mobileNumber}</div>}
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      width: "170px",
      render: (sub: CustomerSubscription) => (
        <div className="ak-text-sm">
          <div>{sub.plan?.name ?? "—"}</div>
          <div className="ak-text-muted">{formatPrice(sub.pricePaid)}{sub.plan ? (sub.plan.billingCycle === "monthly" ? " / mo" : " / yr") : ""}</div>
        </div>
      ),
    },
    {
      key: "period",
      header: "Period",
      width: "220px",
      render: (sub: CustomerSubscription) => (
        <span className="ak-text-sm">{formatDate(sub.startsAt)} → {formatDate(sub.currentPeriodEnd)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "140px",
      render: (sub: CustomerSubscription) => (
        <div>
          <span className={`ak-status ak-status--${statusBadge[sub.status]}`}>
            <span className="ak-status__dot" />
            {statusLabel[sub.status]}
          </span>
          {sub.cancelAtPeriodEnd && sub.status !== "cancelled" && (
            <div className="ak-text-muted ak-text-sm" style={{ marginTop: 2 }}>stops at period end</div>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "130px",
      render: (sub: CustomerSubscription) => (
        <div className="ak-row-actions">
          {sub.status === "cancelled" || sub.cancelAtPeriodEnd ? (
            <button
              type="button"
              className="ak-btn ak-btn--ghost ak-btn--sm"
              disabled={busySubId === sub.id}
              onClick={() => {
                setOpError("");
                void runSubOp(sub.id, () => subscriptionsApi.resumeSubscription(sub.id), "Subscription resumed");
              }}
              title="Restore the subscription"
            >
              {busySubId === sub.id ? "…" : "Resume"}
            </button>
          ) : sub.status === "active" || sub.status === "grace" ? (
            <button
              type="button"
              className="ak-btn ak-btn--ghost ak-btn--sm"
              disabled={busySubId === sub.id}
              onClick={() => setCancelTarget(sub)}
            >
              Cancel
            </button>
          ) : (
            <span className="ak-text-muted ak-text-sm">—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="ak-page">
      <div className="ak-page-header">
        <div className="ak-page-header__left">
          <h1 className="ak-page-header__title">
            Subscriptions
            {tab === "plans" ? (
              planTotal > 0 && <span className="ak-page-header__count">{planTotal}</span>
            ) : (
              subTotal > 0 && <span className="ak-page-header__count">{subTotal}</span>
            )}
          </h1>
          <p className="ak-page-header__subtitle">
            {tab === "plans"
              ? planStats
                ? `${planStats.active} active · ${planStats.inactive} inactive plans`
                : "Benefit tiers customers can subscribe to"
              : subStats
                ? `${subStats.byStatus?.active ?? 0} active · ${subStats.byStatus?.grace ?? 0} in grace · ${subStats.byStatus?.cancelled ?? 0} cancelled`
                : "Customer memberships"}
          </p>
        </div>
        <div className="ak-page-header__actions">
          <div style={{ display: "flex", gap: 8, marginRight: 12 }}>
            <button
              type="button"
              className={tab === "plans" ? "ak-btn ak-btn--primary" : "ak-btn ak-btn--ghost"}
              onClick={() => setTab("plans")}
            >
              Plans
            </button>
            <button
              type="button"
              className={tab === "subscribers" ? "ak-btn ak-btn--primary" : "ak-btn ak-btn--ghost"}
              onClick={() => setTab("subscribers")}
            >
              Subscribers
            </button>
          </div>
          {tab === "plans" && (
            <button type="button" className="ak-btn ak-btn--primary" onClick={openAddModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Plan
            </button>
          )}
        </div>
      </div>

      <div className="ak-page-body">
        {/* Shared toolbar per tab, aligned with other pages */}
        {tab === "plans" ? (
          <>
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
                      placeholder="Search plans by name…"
                      value={planSearch}
                      onChange={(e) => setPlanSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="ak-toolbar__filters">
                <StatusDropdown options={tierOptions} value={filterTier} onChange={setFilterTier} placeholder="All Tiers" size="sm" />
                <StatusDropdown options={planStatusOptions} value={filterPlanStatus} onChange={setFilterPlanStatus} placeholder="All Statuses" size="sm" />
              </div>
            </div>

            {loadError ? (
              <div className="ak-card" style={{ padding: "48px", textAlign: "center" }}>
                <p style={{ color: "var(--color-danger)", marginBottom: 16 }}>Could not load plans: {loadError}</p>
                <button type="button" className="ak-btn ak-btn--primary" onClick={loadPlans}>Retry</button>
              </div>
            ) : (
              <DataTable
                columns={planColumns}
                data={plans}
                loading={loading}
                loadingText="Loading plans…"
                emptyIcon="box"
                emptyTitle="No plans yet"
                emptyDescription="Create a subscription tier like Basic, Premium or VIP."
                emptyAction={{ label: "Add Plan", onClick: openAddModal }}
                keyExtractor={(plan) => plan.id}
                currentPage={planPage}
                totalPages={planTotalPages}
                totalItems={planTotal}
                itemsPerPage={20}
                onPageChange={setPlanPage}
              />
            )}
          </>
        ) : (
          <>
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
                      placeholder="Search by name, mobile or plan…"
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="ak-toolbar__filters">
                <StatusDropdown options={subStatusOptions} value={filterSubStatus} onChange={setFilterSubStatus} placeholder="All Statuses" size="sm" />
              </div>
            </div>

            {loadError ? (
              <div className="ak-card" style={{ padding: "48px", textAlign: "center" }}>
                <p style={{ color: "var(--color-danger)", marginBottom: 16 }}>Could not load subscriptions: {loadError}</p>
                <button type="button" className="ak-btn ak-btn--primary" onClick={loadSubscriptions}>Retry</button>
              </div>
            ) : (
              <DataTable
                columns={subColumns}
                data={subscriptions}
                loading={loading}
                loadingText="Loading subscriptions…"
                emptyIcon="users"
                emptyTitle="No subscriptions yet"
                emptyDescription="Customers appear here once they subscribe to a plan."
                keyExtractor={(sub) => sub.id}
                currentPage={subPage}
                totalPages={subTotalPages}
                totalItems={subTotal}
                itemsPerPage={20}
                onPageChange={setSubPage}
              />
            )}
          </>
        )}
      </div>

      {/* Plan form modal */}
      {showModal && (
        <div className="ak-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ak-modal" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">{editingPlan ? "Edit Plan" : "Add New Plan"}</h2>
              <button type="button" className="ak-modal__close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <div className="ak-form-group">
                <label className="ak-label">Plan Name *</label>
                <input
                  type="text"
                  className="ak-input"
                  placeholder="e.g. Gold Saver"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="ak-form-group">
                <label className="ak-label">Description</label>
                <textarea
                  className="ak-input"
                  rows={2}
                  placeholder="Shown to customers on the subscription page (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ak-form-group">
                  <label className="ak-label">Tier</label>
                  <select
                    className="ak-select"
                    value={form.tier}
                    onChange={(e) => setForm({ ...form, tier: e.target.value as PlanTier })}
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <div className="ak-form-group">
                  <label className="ak-label">Billing Cycle *</label>
                  <select
                    className="ak-select"
                    value={form.billingCycle}
                    onChange={(e) => setForm({ ...form, billingCycle: e.target.value as BillingCycle })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="ak-form-group">
                <label className="ak-label">Price per cycle (₹) *</label>
                <input
                  type="number"
                  className="ak-input"
                  min="1"
                  step="1"
                  placeholder="e.g. 499"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ak-form-group">
                  <label className="ak-label">Discount on every order (%)</label>
                  <input
                    type="number"
                    className="ak-input"
                    min="0"
                    max="100"
                    step="1"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                  />
                </div>
                <div className="ak-form-group">
                  <label className="ak-label">Loyalty points multiplier</label>
                  <input
                    type="number"
                    className="ak-input"
                    min="1"
                    max="5"
                    step="0.1"
                    value={form.pointsMultiplier}
                    onChange={(e) => setForm({ ...form, pointsMultiplier: e.target.value })}
                  />
                </div>
              </div>

              <div className="ak-form-group" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <label className="ak-label" style={{ marginBottom: 0 }}>Active</label>
                  <span className="ak-text-muted ak-text-sm">Only active plans can be subscribed to</span>
                </div>
                <label className="ak-toggle">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  <span className="ak-toggle__slider" />
                </label>
              </div>

              {formError && <div className="ak-alert ak-alert--danger" style={{ marginTop: 16 }}>{formError}</div>}
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
              <button type="button" className="ak-btn ak-btn--primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving…" : editingPlan ? "Save Changes" : "Create Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan delete confirm */}
      {confirmDeletePlan && (
        <div className="ak-modal-overlay" onClick={() => !deleting && setConfirmDeletePlan(null)}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Delete Plan?</h2>
              <button type="button" className="ak-modal__close" onClick={() => setConfirmDeletePlan(null)} disabled={deleting}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p>
                This will permanently remove <strong>{confirmDeletePlan.name}</strong>. Existing subscribers keep their
                membership, but no new subscriptions can start on it. This action cannot be undone.
              </p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setConfirmDeletePlan(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscriber cancel choice */}
      {cancelTarget && (
        <div className="ak-modal-overlay" onClick={() => busySubId === "" && setCancelTarget(null)}>
          <div className="ak-modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Cancel Subscription?</h2>
              <button type="button" className="ak-modal__close" onClick={() => setCancelTarget(null)} disabled={busySubId !== ""}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p style={{ marginBottom: 16 }}>
                Cancel <strong>{cancelTarget.user?.name}'s</strong> plan ({cancelTarget.plan?.name ?? "—"}). Perks end for the customer either way.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  className="ak-btn ak-btn--primary"
                  disabled={busySubId !== ""}
                  onClick={async () => {
                    const ok = await runSubOp(cancelTarget.id, () => subscriptionsApi.cancelSubscription(cancelTarget.id, false), "Stops at period end");
                    if (ok) setCancelTarget(null);
                  }}
                >
                  Stop at period end
                </button>
                <button
                  type="button"
                  className="ak-btn ak-btn--danger"
                  disabled={busySubId !== ""}
                  onClick={async () => {
                    const ok = await runSubOp(cancelTarget.id, () => subscriptionsApi.cancelSubscription(cancelTarget.id, true), "Cancelled now");
                    if (ok) setCancelTarget(null);
                  }}
                >
                  Cancel right now
                </button>
              </div>
              {opError && <div className="ak-alert ak-alert--danger" style={{ marginTop: 12 }}>{opError}</div>}
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setCancelTarget(null)} disabled={busySubId !== ""}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
