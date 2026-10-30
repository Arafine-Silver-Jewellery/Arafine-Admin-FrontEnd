import { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { campaignsApi } from "../api/campaigns";
import { offersApi } from "../api/offers";
import { api } from "../api/client";
import type { Campaign, CampaignChannel, CampaignAudience, CampaignStats, CampaignStatus } from "../types";
import { DataTable, StatusDropdown } from "../components";
import "../styles/ui-kit.css";

const channelOptions = [
  { value: "", label: "All Channels", color: "neutral" as const },
  { value: "email", label: "Email", color: "info" as const },
  { value: "push", label: "Push", color: "brand" as const },
  { value: "in_app", label: "In-App", color: "success" as const },
];

const statusFilterOptions = [
  { value: "", label: "All Statuses", color: "neutral" as const },
  { value: "draft", label: "Draft", color: "warning" as const },
  { value: "scheduled", label: "Scheduled", color: "info" as const },
  { value: "running", label: "Running", color: "success" as const },
  { value: "completed", label: "Completed", color: "neutral" as const },
];

const channelLabels: Record<CampaignChannel, string> = {
  email: "Email",
  push: "Push",
  in_app: "In-App",
};

const audienceLabels: Record<CampaignAudience, string> = {
  all: "All customers",
  new: "New customers",
  returning: "Returning customers",
  vip: "VIP customers",
};

const statusBadge: Record<CampaignStatus, string> = {
  draft: "warning",
  scheduled: "info",
  running: "success",
  completed: "neutral",
};

interface BannerOption { id: string; name: string; }
interface OfferOption { id: string; name: string; }

interface FormState {
  name: string;
  description: string;
  channel: CampaignChannel;
  audience: CampaignAudience;
  subject: string;
  body: string;
  bannerId: string;
  offerId: string;
  startsAt: string;
  endsAt: string;
  isPublished: boolean;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  channel: "email",
  audience: "all",
  subject: "",
  body: "",
  bannerId: "",
  offerId: "",
  startsAt: "",
  endsAt: "",
  isPublished: false,
};

function formatDateTime(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toLocalInput(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function Campaigns() {
  const toast = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [view, setView] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [calendarItems, setCalendarItems] = useState<Campaign[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [banners, setBanners] = useState<BannerOption[]>([]);
  const [offerOptions, setOfferOptions] = useState<OfferOption[]>([]);

  const [confirmDelete, setConfirmDelete] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    loadCampaigns();
  }, [debouncedSearch, filterChannel, filterStatus, currentPage]);

  useEffect(() => {
    if (view !== "calendar") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await campaignsApi.getCalendar();
        if (!cancelled) setCalendarItems(res.data ?? []);
      } catch { /* calendar silently falls back to empty */ }
    })();
    return () => { cancelled = true; };
  }, [view, stats]);

  // Link dropdowns load once with the form
  useEffect(() => {
    if (!showModal) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getBanners({ limit: 100, published: true });
        if (!cancelled) {
          setBanners((res.data ?? [])
            .map((b: { id?: unknown; resource?: unknown }) => ({ id: String(b.id ?? ""), name: String(b.resource ?? "") }))
            .filter((b: BannerOption) => b.id && b.name));
        }
      } catch { /* leave empty */ }
      try {
        const res = await offersApi.getOffers({ limit: 100 });
        if (!cancelled) {
          setOfferOptions((res.data ?? [])
            .map((o: { id: string; name: string }) => ({ id: o.id, name: o.name }))
            .filter((o: OfferOption) => o.id && o.name));
        }
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, [showModal]);

  async function loadCampaigns() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await campaignsApi.getCampaigns({
        search: debouncedSearch || undefined,
        channel: filterChannel || undefined,
        status: filterStatus || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      const list = response?.data ?? [];
      setCampaigns(Array.isArray(list) ? list : []);
      setStats(response?.stats ?? null);
      setTotalItems(response?.pagination?.total || 0);
      setTotalPages(response?.pagination?.totalPages || 0);
    } catch (err) {
      setCampaigns([]);
      setLoadError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (showModal) return;
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
    setSubmitting(false);
  }, [showModal]);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(campaign: Campaign) {
    setEditingId(campaign.id);
    setForm({
      name: campaign.name,
      description: campaign.description ?? "",
      channel: campaign.channel,
      audience: campaign.audience,
      subject: campaign.subject ?? "",
      body: campaign.body ?? "",
      bannerId: campaign.bannerId ?? "",
      offerId: campaign.offerId ?? "",
      startsAt: toLocalInput(campaign.startsAt),
      endsAt: toLocalInput(campaign.endsAt),
      isPublished: campaign.isPublished,
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  function validate(): string {
    if (!form.name.trim()) return "Please give the campaign a name.";
    if (!form.body.trim()) return "Please write the message content.";
    if (form.channel === "email" && !form.subject.trim()) return "Email campaigns need a subject line.";
    if (!form.startsAt || !form.endsAt) return "Please choose a start and end date.";
    if (new Date(form.endsAt) <= new Date(form.startsAt)) return "End date must be after start date.";
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
        channel: form.channel,
        audience: form.audience,
        subject: form.channel === "email" ? form.subject.trim() : null,
        body: form.body.trim(),
        bannerId: form.bannerId || null,
        offerId: form.offerId || null,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        isPublished: form.isPublished,
      };

      if (editingId) {
        await campaignsApi.updateCampaign(editingId, payload);
        toast.success("Campaign updated");
      } else {
        await campaignsApi.createCampaign(payload);
        toast.success("Campaign created");
      }
      setShowModal(false);
      await loadCampaigns();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save campaign");
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublished(campaign: Campaign) {
    const next = !campaign.isPublished;
    setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, isPublished: next } : c)));
    try {
      await campaignsApi.setCampaignPublished(campaign.id, next);
      toast.success(next ? "Campaign published" : "Campaign moved to drafts");
      await loadCampaigns();
    } catch (err) {
      setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, isPublished: !next } : c)));
      toast.error(err instanceof Error ? err.message : "Failed to update campaign");
    }
  }

  async function confirmDeleteCampaign() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await campaignsApi.deleteCampaign(confirmDelete.id);
      toast.success("Campaign deleted");
      setConfirmDelete(null);
      await loadCampaigns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete campaign");
    } finally {
      setDeleting(false);
    }
  }

  // Funnel bar helper: width relative to sent
  function funnelBar(count: number, sent: number): number {
    if (sent <= 0) return 0;
    return Math.max(2, Math.round((count / sent) * 100));
  }

  const columns = [
    {
      key: "name",
      header: "Campaign",
      render: (c: Campaign) => (
        <div>
          <div style={{ fontWeight: 600 }}>{c.name}</div>
          {c.description && <div className="ak-text-muted ak-text-sm">{c.description}</div>}
          {(c.banner || c.offer) && (
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {c.banner && <span className="ak-badge ak-badge--neutral">{c.banner.name}</span>}
              {c.offer && <span className="ak-badge ak-badge--brand">{c.offer.name}</span>}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      width: "130px",
      render: (c: Campaign) => (
        <div className="ak-text-sm">
          <div>{channelLabels[c.channel]}</div>
          <div className="ak-text-muted">{audienceLabels[c.audience]}</div>
        </div>
      ),
    },
    {
      key: "schedule",
      header: "Schedule",
      width: "230px",
      render: (c: Campaign) => (
        <span className="ak-text-sm">
          {formatDateTime(c.startsAt)} → {formatDateTime(c.endsAt)}
        </span>
      ),
    },
    {
      key: "funnel",
      header: "Sent / Open / Click",
      width: "190px",
      render: (c: Campaign) => (
        <span className="ak-text-sm">
          {c.sentCount} / {c.openCount} ({c.openRate}%) / {c.clickCount} ({c.clickRate}%)
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      render: (c: Campaign) => (
        <span className={`ak-status ak-status--${statusBadge[c.status]}`}>
          <span className="ak-status__dot" />
          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
        </span>
      ),
    },
    {
      key: "published",
      header: "Published",
      width: "100px",
      render: (c: Campaign) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={c.isPublished} onChange={() => togglePublished(c)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "100px",
      render: (c: Campaign) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--edit"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(c);
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
              setConfirmDelete(c);
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

  // Month grid for the calendar view; chips land on each campaign's start day
  function calendarCells(): Date[] {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const offset = first.getDay();
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      cells.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i + 1 - offset));
    }
    if (offset + daysInMonth <= 35) cells.length = 35;
    return cells;
  }

  const funnel = stats?.totals;

  return (
    <div className="ak-page">
      <div className="ak-page-header">
        <div className="ak-page-header__left">
          <h1 className="ak-page-header__title">
            Campaigns
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">
            {stats
              ? `${stats.byStatus.running ?? 0} running · ${stats.byStatus.scheduled ?? 0} scheduled · ${stats.byStatus.draft ?? 0} drafts`
              : "Email, push and in-app campaign blasts"}
          </p>
        </div>
        <div className="ak-page-header__actions">
          <div style={{ display: "flex", gap: 8, marginRight: 12 }}>
            <button
              type="button"
              className={view === "list" ? "ak-btn ak-btn--primary" : "ak-btn ak-btn--ghost"}
              onClick={() => setView("list")}
            >
              List
            </button>
            <button
              type="button"
              className={view === "calendar" ? "ak-btn ak-btn--primary" : "ak-btn ak-btn--ghost"}
              onClick={() => setView("calendar")}
            >
              Calendar
            </button>
          </div>
          <button type="button" className="ak-btn ak-btn--primary" onClick={openAddModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Campaign
          </button>
        </div>
      </div>

      <div className="ak-page-body">
        {/* Funnel overview (TASK-009) */}
        {funnel && (
          <div className="ak-card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                { label: "Sent", count: funnel.sent, color: "var(--color-info)" },
                { label: `Opened (${funnel.openRate}%)`, count: funnel.opened, color: "var(--color-success)" },
                { label: `Clicked (${funnel.clickRate}%)`, count: funnel.clicked, color: "var(--color-warning)" },
                { label: "Conversions", count: funnel.conversions, color: "var(--color-error)" },
              ].map((step) => (
                <div key={step.label}>
                  <div className="ak-text-muted ak-text-sm" style={{ marginBottom: 4 }}>
                    {step.label}: <strong style={{ color: "var(--text-strong)" }}>{step.count.toLocaleString("en-IN")}</strong>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--surface-2)" }}>
                    <div style={{ height: "100%", borderRadius: 4, width: `${funnelBar(step.count, funnel.sent)}%`, background: step.color }} />
                  </div>
                </div>
              ))}
            </div>
            {Object.keys(stats!.byChannel).length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {Object.entries(stats!.byChannel).map(([channel, count]) => (
                  <span key={channel} className="ak-badge ak-badge--neutral">
                    {channelLabels[channel as CampaignChannel]}: {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "list" ? (
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
                      placeholder="Search campaigns by name…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="ak-toolbar__filters">
                <StatusDropdown options={channelOptions} value={filterChannel} onChange={setFilterChannel} placeholder="All Channels" size="sm" />
                <StatusDropdown options={statusFilterOptions} value={filterStatus} onChange={setFilterStatus} placeholder="All Statuses" size="sm" />
              </div>
            </div>

            {loadError ? (
              <div className="ak-card" style={{ padding: "48px", textAlign: "center" }}>
                <p style={{ color: "var(--color-danger)", marginBottom: 16 }}>Could not load campaigns: {loadError}</p>
                <button type="button" className="ak-btn ak-btn--primary" onClick={loadCampaigns}>Retry</button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={campaigns}
                loading={loading}
                loadingText="Loading campaigns…"
                emptyIcon="bell"
                emptyTitle="No campaigns yet"
                emptyDescription="Create an email, push or in-app campaign to reach your customers."
                emptyAction={{ label: "Add Campaign", onClick: openAddModal }}
                keyExtractor={(c) => c.id}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <div className="ak-card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>‹ Prev</button>
              <strong>{calendarMonth.toLocaleString("en-IN", { month: "long", year: "numeric" })}</strong>
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>Next ›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 4 }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="ak-text-muted ak-text-sm" style={{ textAlign: "center" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {calendarCells().map((day, i) => {
                const inMonth = day.getMonth() === calendarMonth.getMonth();
                const starting = calendarItems.filter((c) => sameDay(new Date(c.startsAt), day));
                const running = calendarItems.filter(
                  (c) => new Date(c.startsAt) <= day && day <= new Date(c.endsAt) && !starting.some((s) => s.id === c.id),
                );
                return (
                  <div
                    key={i}
                    style={{
                      minHeight: 84,
                      border: "1px solid var(--border-color)",
                      borderRadius: 6,
                      padding: 6,
                      opacity: inMonth ? 1 : 0.4,
                      background: sameDay(day, new Date()) ? "var(--surface-2)" : undefined,
                    }}
                  >
                    <div className="ak-text-sm" style={{ fontWeight: 600, marginBottom: 4 }}>{day.getDate()}</div>
                    {starting.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        title={`${c.name} — starts ${formatDateTime(c.startsAt)}`}
                        onClick={() => openEditModal(c)}
                        style={{
                          display: "block",
                          width: "100%",
                          border: "none",
                          borderRadius: 4,
                          padding: "2px 6px",
                          marginBottom: 3,
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: 12,
                          color: "#fff",
                          background: `var(--color-${statusBadge[c.status] === "neutral" ? "info" : statusBadge[c.status]})`,
                        }}
                      >
                        {c.name.length > 22 ? `${c.name.slice(0, 22)}…` : c.name}
                      </button>
                    ))}
                    {running.length > 0 && (
                      <div className="ak-text-sm ak-text-muted" title={running.map((c) => c.name).join(", ")}>
                        ⟳ {running.length} running
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="ak-modal-overlay" onClick={closeModal}>
          <div className="ak-modal" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">{editingId ? "Edit Campaign" : "Add New Campaign"}</h2>
              <button type="button" className="ak-modal__close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <div className="ak-form-group">
                <label className="ak-label">Campaign Name *</label>
                <input
                  type="text"
                  className="ak-input"
                  placeholder="e.g. Diwali sale announcement"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="ak-form-group">
                <label className="ak-label">Description</label>
                <textarea
                  className="ak-input"
                  rows={2}
                  placeholder="Internal note (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ak-form-group">
                  <label className="ak-label">Channel *</label>
                  <select
                    className="ak-select"
                    value={form.channel}
                    onChange={(e) => setForm({ ...form, channel: e.target.value as CampaignChannel })}
                  >
                    <option value="email">Email</option>
                    <option value="push">Push</option>
                    <option value="in_app">In-App</option>
                  </select>
                </div>
                <div className="ak-form-group">
                  <label className="ak-label">Audience</label>
                  <select
                    className="ak-select"
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value as CampaignAudience })}
                  >
                    <option value="all">All customers</option>
                    <option value="new">New customers</option>
                    <option value="returning">Returning customers</option>
                    <option value="vip">VIP customers</option>
                  </select>
                </div>
              </div>

              {form.channel === "email" && (
                <div className="ak-form-group">
                  <label className="ak-label">Subject *</label>
                  <input
                    type="text"
                    className="ak-input"
                    placeholder="Email subject line"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
              )}

              <div className="ak-form-group">
                <label className="ak-label">Message *</label>
                <textarea
                  className="ak-input"
                  rows={4}
                  placeholder={form.channel === "email" ? "Email body" : "Notification message"}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ak-form-group">
                  <label className="ak-label">Linked Banner</label>
                  <select
                    className="ak-select"
                    value={form.bannerId}
                    onChange={(e) => setForm({ ...form, bannerId: e.target.value })}
                  >
                    <option value="">None</option>
                    {banners.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="ak-form-group">
                  <label className="ak-label">Linked Offer</label>
                  <select
                    className="ak-select"
                    value={form.offerId}
                    onChange={(e) => setForm({ ...form, offerId: e.target.value })}
                  >
                    <option value="">None</option>
                    {offerOptions.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ak-form-group">
                  <label className="ak-label">Starts At *</label>
                  <input
                    type="datetime-local"
                    className="ak-input"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  />
                </div>
                <div className="ak-form-group">
                  <label className="ak-label">Ends At *</label>
                  <input
                    type="datetime-local"
                    className="ak-input"
                    value={form.endsAt}
                    onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="ak-form-group" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <label className="ak-label" style={{ marginBottom: 0 }}>Published</label>
                  <span className="ak-text-muted ak-text-sm">
                    {form.isPublished ? "Runs automatically during its schedule" : "Stays a draft"}
                  </span>
                </div>
                <label className="ak-toggle">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                  <span className="ak-toggle__slider" />
                </label>
              </div>

              {formError && (
                <div className="ak-alert ak-alert--danger" style={{ marginTop: 16 }}>{formError}</div>
              )}
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button type="button" className="ak-btn ak-btn--primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving…" : editingId ? "Save Changes" : "Create Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="ak-modal-overlay" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Delete Campaign?</h2>
              <button type="button" className="ak-modal__close" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p>
                This will permanently remove <strong>{confirmDelete.name}</strong>. This action cannot be undone.
              </p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={confirmDeleteCampaign} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
