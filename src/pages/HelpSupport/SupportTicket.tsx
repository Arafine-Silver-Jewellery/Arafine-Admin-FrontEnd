import { useState } from "react";
import "../../styles/help-support.css";

interface Ticket {
  id: string;
  name: string;
  email: string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  status: "Open" | "Closed" | "Pending";
  type: string;
  date: string;
  message: string;
  enabled: boolean;
}

const mockTickets: Ticket[] = [
  {
    id: "1",
    name: "Sushma",
    email: "sushmadhana6u99@gmail.com",
    priority: "Urgent",
    status: "Open",
    type: "Info Inquiry",
    date: "11 Aug 2026 03:20 PM",
    message: "I have order an item on 2nd agust I till did not get any update of my order I want to k lw where is my order and when am I going to get my order",
    enabled: true,
  },
  {
    id: "2",
    name: "VEDAM BHARATH SUMAN",
    email: "jeanaki.rsm@gmail.com",
    priority: "High",
    status: "Closed",
    type: "Info Inquiry",
    date: "29 May 2026 04:16 PM",
    message: "testing",
    enabled: false,
  },
];

export default function SupportTicket() {
  const [tickets, setTickets] = useState(mockTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  function toggleEnabled(id: string) {
    setTickets(prev =>
      prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t)
    );
  }

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "all" || t.priority.toLowerCase() === priorityFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="help-support-container">
      <div className="ticket-filters">
        <div className="search-box wide">
          <input
            type="text"
            placeholder="Search ticket by subject or status"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="ticket-list">
        {filteredTickets.map((ticket) => (
          <div key={ticket.id} className="ticket-card">
            <div className="ticket-header">
              <div className="ticket-user">
                <div className="ticket-avatar">
                  {ticket.name.charAt(0)}
                </div>
                <div className="ticket-user-info">
                  <h4>{ticket.name}</h4>
                  <span className="ticket-email">{ticket.email}</span>
                  <div className="ticket-badges">
                    <span className={`priority-badge ${ticket.priority.toLowerCase()}`}>
                      {ticket.priority}
                    </span>
                    <span className={`status-badge ${ticket.status.toLowerCase()}`}>
                      {ticket.status}
                    </span>
                    <span className="type-badge">{ticket.type}</span>
                  </div>
                  <span className="ticket-date">{ticket.date}</span>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={ticket.enabled}
                  onChange={() => toggleEnabled(ticket.id)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="ticket-message">
              <p>{ticket.message}</p>
            </div>
            <div className="ticket-actions">
              <button className="btn-view-ticket">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
