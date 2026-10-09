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
    name: "Sushma D",
    email: "sushmadhana6u99@gmail.com",
    priority: "Urgent",
    status: "Open",
    type: "Info Inquiry",
    date: "11 Aug 2026 03:20 PM",
    message: "I have ordered an item on 2nd August, I still did not get any update on my order. I want to know where my order is and when I am going to receive it.",
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
    message: "Please confirm if the gold coin I purchased comes with a BIS hallmark certificate.",
    enabled: false,
  },
  {
    id: "3",
    name: "Priya Sharma",
    email: "priya.sharma@gmail.com",
    priority: "High",
    status: "Pending",
    type: "Refund",
    date: "02 Sep 2026 11:05 AM",
    message: "I returned the diamond ring last week but the refund has not been processed yet. Please check and update.",
    enabled: true,
  },
  {
    id: "4",
    name: "Rahul Kumar",
    email: "rahul.kumar@yahoo.com",
    priority: "Medium",
    status: "Open",
    type: "Order Issue",
    date: "05 Sep 2026 09:42 AM",
    message: "I received the wrong size for the silver bracelet. Need an exchange to size M urgently.",
    enabled: true,
  },
  {
    id: "5",
    name: "Sneha Reddy",
    email: "sneha.reddy@outlook.com",
    priority: "Low",
    status: "Open",
    type: "Product Query",
    date: "06 Sep 2026 02:18 PM",
    message: "Is the rose gold pendant available in 18KT? The product page only shows 22KT.",
    enabled: false,
  },
  {
    id: "6",
    name: "Karthik Srirangam",
    email: "karthik.s@gmail.com",
    priority: "Urgent",
    status: "Pending",
    type: "Delivery Issue",
    date: "07 Sep 2026 08:30 AM",
    message: "My order was supposed to be delivered yesterday but the tracking still shows 'In Transit'. Please escalate.",
    enabled: true,
  },
  {
    id: "7",
    name: "Ananya Iyer",
    email: "ananya.iyer@gmail.com",
    priority: "Medium",
    status: "Closed",
    type: "Feedback",
    date: "08 Sep 2026 06:55 PM",
    message: "Loved the packaging and the quality of the earrings. Just wanted to drop a thank you note!",
    enabled: true,
  },
  {
    id: "8",
    name: "Vikram Mehta",
    email: "vikram.mehta@hotmail.com",
    priority: "High",
    status: "Open",
    type: "Payment Issue",
    date: "09 Sep 2026 10:12 AM",
    message: "My card was charged twice for order #100092. Please refund the duplicate transaction immediately.",
    enabled: true,
  },
  {
    id: "9",
    name: "Meera Nair",
    email: "meera.nair@gmail.com",
    priority: "Low",
    status: "Closed",
    type: "Account",
    date: "20 Aug 2026 04:40 PM",
    message: "How do I update my shipping address for future orders?",
    enabled: false,
  },
  {
    id: "10",
    name: "Arjun Patel",
    email: "arjun.patel@gmail.com",
    priority: "Medium",
    status: "Pending",
    type: "Info Inquiry",
    date: "10 Sep 2026 01:25 PM",
    message: "Do you offer a gift-wrapping option for the necklace? If yes, what is the additional charge?",
    enabled: true,
  },
  {
    id: "11",
    name: "Divya Krishnan",
    email: "divya.k@gmail.com",
    priority: "Urgent",
    status: "Open",
    type: "Order Issue",
    date: "10 Sep 2026 05:48 PM",
    message: "The chain of the mangalsutra broke on the first day itself. Need a replacement under warranty.",
    enabled: true,
  },
  {
    id: "12",
    name: "Rohit Sharma",
    email: "rohit.sharma@gmail.com",
    priority: "Low",
    status: "Closed",
    type: "Feedback",
    date: "15 Aug 2026 11:11 AM",
    message: "Suggestion: please add a 'compare products' feature on the website.",
    enabled: true,
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
        {filteredTickets.length === 0 ? (
          <div className="support-card empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <p>No tickets match the current filters</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
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
          ))
        )}
      </div>
    </div>
  );
}
