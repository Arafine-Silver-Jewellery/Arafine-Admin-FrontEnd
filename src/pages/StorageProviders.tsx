import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../components/Toast";
import "../styles/settings.css";

type StorageType = "s3" | "r2" | "gcs" | "azure" | "minio";

interface StorageProvider {
  id: string;
  name: string;
  type: StorageType;
  bucket: string;
  region: string | null;
  endpoint: string | null;
  accessKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const storageTypes: { value: StorageType; label: string }[] = [
  { value: "s3", label: "Amazon S3" },
  { value: "r2", label: "Cloudflare R2" },
  { value: "gcs", label: "Google Cloud Storage" },
  { value: "azure", label: "Azure Blob Storage" },
  { value: "minio", label: "MinIO" },
];

export default function StorageProviders() {
  const toast = useToast();
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<StorageProvider | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "s3" as StorageType,
    bucket: "",
    region: "",
    endpoint: "",
    accessKey: "",
    secretKey: "",
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  async function loadProviders() {
    setLoading(true);
    try {
      const res = await api.getStorageProviders();
      setProviders(res.data || []);
    } catch (error) {
      console.error("Failed to load storage providers:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProviders();
  }, []);

  function openModal(provider?: StorageProvider) {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        name: provider.name,
        type: provider.type,
        bucket: provider.bucket,
        region: provider.region || "",
        endpoint: provider.endpoint || "",
        accessKey: provider.accessKey,
        secretKey: "",
      });
    } else {
      setEditingProvider(null);
      setFormData({
        name: "",
        type: "s3",
        bucket: "",
        region: "",
        endpoint: "",
        accessKey: "",
        secretKey: "",
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProvider(null);
    setTestResult(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Clear endpoint when switching to S3
      if (name === "type" && value === "s3") {
        updated.endpoint = "";
      }
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data: any = {
      name: formData.name,
      type: formData.type,
      bucket: formData.bucket,
      accessKey: formData.accessKey,
    };

    if (formData.region) data.region = formData.region;
    if (formData.endpoint) data.endpoint = formData.endpoint;
    if (formData.secretKey) data.secretKey = formData.secretKey;

    try {
      if (editingProvider) {
        await api.updateStorageProvider(editingProvider.id, data);
      } else {
        data.secretKey = formData.secretKey;
        await api.createStorageProvider(data);
      }
      closeModal();
      loadProviders();
    } catch (error: any) {
      console.error("Failed to save storage provider:", error);
      toast.error(error.message || "Failed to save storage provider");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.deleteStorageProvider(id);
      loadProviders();
    } catch (error: any) {
      console.error("Failed to delete storage provider:", error);
      toast.error(error.message || "Failed to delete storage provider");
    }
  }

  async function handleActivate(id: string) {
    try {
      await api.activateStorageProvider(id);
      loadProviders();
    } catch (error: any) {
      console.error("Failed to activate storage provider:", error);
      toast.error(error.message || "Failed to activate storage provider");
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await api.deactivateStorageProvider(id);
      loadProviders();
    } catch (error: any) {
      console.error("Failed to deactivate storage provider:", error);
      toast.error(error.message || "Failed to deactivate storage provider");
    }
  }

  async function handleTestConnection(providerId?: string) {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testStorageConnection(providerId);
      setTestResult({ success: res.success, message: res.message });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || "Connection test failed" });
    } finally {
      setTesting(false);
    }
  }

  function getTypeLabel(type: StorageType) {
    return storageTypes.find(t => t.value === type)?.label || type;
  }

  const [searchTerm, setSearchTerm] = useState("");

  const filteredProviders = providers.filter(provider => {
    const search = searchTerm.toLowerCase();
    return (
      provider.name.toLowerCase().includes(search) ||
      provider.type.toLowerCase().includes(search) ||
      provider.bucket.toLowerCase().includes(search)
    );
  });

  return (
    <div className="settings-container">
      <div className="settings-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search storage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Storage
        </button>
      </div>
      <div className="card">
        <div className="table-container">
          <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Bucket</th>
                  <th>Region</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="loading">Loading...</td>
                  </tr>
                ) : filteredProviders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">{searchTerm ? "No storage providers match your search" : "No storage providers found"}</td>
                  </tr>
                ) : (
                  filteredProviders.map(provider => (
                    <tr key={provider.id}>
                      <td>{provider.name}</td>
                      <td>
                        <span className="badge" style={{ background: "#e0e7ff", color: "#4f46e5" }}>
                          {getTypeLabel(provider.type)}
                        </span>
                      </td>
                      <td>{provider.bucket}</td>
                      <td>{provider.region || "-"}</td>
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
                            onClick={() => handleDelete(provider.id, provider.name)}
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

        {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProvider ? "Edit Storage Provider" : "Add Storage Provider"}</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Production S3"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                    >
                      {storageTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Bucket *</label>
                  <input
                    type="text"
                    name="bucket"
                    value={formData.bucket}
                    onChange={handleChange}
                    placeholder="my-bucket-name"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Region {formData.type === "s3" && "*"}</label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      placeholder={formData.type === "s3" ? "us-east-1" : "auto (optional)"}
                      required={formData.type === "s3"}
                    />
                  </div>
                  {formData.type !== "s3" && (
                    <div className="form-group">
                      <label>Endpoint *</label>
                      <input
                        type="url"
                        name="endpoint"
                        value={formData.endpoint}
                        onChange={handleChange}
                        placeholder={
                          formData.type === "r2" ? "https://<account_id>.r2.cloudflarestorage.com" :
                          formData.type === "minio" ? "https://minio.example.com:9000" :
                          formData.type === "gcs" ? "https://storage.googleapis.com" :
                          formData.type === "azure" ? "https://<account>.blob.core.windows.net" :
                          "https://..."
                        }
                        required
                      />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Access Key *</label>
                  <input
                    type="text"
                    name="accessKey"
                    value={formData.accessKey}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{editingProvider ? "Secret Key (leave blank to keep)" : "Secret Key *"}</label>
                  <input
                    type="password"
                    name="secretKey"
                    value={formData.secretKey}
                    onChange={handleChange}
                    required={!editingProvider}
                  />
                </div>
              </div>
              <div className="modal-footer">
                {editingProvider && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleTestConnection(editingProvider.id)}
                    disabled={testing}
                    style={{ marginRight: "auto" }}
                  >
                    {testing ? "Testing..." : "Test Connection"}
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProvider ? "Update" : "Create"}
                </button>
              </div>
              {testResult && (
                <div
                  className="test-result"
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: testResult.success ? "#dcfce7" : "#fee2e2",
                    color: testResult.success ? "#166534" : "#991b1b",
                    borderTop: "1px solid #e5e7eb",
                    fontSize: "0.875rem",
                  }}
                >
                  {testResult.success ? "✓ " : "✗ "}{testResult.message}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
