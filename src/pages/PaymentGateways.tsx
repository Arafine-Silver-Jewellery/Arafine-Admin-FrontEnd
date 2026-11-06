import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../components/Toast";
import "../styles/settings.css";

type PaymentGatewayType = "razorpay" | "stripe" | "paypal";

interface PaymentGateway {
  id: string;
  name: string;
  type: PaymentGatewayType;
  // Razorpay fields (masked)
  keyId: string | null;
  // Stripe fields (masked)
  publishableKey: string | null;
  // PayPal fields (masked)
  clientId: string | null;
  // Common
  isTestMode: boolean;
  decryptError?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const gatewayTypes: { value: PaymentGatewayType; label: string; description: string }[] = [
  { value: "razorpay", label: "Razorpay", description: "Indian payment gateway" },
  { value: "stripe", label: "Stripe", description: "Global payment platform (coming soon)" },
  { value: "paypal", label: "PayPal", description: "International payments (coming soon)" },
];

export default function PaymentGateways() {
  const toast = useToast();

  // State
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Delete confirmation
  const [gatewayToDelete, setGatewayToDelete] = useState<PaymentGateway | null>(null);
  const [deletingGateway, setDeletingGateway] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "razorpay" as PaymentGatewayType,
    isTestMode: true,
    // Razorpay
    keyId: "",
    keySecret: "",
    webhookSecret: "",
    // Stripe
    publishableKey: "",
    secretKey: "",
    // PayPal
    clientId: "",
    clientSecret: "",
  });

  // Load gateways
  async function loadGateways() {
    setLoading(true);
    try {
      const res = await api.getPaymentGateways();
      const gatewayList = res.data || [];
      setGateways(gatewayList);

      // Warn about decrypt errors
      const broken = gatewayList.filter((g: PaymentGateway) => g.decryptError);
      if (broken.length > 0) {
        const names = broken.map((g: PaymentGateway) => g.name).join(", ");
        toast.error(
          `${broken.length} payment gateway${broken.length === 1 ? "" : "s"} could not be decrypted (${names}). Edit and re-enter credentials.`
        );
      }
    } catch (error) {
      console.error("Failed to load payment gateways:", error);
      toast.error("Failed to load payment gateways");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGateways();
  }, []);

  function openModal(gateway?: PaymentGateway) {
    if (gateway) {
      setEditingGateway(gateway);
      setFormData({
        name: gateway.name,
        type: gateway.type,
        isTestMode: gateway.isTestMode,
        // Clear secrets for editing
        keyId: "",
        keySecret: "",
        webhookSecret: "",
        publishableKey: "",
        secretKey: "",
        clientId: "",
        clientSecret: "",
      });
    } else {
      setEditingGateway(null);
      setFormData({
        name: "",
        type: "razorpay",
        isTestMode: true,
        keyId: "",
        keySecret: "",
        webhookSecret: "",
        publishableKey: "",
        secretKey: "",
        clientId: "",
        clientSecret: "",
      });
    }
    setShowModal(true);
    setTestResult(null);
  }

  function closeModal() {
    setShowModal(false);
    setEditingGateway(null);
    setTestResult(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data: any = {
      name: formData.name,
      type: formData.type,
      isTestMode: formData.isTestMode,
    };

    if (formData.type === "razorpay") {
      if (formData.keyId) data.keyId = formData.keyId;
      if (formData.keySecret) data.keySecret = formData.keySecret;
      if (formData.webhookSecret) data.webhookSecret = formData.webhookSecret;
    } else if (formData.type === "stripe") {
      if (formData.publishableKey) data.publishableKey = formData.publishableKey;
      if (formData.secretKey) data.secretKey = formData.secretKey;
      if (formData.webhookSecret) data.webhookSecret = formData.webhookSecret;
    } else if (formData.type === "paypal") {
      if (formData.clientId) data.clientId = formData.clientId;
      if (formData.clientSecret) data.clientSecret = formData.clientSecret;
    }

    try {
      if (editingGateway) {
        await api.updatePaymentGateway(editingGateway.id, data);
        toast.success("Payment gateway updated");
      } else {
        // For create, credentials are required
        if (formData.type === "razorpay" && (!formData.keyId || !formData.keySecret)) {
          toast.error("Key ID and Key Secret are required");
          return;
        }
        if (formData.type === "stripe" && (!formData.publishableKey || !formData.secretKey)) {
          toast.error("Publishable Key and Secret Key are required");
          return;
        }
        if (formData.type === "paypal" && (!formData.clientId || !formData.clientSecret)) {
          toast.error("Client ID and Client Secret are required");
          return;
        }
        await api.createPaymentGateway(data);
        toast.success("Payment gateway created");
      }
      closeModal();
      loadGateways();
    } catch (error: any) {
      console.error("Failed to save payment gateway:", error);
      toast.error(error.message || "Failed to save payment gateway");
    }
  }

  function handleDelete(gateway: PaymentGateway) {
    setGatewayToDelete(gateway);
  }

  async function confirmDeleteGateway() {
    if (!gatewayToDelete) return;
    setDeletingGateway(true);
    try {
      await api.deletePaymentGateway(gatewayToDelete.id);
      toast.success(`Payment gateway "${gatewayToDelete.name}" deleted`);
      setGatewayToDelete(null);
      loadGateways();
    } catch (error: any) {
      console.error("Failed to delete payment gateway:", error);
      toast.error(error.message || "Failed to delete payment gateway");
    } finally {
      setDeletingGateway(false);
    }
  }

  async function handleActivate(id: string) {
    try {
      await api.activatePaymentGateway(id);
      toast.success("Payment gateway activated");
      loadGateways();
    } catch (error: any) {
      console.error("Failed to activate payment gateway:", error);
      toast.error(error.message || "Failed to activate payment gateway");
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await api.deactivatePaymentGateway(id);
      toast.success("Payment gateway deactivated");
      loadGateways();
    } catch (error: any) {
      console.error("Failed to deactivate payment gateway:", error);
      toast.error(error.message || "Failed to deactivate payment gateway");
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testPaymentGatewayConnection();
      setTestResult({ success: res.success, message: res.message });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || "Connection test failed" });
    } finally {
      setTesting(false);
    }
  }

  function getTypeLabel(type: PaymentGatewayType) {
    return gatewayTypes.find(t => t.value === type)?.label || type;
  }

  const filteredGateways = gateways.filter(gateway => {
    const search = searchTerm.toLowerCase();
    return (
      gateway.name.toLowerCase().includes(search) ||
      gateway.type.toLowerCase().includes(search)
    );
  });

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem" }}>Payment Gateways</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            Configure payment gateways for accepting payments. Only one gateway can be active at a time.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="settings-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search gateways..."
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
            disabled={testing || !gateways.some(g => g.isActive)}
            title={!gateways.some(g => g.isActive) ? "Activate a gateway first" : "Test active gateway"}
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Gateway
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

      {/* Gateways Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="loading">Loading...</td>
                </tr>
              ) : filteredGateways.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    {searchTerm ? "No payment gateways match your search" : "No payment gateways configured"}
                  </td>
                </tr>
              ) : (
                filteredGateways.map(gateway => (
                  <tr key={gateway.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span>{gateway.name}</span>
                        {gateway.decryptError && (
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
                          background: gateway.type === "razorpay" ? "#dbeafe" : gateway.type === "stripe" ? "#e0e7ff" : "#fef3c7",
                          color: gateway.type === "razorpay" ? "#1d4ed8" : gateway.type === "stripe" ? "#4f46e5" : "#92400e",
                        }}
                      >
                        {getTypeLabel(gateway.type)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: gateway.isTestMode ? "#fef3c7" : "#dcfce7",
                          color: gateway.isTestMode ? "#92400e" : "#166534",
                        }}
                      >
                        {gateway.isTestMode ? "Test" : "Live"}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: gateway.isActive ? "#dcfce7" : "#f3f4f6",
                          color: gateway.isActive ? "#22c55e" : "#6b7280",
                        }}
                      >
                        {gateway.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {gateway.isActive ? (
                          <button
                            className="btn-action btn-icon-suspend"
                            onClick={() => handleDeactivate(gateway.id)}
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
                            onClick={() => handleActivate(gateway.id)}
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
                          onClick={() => openModal(gateway)}
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#f59e0b" strokeWidth="2"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#f59e0b" strokeWidth="2"/>
                          </svg>
                        </button>
                        <button
                          className="btn-action btn-icon-delete"
                          onClick={() => handleDelete(gateway)}
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
              <h2>{editingGateway ? "Edit Payment Gateway" : "Add Payment Gateway"}</h2>
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
                  <label htmlFor="name">Gateway Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Production Razorpay"
                    required
                  />
                </div>

                {/* Type */}
                <div className="form-group">
                  <label htmlFor="type">Gateway Type</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    {gatewayTypes.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.label} — {t.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Test Mode Toggle */}
                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      name="isTestMode"
                      checked={formData.isTestMode}
                      onChange={handleChange}
                      style={{ width: "auto" }}
                    />
                    <span>Test Mode</span>
                  </label>
                  <small style={{ color: "#64748b" }}>
                    Enable for testing with sandbox/test credentials
                  </small>
                </div>

                {/* Razorpay Fields */}
                {formData.type === "razorpay" && (
                  <>
                    <div className="form-group">
                      <label htmlFor="keyId">
                        Key ID {!editingGateway && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      <input
                        type="text"
                        id="keyId"
                        name="keyId"
                        value={formData.keyId}
                        onChange={handleChange}
                        placeholder={editingGateway ? "Leave empty to keep current" : "rzp_test_xxxxxxxxxx"}
                        required={!editingGateway}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="keySecret">
                        Key Secret {!editingGateway && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      <input
                        type="password"
                        id="keySecret"
                        name="keySecret"
                        value={formData.keySecret}
                        onChange={handleChange}
                        placeholder={editingGateway ? "Leave empty to keep current" : "Enter Razorpay Key Secret"}
                        required={!editingGateway}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="webhookSecret">Webhook Secret (optional)</label>
                      <input
                        type="password"
                        id="webhookSecret"
                        name="webhookSecret"
                        value={formData.webhookSecret}
                        onChange={handleChange}
                        placeholder="For webhook signature verification"
                      />
                      <small style={{ color: "#64748b" }}>
                        Find this in Razorpay Dashboard → Settings → Webhooks
                      </small>
                    </div>
                  </>
                )}

                {/* Stripe Fields */}
                {formData.type === "stripe" && (
                  <>
                    <div className="form-group">
                      <label htmlFor="publishableKey">
                        Publishable Key {!editingGateway && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      <input
                        type="text"
                        id="publishableKey"
                        name="publishableKey"
                        value={formData.publishableKey}
                        onChange={handleChange}
                        placeholder={editingGateway ? "Leave empty to keep current" : "pk_test_xxxxxxxxxx"}
                        required={!editingGateway}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="secretKey">
                        Secret Key {!editingGateway && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      <input
                        type="password"
                        id="secretKey"
                        name="secretKey"
                        value={formData.secretKey}
                        onChange={handleChange}
                        placeholder={editingGateway ? "Leave empty to keep current" : "sk_test_xxxxxxxxxx"}
                        required={!editingGateway}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="webhookSecret">Webhook Secret (optional)</label>
                      <input
                        type="password"
                        id="webhookSecret"
                        name="webhookSecret"
                        value={formData.webhookSecret}
                        onChange={handleChange}
                        placeholder="whsec_xxxxxxxxxx"
                      />
                    </div>
                  </>
                )}

                {/* PayPal Fields */}
                {formData.type === "paypal" && (
                  <>
                    <div className="form-group">
                      <label htmlFor="clientId">
                        Client ID {!editingGateway && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      <input
                        type="text"
                        id="clientId"
                        name="clientId"
                        value={formData.clientId}
                        onChange={handleChange}
                        placeholder={editingGateway ? "Leave empty to keep current" : "Enter PayPal Client ID"}
                        required={!editingGateway}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="clientSecret">
                        Client Secret {!editingGateway && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      <input
                        type="password"
                        id="clientSecret"
                        name="clientSecret"
                        value={formData.clientSecret}
                        onChange={handleChange}
                        placeholder={editingGateway ? "Leave empty to keep current" : "Enter PayPal Client Secret"}
                        required={!editingGateway}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingGateway ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {gatewayToDelete && (
        <div className="modal-overlay" onClick={() => setGatewayToDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h2>Delete Payment Gateway</h2>
              <button className="modal-close" onClick={() => setGatewayToDelete(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>{gatewayToDelete.name}</strong>?
              </p>
              {gatewayToDelete.isActive && (
                <p style={{ color: "#ef4444", marginTop: "0.5rem" }}>
                  ⚠ This gateway is currently active. Deleting it will disable payment processing.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setGatewayToDelete(null)}
                disabled={deletingGateway}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDeleteGateway}
                disabled={deletingGateway}
              >
                {deletingGateway ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
