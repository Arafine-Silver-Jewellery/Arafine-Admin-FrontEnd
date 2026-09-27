import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "../styles/employees.css";

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

interface EmployeeForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "admin" | "employee";
}

export default function Employees() {
  const { employee: currentEmployee } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeForm>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "employee",
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    setLoading(true);
    try {
      const response = await api.getEmployees();
      // Filter out current logged-in employee
      const filtered = (response.data || []).filter(emp => emp.id !== currentEmployee?.id);
      setEmployees(filtered);
    } catch (error) {
      console.error("Failed to load employees:", error);
    } finally {
      setLoading(false);
    }
  }

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
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "employee",
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingEmployee(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data: any = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
    };

    if (formData.password) {
      data.password = formData.password;
    }

    try {
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, data);
      } else {
        if (!formData.password) {
          alert("Password is required for new employee");
          return;
        }
        data.password = formData.password;
        await api.createEmployee(data);
      }
      closeModal();
      loadEmployees();
    } catch (error: any) {
      console.error("Failed to save employee:", error);
      alert(error.message || "Failed to save employee");
    }
  }

  async function handleStatusToggle(employee: Employee) {
    const newStatus = employee.status === "active" ? "suspended" : "active";
    try {
      await api.updateEmployeeStatus(employee.id, newStatus);
      loadEmployees();
    } catch (error: any) {
      console.error("Failed to update status:", error);
      alert(error.message || "Failed to update status");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.deleteEmployee(id);
      loadEmployees();
    } catch (error: any) {
      console.error("Failed to delete employee:", error);
      alert(error.message || "Failed to delete employee");
    }
  }

  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = employees.filter(employee => {
    const search = searchTerm.toLowerCase();
    return (
      employee.firstName.toLowerCase().includes(search) ||
      employee.lastName.toLowerCase().includes(search) ||
      employee.email.toLowerCase().includes(search) ||
      employee.role.toLowerCase().includes(search)
    );
  });

  return (
    <div className="employees-container">
      <div className="employees-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search employees..."
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
          Add Employee
        </button>
      </div>
      <div className="card">
        <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="loading">Loading...</td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">{searchTerm ? "No employees match your search" : "No employees found"}</td>
                  </tr>
                ) : (
                  filteredEmployees.map(employee => (
                    <tr key={employee.id}>
                      <td><strong>{employee.firstName} {employee.lastName}</strong></td>
                      <td>{employee.email}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: employee.role === "admin" ? "#fef3c7" : "#dbeafe",
                            color: employee.role === "admin" ? "#d97706" : "#2563eb",
                          }}
                        >
                          {employee.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: employee.status === "active" ? "#dcfce7" : employee.status === "suspended" ? "#fef3c7" : "#fee2e2",
                            color: employee.status === "active" ? "#22c55e" : employee.status === "suspended" ? "#d97706" : "#dc2626",
                          }}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td>{new Date(employee.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          {employee.status === "active" ? (
                            <button
                              className="btn-action btn-icon-suspend"
                              onClick={() => handleStatusToggle(employee)}
                              title="Suspend"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2"/>
                                <line x1="15" y1="9" x2="9" y2="15" stroke="#f59e0b" strokeWidth="2"/>
                                <line x1="9" y1="9" x2="15" y2="15" stroke="#f59e0b" strokeWidth="2"/>
                              </svg>
                            </button>
                          ) : employee.status === "suspended" ? (
                            <button
                              className="btn-action btn-icon-activate"
                              onClick={() => handleStatusToggle(employee)}
                              title="Activate"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#22c55e" strokeWidth="2"/>
                                <polyline points="22 4 12 14.01 9 11.01" stroke="#22c55e" strokeWidth="2"/>
                              </svg>
                            </button>
                          ) : null}
                          <button
                            className="btn-action btn-icon-edit"
                            onClick={() => openModal(employee)}
                            title="Edit"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#f59e0b" strokeWidth="2"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#f59e0b" strokeWidth="2"/>
                            </svg>
                          </button>
                          <button
                            className="btn-action btn-icon-delete"
                            onClick={() => handleDelete(employee.id, `${employee.firstName} ${employee.lastName}`)}
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
              <h2>{editingEmployee ? "Edit Employee" : "Add Employee"}</h2>
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
                    <label>First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="employee@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password {editingEmployee ? "(leave blank to keep current)" : "*"}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={editingEmployee ? "Leave blank to keep current" : "Min 8 characters"}
                    minLength={8}
                    required={!editingEmployee}
                  />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select name="role" value={formData.role} onChange={handleChange}>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
