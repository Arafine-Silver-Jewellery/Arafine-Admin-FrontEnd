import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { DataTable, StatusDropdown } from "../components";
import "../styles/ui-kit.css";

interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "employee";
  status: "active" | "suspended" | "deleted";
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  sortOrder: number;
}

interface EmployeeForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "admin" | "employee";
}

const statusFilterOptions = [
  { value: "", label: "All Status", color: "neutral" as const },
  { value: "active", label: "Active", color: "success" as const },
  { value: "suspended", label: "Suspended", color: "warning" as const },
];

const roleFilterOptions = [
  { value: "", label: "All Roles", color: "neutral" as const },
  { value: "admin", label: "Admin", color: "warning" as const },
  { value: "employee", label: "Employee", color: "brand" as const },
];

export default function Employees() {
  const toast = useToast();
  const { employee: currentEmployee } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeForm>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "employee",
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Permission modal
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionEmployee, setPermissionEmployee] = useState<Employee | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [employeePermissions, setEmployeePermissions] = useState<string[]>([]);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadAllPermissions();
  }, []);

  async function loadEmployees() {
    setLoading(true);
    try {
      const response = await api.getEmployees();
      const filtered = (response.data || []).filter((emp: Employee) => emp.id !== currentEmployee?.id);
      setEmployees(filtered);
    } catch (error) {
      console.error("Failed to load employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  async function loadAllPermissions() {
    try {
      const response = await api.getPermissions();
      setAllPermissions(response.data || []);
    } catch (error) {
      console.error("Failed to load permissions:", error);
    }
  }

  // Filter employees
  const filteredEmployees = employees.filter((employee) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      employee.firstName.toLowerCase().includes(search) ||
      employee.lastName.toLowerCase().includes(search) ||
      employee.email.toLowerCase().includes(search);
    const matchesStatus = !statusFilter || employee.status === statusFilter;
    const matchesRole = !roleFilter || employee.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  function openModal(employee?: Employee) {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        email: employee.email,
        password: "",
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
      });
    } else {
      setEditingEmployee(null);
      setFormData({ email: "", password: "", firstName: "", lastName: "", role: "employee" });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingEmployee(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Record<string, string> = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
    };
    if (formData.password) data.password = formData.password;

    setSubmitting(true);
    try {
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, data);
        toast.success("Employee updated successfully");
      } else {
        if (!formData.password) {
          toast.warning("Password is required for new employee");
          setSubmitting(false);
          return;
        }
        data.password = formData.password;
        await api.createEmployee(data);
        toast.success("Employee created successfully");
      }
      closeModal();
      loadEmployees();
    } catch (error: unknown) {
      console.error("Failed to save employee:", error);
      toast.error((error as Error).message || "Failed to save employee");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusToggle(employee: Employee) {
    const newStatus = employee.status === "active" ? "suspended" : "active";
    try {
      await api.updateEmployeeStatus(employee.id, newStatus);
      toast.success(`Employee ${newStatus === "active" ? "activated" : "suspended"}`);
      loadEmployees();
    } catch (error: unknown) {
      console.error("Failed to update status:", error);
      toast.error((error as Error).message || "Failed to update status");
    }
  }

  function openDeleteModal(employee: Employee) {
    setDeletingEmployee(employee);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeletingEmployee(null);
  }

  async function handleConfirmDelete() {
    if (!deletingEmployee) return;
    setDeleting(true);
    try {
      await api.deleteEmployee(deletingEmployee.id);
      toast.success("Employee deleted successfully");
      loadEmployees();
      closeDeleteModal();
    } catch (error: unknown) {
      console.error("Failed to delete employee:", error);
      toast.error((error as Error).message || "Failed to delete employee");
    } finally {
      setDeleting(false);
    }
  }

  // Permission functions
  async function openPermissionModal(employee: Employee) {
    setPermissionEmployee(employee);
    setPermissionLoading(true);
    setShowPermissionModal(true);
    try {
      const response = await api.getEmployeePermissions(employee.id);
      setEmployeePermissions(response.data || []);
    } catch (error) {
      console.error("Failed to load employee permissions:", error);
      setEmployeePermissions([]);
    } finally {
      setPermissionLoading(false);
    }
  }

  function closePermissionModal() {
    setShowPermissionModal(false);
    setPermissionEmployee(null);
    setEmployeePermissions([]);
  }

  function handlePermissionToggle(permissionKey: string) {
    setEmployeePermissions((prev) =>
      prev.includes(permissionKey) ? prev.filter((k) => k !== permissionKey) : [...prev, permissionKey]
    );
  }

  async function handleSavePermissions() {
    if (!permissionEmployee) return;
    setSavingPermissions(true);
    try {
      await api.assignEmployeePermissions(permissionEmployee.id, employeePermissions);
      toast.success("Permissions saved successfully");
      closePermissionModal();
    } catch (error: unknown) {
      console.error("Failed to save permissions:", error);
      toast.error((error as Error).message || "Failed to save permissions");
    } finally {
      setSavingPermissions(false);
    }
  }

  const permissionsByCategory = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const columns = [
    {
      key: "name",
      header: "Employee",
      render: (employee: Employee) => (
        <div className="ak-user-cell">
          <div className="ak-user-cell__initials">
            {employee.firstName[0]}
            {employee.lastName[0]}
          </div>
          <div>
            <span className="ak-user-cell__name">
              {employee.firstName} {employee.lastName}
            </span>
            <span className="ak-text-muted ak-text-sm" style={{ display: "block" }}>
              {employee.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      width: "120px",
      render: (employee: Employee) => (
        <span className={`ak-status ak-status--${employee.role === "admin" ? "warning" : "brand"}`}>
          <span className="ak-status__dot" />
          {employee.role}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      render: (employee: Employee) => (
        <span
          className={`ak-status ak-status--${employee.status === "active" ? "success" : employee.status === "suspended" ? "warning" : "danger"}`}
        >
          <span className="ak-status__dot" />
          {employee.status}
        </span>
      ),
    },
    {
      key: "created",
      header: "Joined",
      width: "120px",
      render: (employee: Employee) => (
        <span className="ak-text-muted">{new Date(employee.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "160px",
      render: (employee: Employee) => (
        <div className="ak-row-actions">
          {employee.role !== "admin" && (
            <button
              type="button"
              className="ak-icon-btn"
              title="Permissions"
              onClick={(e) => {
                e.stopPropagation();
                openPermissionModal(employee);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className={`ak-icon-btn ak-icon-btn--${employee.status === "active" ? "warning" : "success"}`}
            title={employee.status === "active" ? "Suspend" : "Activate"}
            onClick={(e) => {
              e.stopPropagation();
              handleStatusToggle(employee);
            }}
          >
            {employee.status === "active" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--edit"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              openModal(employee);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--delete"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(employee);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
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
            Employees
            {employees.length > 0 && <span className="ak-page-header__count">{employees.length}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage staff accounts and permissions</p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--primary" onClick={() => openModal()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Employee
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
                  placeholder="Search employees…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="ak-toolbar__filters">
            <StatusDropdown options={roleFilterOptions} value={roleFilter} onChange={setRoleFilter} placeholder="All Roles" size="sm" />
            <StatusDropdown options={statusFilterOptions} value={statusFilter} onChange={setStatusFilter} placeholder="All Status" size="sm" />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredEmployees}
          loading={loading}
          loadingText="Loading employees…"
          emptyIcon="users"
          emptyTitle="No employees found"
          emptyDescription={searchTerm || statusFilter || roleFilter ? "Try adjusting your filters." : "Add your first employee to get started."}
          emptyAction={{ label: "Add Employee", onClick: () => openModal() }}
          keyExtractor={(employee) => employee.id}
          onRowClick={(employee) => openModal(employee)}
        />
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="ak-modal-overlay" onClick={closeModal}>
          <div className="ak-modal" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">{editingEmployee ? "Edit Employee" : "Add Employee"}</h2>
              <button type="button" className="ak-modal__close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ak-modal__body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div className="ak-field">
                    <label className="ak-field__label">First Name *</label>
                    <input type="text" className="ak-input" name="firstName" value={formData.firstName} onChange={handleChange} required />
                  </div>
                  <div className="ak-field">
                    <label className="ak-field__label">Last Name *</label>
                    <input type="text" className="ak-input" name="lastName" value={formData.lastName} onChange={handleChange} required />
                  </div>
                </div>
                <div className="ak-field" style={{ marginBottom: "1rem" }}>
                  <label className="ak-field__label">Email *</label>
                  <input type="email" className="ak-input" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="ak-field" style={{ marginBottom: "1rem" }}>
                  <label className="ak-field__label">Password {editingEmployee ? "(leave blank to keep)" : "*"}</label>
                  <input
                    type="password"
                    className="ak-input"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={8}
                    required={!editingEmployee}
                  />
                </div>
                <div className="ak-field">
                  <label className="ak-field__label">Role *</label>
                  <select className="ak-select" name="role" value={formData.role} onChange={handleChange}>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="ak-text-muted ak-text-sm" style={{ marginTop: "0.5rem" }}>
                    Admin has full access. Employee requires specific permissions.
                  </p>
                </div>
              </div>
              <div className="ak-modal__footer">
                <button type="button" className="ak-btn ak-btn--ghost" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="ak-btn ak-btn--primary" disabled={submitting}>
                  {submitting ? "Saving…" : editingEmployee ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingEmployee && (
        <div className="ak-modal-overlay" onClick={closeDeleteModal}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Delete Employee</h2>
              <button type="button" className="ak-modal__close" onClick={closeDeleteModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p>
                Are you sure you want to delete{" "}
                <strong>
                  {deletingEmployee.firstName} {deletingEmployee.lastName}
                </strong>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={closeDeleteModal} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {showPermissionModal && permissionEmployee && (
        <div className="ak-modal-overlay" onClick={closePermissionModal}>
          <div className="ak-modal" style={{ maxWidth: "700px", maxHeight: "80vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">
                Permissions - {permissionEmployee.firstName} {permissionEmployee.lastName}
              </h2>
              <button type="button" className="ak-modal__close" onClick={closePermissionModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body" style={{ maxHeight: "50vh", overflowY: "auto" }}>
              {permissionLoading ? (
                <p>Loading permissions…</p>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                    <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => setEmployeePermissions(allPermissions.map((p) => p.key))}>
                      Select All
                    </button>
                    <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => setEmployeePermissions([])}>
                      Deselect All
                    </button>
                    <span className="ak-text-muted" style={{ marginLeft: "auto" }}>
                      {employeePermissions.length} of {allPermissions.length} selected
                    </span>
                  </div>
                  {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                    <div key={category} style={{ marginBottom: "1.5rem" }}>
                      <h4 style={{ marginBottom: "0.75rem", fontWeight: 600, color: "var(--text-strong)" }}>{category}</h4>
                      <div style={{ display: "grid", gap: "0.5rem" }}>
                        {permissions.map((permission) => (
                          <label
                            key={permission.key}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.75rem",
                              padding: "0.75rem",
                              background: employeePermissions.includes(permission.key) ? "var(--brand-weak)" : "var(--surface)",
                              border: "1px solid var(--border-color)",
                              borderRadius: "var(--radius-md)",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={employeePermissions.includes(permission.key)}
                              onChange={() => handlePermissionToggle(permission.key)}
                              style={{ marginTop: "0.25rem" }}
                            />
                            <div>
                              <span style={{ fontWeight: 500 }}>{permission.name}</span>
                              {permission.description && (
                                <span className="ak-text-muted ak-text-sm" style={{ display: "block" }}>
                                  {permission.description}
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={closePermissionModal}>
                Cancel
              </button>
              <button type="button" className="ak-btn ak-btn--primary" onClick={handleSavePermissions} disabled={savingPermissions}>
                {savingPermissions ? "Saving…" : "Save Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
