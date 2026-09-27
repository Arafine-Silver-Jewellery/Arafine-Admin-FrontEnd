import { useEffect, useState } from "react";
import { api } from "../api/client";

interface SmtpConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromName: string;
  fromEmail: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SmtpConfigs() {
  const [configs, setConfigs] = useState<SmtpConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SmtpConfig | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: "587",
    secure: false,
    user: "",
    password: "",
    fromName: "",
    fromEmail: "",
  });

  async function loadConfigs() {
    setLoading(true);
    try {
      const res = await api.getSmtpConfigs();
      setConfigs(res.data || []);
    } catch (error) {
      console.error("Failed to load SMTP configs:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfigs();
  }, []);

  function openModal(config?: SmtpConfig) {
    if (config) {
      setEditingConfig(config);
      setFormData({
        name: config.name,
        host: config.host,
        port: config.port.toString(),
        secure: config.secure,
        user: config.user,
        password: "",
        fromName: config.fromName,
        fromEmail: config.fromEmail,
      });
    } else {
      setEditingConfig(null);
      setFormData({
        name: "",
        host: "",
        port: "587",
        secure: false,
        user: "",
        password: "",
        fromName: "",
        fromEmail: "",
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingConfig(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data: any = {
      name: formData.name,
      host: formData.host,
      port: parseInt(formData.port),
      secure: formData.secure,
      user: formData.user,
      fromName: formData.fromName,
      fromEmail: formData.fromEmail,
    };

    if (formData.password) {
      data.password = formData.password;
    }

    try {
      if (editingConfig) {
        await api.updateSmtpConfig(editingConfig.id, data);
      } else {
        data.password = formData.password;
        await api.createSmtpConfig(data);
      }
      closeModal();
      loadConfigs();
    } catch (error: any) {
      console.error("Failed to save SMTP config:", error);
      alert(error.message || "Failed to save SMTP config");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.deleteSmtpConfig(id);
      loadConfigs();
    } catch (error: any) {
      console.error("Failed to delete SMTP config:", error);
      alert(error.message || "Failed to delete SMTP config");
    }
  }

  async function handleActivate(id: string) {
    try {
      await api.activateSmtpConfig(id);
      loadConfigs();
    } catch (error: any) {
      console.error("Failed to activate SMTP config:", error);
      alert(error.message || "Failed to activate SMTP config");
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await api.deactivateSmtpConfig(id);
      loadConfigs();
    } catch (error: any) {
      console.error("Failed to deactivate SMTP config:", error);
      alert(error.message || "Failed to deactivate SMTP config");
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>SMTP Configurations</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add SMTP
        </button>
      </header>
      <div className="page-content">
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Host</th>
                  <th>Port</th>
                  <th>From</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="loading">Loading...</td>
                  </tr>
                ) : configs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">No SMTP configurations found</td>
                  </tr>
                ) : (
                  configs.map(config => (
                    <tr key={config.id}>
                      <td>{config.name}</td>
                      <td>{config.host}</td>
                      <td>{config.port}</td>
                      <td>{config.fromName} &lt;{config.fromEmail}&gt;</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: config.isActive ? "#dcfce7" : "#f3f4f6",
                            color: config.isActive ? "#22c55e" : "#6b7280",
                          }}
                        >
                          {config.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {config.isActive ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDeactivate(config.id)}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleActivate(config.id)}
                            >
                              Activate
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openModal(config)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(config.id, config.name)}
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
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingConfig ? "Edit SMTP Config" : "Add SMTP Config"}</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Gmail, SendGrid"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Host *</label>
                    <input
                      type="text"
                      name="host"
                      value={formData.host}
                      onChange={handleChange}
                      placeholder="smtp.gmail.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Port *</label>
                    <input
                      type="number"
                      name="port"
                      value={formData.port}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="checkbox"
                      name="secure"
                      checked={formData.secure}
                      onChange={handleChange}
                    />
                    Secure (SSL/TLS)
                  </label>
                  <small style={{ color: "#6b7280" }}>Enable for port 465, disable for port 587 (STARTTLS)</small>
                </div>
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    name="user"
                    value={formData.user}
                    onChange={handleChange}
                    placeholder="your-email@gmail.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{editingConfig ? "Password (leave blank to keep)" : "Password *"}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="App password"
                    required={!editingConfig}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>From Name *</label>
                    <input
                      type="text"
                      name="fromName"
                      value={formData.fromName}
                      onChange={handleChange}
                      placeholder="Arafine"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>From Email *</label>
                    <input
                      type="email"
                      name="fromEmail"
                      value={formData.fromEmail}
                      onChange={handleChange}
                      placeholder="noreply@arafine.com"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingConfig ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
