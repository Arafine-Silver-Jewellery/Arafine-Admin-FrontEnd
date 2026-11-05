import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../components/Toast";
import "../styles/settings.css";

type SmsProviderType = "msg91" | "twilio";

interface SmsProvider {
  id: string;
  name: string;
  type: SmsProviderType;
  // MSG91 fields
  apiKey: string | null;
  senderId: string | null;
  templateId: string | null;
  apiUrl: string | null;
  // Twilio fields
  accountSid: string | null;
  phoneNumber: string | null;
  // Common
  decryptError?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const providerTypes: { value: SmsProviderType; label: string; description: string }[] = [
  { value: "msg91", label: "MSG91", description: "Indian SMS gateway with OTP templates" },
  { value: "twilio", label: "Twilio", description: "Global SMS platform" },
];

export default function SmsProviders() {
  const toast = useToast();

  // State
  const [providers, setProviders] = useState<SmsProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SmsProvider | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Delete confirmation
  const [providerToDelete, setProviderToDelete] = useState<SmsProvider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "msg91" as SmsProviderType,
    // MSG91
    apiKey: "",
    senderId: "",
    templateId: "",
    apiUrl: "https://api.msg91.com/api/v5/otp",
    // Twilio
    accountSid: "",
    authToken: "",
    phoneNumber: "",
  });

  // Load providers
  async function loadProviders() {
    setLoading(true);
    try {
      const res = await api.getSmsProviders();
      const providerList = res.data || [];
      setProviders(providerList);

      // Warn about decrypt errors
      const broken = providerList.filter((p: SmsProvider) => p.decryptError);
      if (broken.length > 0) {
        const names = broken.map((p: SmsProvider) => p.name).join(", ");
        toast.error(
          `${broken.length} SMS provider${broken.length === 1 ? "" : "s"} could not be decrypted (${names}). Edit ${broken.length === 1 ? "it" : "them"} and re-enter credentials.`
        );
      }
    } catch (error) {
      console.error("Failed to load SMS providers:", error);
      toast.error("Failed to load SMS providers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProviders();
  }, []);

  function openModal(provider?: SmsProvider) {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        name: provider.name,
        type: provider.type,
        // MSG91
        apiKey: "",
        senderId: provider.senderId || "",
        templateId: provider.templateId || "",
        apiUrl: provider.apiUrl || "https://api.msg91.com/api/v5/otp",
        // Twilio
        accountSid: "",
        authToken: "",
        phoneNumber: provider.phoneNumber || "",
      });
    } else {
      setEditingProvider(null);
      setFormData({
        name: "",
        type: "msg91",
        apiKey: "",
        senderId: "",
        templateId: "",
        apiUrl: "https://api.msg91.com/api/v5/otp",
        accountSid: "",
        authToken: "",
        phoneNumber: "",
      });
    }
    setShowModal(true);
    setTestResult(null);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProvider(null);
    setTestResult(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data: any = {
      name: formData.name,
      type: formData.type,
    };

    if (formData.type === "msg91") {
      if (formData.apiKey) data.apiKey = formData.apiKey;
      if (formData.senderId) data.senderId = formData.senderId;
      if (formData.templateId) data.templateId = formData.templateId;
      if (formData.apiUrl) data.apiUrl = formData.apiUrl;
    } else if (formData.type === "twilio") {
      if (formData.accountSid) data.accountSid = formData.accountSid;
      if (formData.authToken) data.authToken = formData.authToken;
      if (formData.phoneNumber) data.phoneNumber = formData.phoneNumber;
    }

    try {
      if (editingProvider) {
        await api.updateSmsProvider(editingProvider.id, data);
        toast.success("SMS provider updated");
      } else {
        // For create, credentials are required
        if (formData.type === "msg91" && !formData.apiKey) {
          toast.error("API Key is required");
          return;
        }
        if (formData.type === "twilio" && (!formData.accountSid || !formData.authToken || !formData.phoneNumber)) {
          toast.error("All Twilio fields are required");
          return;
        }
        await api.createSmsProvider(data);
        toast.success("SMS provider created");
      }
      closeModal();
      loadProviders();
    } catch (error: any) {
      console.error("Failed to save SMS provider:", error);
      toast.error(error.message || "Failed to save SMS provider");
    }
  }

  function handleDelete(provider: SmsProvider) {
    setProviderToDelete(provider);
  }

  async function confirmDeleteProvider() {
    if (!providerToDelete) return;
    setDeletingProvider(true);
    try {
      await api.deleteSmsProvider(providerToDelete.id);
      toast.success(`SMS provider "${providerToDelete.name}" deleted`);
      setProviderToDelete(null);
      loadProviders();
    } catch (error: any) {
      console.error("Failed to delete SMS provider:", error);
      toast.error(error.message || "Failed to delete SMS provider");
    } finally {
      setDeletingProvider(false);
    }
  }

  async function handleActivate(id: string) {
    try {
      await api.activateSmsProvider(id);
      toast.success("SMS provider activated");
      loadProviders();
    } catch (error: any) {
      console.error("Failed to activate SMS provider:", error);
      toast.error(error.message || "Failed to activate SMS provider");
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await api.deactivateSmsProvider(id);
      toast.success("SMS provider deactivated");
      loadProviders();
    } catch (error: any) {
      console.error("Failed to deactivate SMS provider:", error);
      toast.error(error.message || "Failed to deactivate SMS provider");
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testSmsConnection();
      setTestResult({ success: res.success, message: res.message });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || "Connection test failed" });
    } finally {
      setTesting(false);
    }
  }

  function getTypeLabel(type: SmsProviderType) {
    return providerTypes.find(t => t.value === type)?.label || type;
  }

  const filteredProviders = providers.filter(provider => {
    const search = searchTerm.toLowerCase();
    return (
      provider.name.toLowerCase().includes(search) ||
      provider.type.toLowerCase().includes(search)
    );
  });

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem" }}>SMS Providers</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            Configure SMS providers for OTP delivery. Only one provider can be active at a time.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="settings-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={testing || !providers.some(p => p.isActive)}
            title={!providers.some(p => p.isActive) ? "Activate a provider first" : "Test active provider"}
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Provider
          </button>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          style={{
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            borderRadius: "0.5rem",
            background: testResult.success ? "#dcfce7" : "#fee2e2",
            color: testResult.success ? "#166534" : "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {testResult.success ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {testResult.message}
        </div>
      )}

      {/* Providers Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Configuration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="loading">Loading...</td>
                </tr>
              ) : filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    {searchTerm ? "No SMS providers match your search" : "No SMS providers configured"}
                  </td>
                </tr>
              ) : (
                filteredProviders.map(provider => (
                  <tr key={provider.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span>{provider.name}</span>
                        {provider.decryptError && (
                          <span
                            className="badge"
                            style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.7rem" }}
                            title="Credentials could not be decrypted. Edit to re-enter them."
                          >
                            ⚠ Re-enter credentials
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: provider.type === "msg91" ? "#dbeafe" : "#e0e7ff",
                          color: provider.type === "msg91" ? "#1d4ed8" : "#4f46e5",
                        }}
                      >
                        {getTypeLabel(provider.type)}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.875rem", color: "#64748b" }}>
                      {provider.type === "msg91" && (
                        <>
                          {provider.templateId ? `Template: ${provider.templateId}` : "No template"}
                          {provider.senderId && ` • Sender: ${provider.senderId}`}
                        </>
                      )}
                      {provider.type === "twilio" && (
                        <>
                          {provider.phoneNumber ? `From: ${provider.phoneNumber}` : "No phone"}
                          {provider.accountSid && ` • SID: ${provider.accountSid}`}
                        </>
                      )}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: provider.isActive ? "#dcfce7" : "#f3f4f6",
                          color: provider.isActive ? "#22c55e" : "#6b7280",
                        }}
                      >
                        {provider.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {provider.isActive ? (
                          <button
                            className="btn-action btn-icon-suspend"
                            onClick={() => handleDeactivate(provider.id)}
                            title="Deactivate"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2"/>
                              <line x1="15" y1="9" x2="9" y2="15" stroke="#f59e0b" strokeWidth="2"/>
                              <line x1="9" y1="9" x2="15" y2="15" stroke="#f59e0b" strokeWidth="2"/>
                            </svg>
                          </button>
                        ) : (
                          <button
                            className="btn-action btn-icon-activate"
                            onClick={() => handleActivate(provider.id)}
                            title="Activate"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#22c55e" strokeWidth="2"/>
                              <polyline points="22 4 12 14.01 9 11.01" stroke="#22c55e" strokeWidth="2"/>
                            </svg>
                          </button>
                        )}
                        <button
                          className="btn-action btn-icon-edit"
                          onClick={() => openModal(provider)}
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#f59e0b" strokeWidth="2"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#f59e0b" strokeWidth="2"/>
                          </svg>
                        </button>
                        <button
                          className="btn-action btn-icon-delete"
                          onClick={() => handleDelete(provider)}
                          title="Delete"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <polyline points="3,6 5,6 21,6" stroke="#ef4444" strokeWidth="2"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#ef4444" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2>{editingProvider ? "Edit SMS Provider" : "Add SMS Provider"}</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Name */}
                <div className="form-group">
                  <label htmlFor="name">Provider Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Production MSG91"
                    required
                  />
                </div>

                {/* Type */}
                <div className="form-group">
                  <label htmlFor="type">Provider Type</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    disabled={!!editingProvider}
                  >
                    {providerTypes.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.label} — {t.description}
                      </option>
                    ))}
                  </select>
                  {editingProvider && (
                    <small style={{ color: "#64748b" }}>Provider type cannot be changed after creation</small>
                  )}
                </div>

                {/* MSG91 Fields */}
                {formData.type === "msg91" && (
                  <>
                    <div className="form-group">
                      <label htmlFor="apiKey">
                        API Key {!editingProvider && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      <input
                        type="password"
                        id="apiKey"
                        name="apiKey"
                        value={formData.apiKey}
                        onChange={handleChange}
                        placeholder={editingProvider ? "Leave empty to keep current" : "Enter MSG91 API key"}
                        required={!editingProvider}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="templateId">Template ID</label>
                      <input
                        type="text"
                        id="templateId"
                        name="templateId"
                        value={formData.templateId}
                        onChange={handleChange}
                        placeholder="MSG91 OTP template ID"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="senderId">Sender ID</label>
                      <input
                        type="text"
                        id="senderId"
                        name="senderId"
                        value={formData.senderId}
                        onChange={handleChange}
                        placeholder="e.g., ARAFIN"
                        maxLength={6}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="apiUrl">API URL</label>
                      <input
                        type="url"
                        id="apiUrl"
                        name="apiUrl"
                        value={formData.apiUrl}
                        onChange={handleChange}
                        placeholder="https://api.msg91.com/api/v5/otp"
                      />
                    </div>
                  </>
                )}

                {/* Twilio Fields */}
                {formData.type === "twilio" && (
                  <>
                    <div className="form-group">
                      <label htmlFor="accountSid">
                        Account SID {!editingProvider && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      <input
                        type="text"
                        id="accountSid"
                        name="accountSid"
                        value={formData.accountSid}
                        onChange={handleChange}
                        placeholder={editingProvider ? "Leave empty to keep current" : "Enter Twilio Account SID"}
                        required={!editingProvider}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="authToken">
                        Auth Token {!editingProvider && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      <input
                        type="password"
                        id="authToken"
                        name="authToken"
                        value={formData.authToken}
                        onChange={handleChange}
                        placeholder={editingProvider ? "Leave empty to keep current" : "Enter Twilio Auth Token"}
                        required={!editingProvider}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phoneNumber">
                        Phone Number {!editingProvider && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      <input
                        type="text"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="+1234567890"
                        required={!editingProvider}
                      />
                      <small style={{ color: "#64748b" }}>Your Twilio phone number in E.164 format</small>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProvider ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {providerToDelete && (
        <div className="modal-overlay" onClick={() => setProviderToDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h2>Delete SMS Provider</h2>
              <button className="modal-close" onClick={() => setProviderToDelete(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>{providerToDelete.name}</strong>?
              </p>
              {providerToDelete.isActive && (
                <p style={{ color: "#ef4444", marginTop: "0.5rem" }}>
                  ⚠ This provider is currently active. Deleting it will disable SMS functionality.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setProviderToDelete(null)}
                disabled={deletingProvider}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDeleteProvider}
                disabled={deletingProvider}
              >
                {deletingProvider ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
