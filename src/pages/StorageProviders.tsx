import { useEffect, useState } from "react";
import { api } from "../api/client";
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
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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
      alert(error.message || "Failed to save storage provider");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.deleteStorageProvider(id);
      loadProviders();
    } catch (error: any) {
      console.error("Failed to delete storage provider:", error);
      alert(error.message || "Failed to delete storage provider");
    }
  }

  async function handleActivate(id: string) {
    try {
      await api.activateStorageProvider(id);
      loadProviders();
    } catch (error: any) {
      console.error("Failed to activate storage provider:", error);
      alert(error.message || "Failed to activate storage provider");
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await api.deactivateStorageProvider(id);
      loadProviders();
    } catch (error: any) {
      console.error("Failed to deactivate storage provider:", error);
      alert(error.message || "Failed to deactivate storage provider");
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
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {provider.isActive ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDeactivate(provider.id)}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleActivate(provider.id)}
                            >
                              Activate
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openModal(provider)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(provider.id, provider.name)}
                          >
                            Delete
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
                    <label>Region</label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      placeholder="us-east-1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Endpoint</label>
                    <input
                      type="url"
                      name="endpoint"
                      value={formData.endpoint}
                      onChange={handleChange}
                      placeholder="For R2/MinIO: https://..."
                    />
                  </div>
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
    </div>
  );
}
