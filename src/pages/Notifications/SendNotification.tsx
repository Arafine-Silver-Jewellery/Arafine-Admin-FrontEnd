import { useState } from "react";
import "../../styles/notifications.css";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  image: string;
  notificationCount: number;
  status: boolean;
  resend: boolean;
}

const mockNotifications: NotificationItem[] = [];

export default function SendNotification() {
  const [notifications] = useState(mockNotifications);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null as File | null,
  });

  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>
          <span className="header-icon">🔔</span>
          Send Notification
        </h1>
      </div>

      <div className="notification-form-card">
        <div className="form-layout">
          <div className="form-left">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                placeholder="New notification"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="form-right">
            <div className="form-group">
              <label>Image <span className="ratio-link">(Ratio 1:1)</span></label>
              <div className="upload-area">
                <div className="upload-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21,15 16,10 5,21" />
                  </svg>
                  <p>Click to upload<br /><span>Or drag and drop</span></p>
                </div>
              </div>
              <p className="upload-hint">JPEG, PNG, JPG, WEBP Image size : Max 20MB</p>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-reset">Reset</button>
          <button className="btn-submit">Send Notification</button>
        </div>
      </div>

      <div className="notifications-card">
        <div className="notifications-toolbar">
          <h3>Push notification table <span className="count">{filteredNotifications.length}</span></h3>
          <div className="toolbar-right">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by title"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
          </div>
        </div>

        <div className="notifications-table-container">
          <table className="notifications-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Title</th>
                <th>Description</th>
                <th>Image</th>
                <th>Notification Count</th>
                <th>Status</th>
                <th>Resend</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          <circle cx="12" cy="13" r="1" fill="currentColor" />
                          <path d="M12 10v1" />
                        </svg>
                      </div>
                      <p>No data found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notification, index) => (
                  <tr key={notification.id}>
                    <td>{index + 1}</td>
                    <td>{notification.title}</td>
                    <td>{notification.description}</td>
                    <td>
                      <img src={notification.image} alt="" className="notification-thumb" />
                    </td>
                    <td>{notification.notificationCount}</td>
                    <td>
                      <span className={`status-badge ${notification.status ? "active" : "inactive"}`}>
                        {notification.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button className="btn-resend">Resend</button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-edit" title="Edit">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button className="btn-action btn-delete" title="Delete">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
    </div>
  );
}
