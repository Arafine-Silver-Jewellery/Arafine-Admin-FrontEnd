import { useState } from "react";
import "../../styles/help-support.css";

interface CustomerMessage {
  id: string;
  customerName: string;
  contactInfo: string;
  subject: string;
  timeDate: string;
  replyStatus: "Replied" | "Pending";
}

const mockMessages: CustomerMessage[] = [];

export default function Messages() {
  const [messages] = useState(mockMessages);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMessages = messages.filter(m =>
    m.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.contactInfo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="help-support-container">
      <div className="help-header">
        <h1>
          <span className="header-icon orange">📧</span>
          Customer Message
        </h1>
      </div>

      <div className="support-card">
        <div className="support-toolbar">
          <h3>Customer Message Table <span className="count">{filteredMessages.length}</span></h3>
          <div className="toolbar-right">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by Name or Mobile No or Email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <button className="btn-filter">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
              </svg>
              Filter
            </button>
          </div>
        </div>

        <div className="support-table-container">
          <table className="support-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Customer Name</th>
                <th>Contact Info</th>
                <th>Subject</th>
                <th>Time & Date</th>
                <th>Reply Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          <circle cx="12" cy="13" r="1" fill="currentColor" />
                          <path d="M12 10v1" />
                        </svg>
                      </div>
                      <p>No data to show</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMessages.map((message, index) => (
                  <tr key={message.id}>
                    <td>{index + 1}</td>
                    <td>{message.customerName}</td>
                    <td>{message.contactInfo}</td>
                    <td>{message.subject}</td>
                    <td>{message.timeDate}</td>
                    <td>
                      <span className={`status-badge ${message.replyStatus.toLowerCase()}`}>
                        {message.replyStatus}
                      </span>
                    </td>
                    <td>
                      <button className="btn-view">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        View
                      </button>
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
