import { useState } from "react";
import "../../styles/help-support.css";

interface ChatContact {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  time: string;
  online: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "admin";
  time: string;
}

const mockContacts: ChatContact[] = [
  { id: "1", name: "Janaki Bharath", phone: "+919885864333", lastMessage: "Yes", time: "4 months ago", online: true },
];

const mockMessages: Message[] = [
  { id: "1", text: "Hello", sender: "user", time: "10:30 AM" },
  { id: "2", text: "Ho", sender: "user", time: "10:31 AM" },
  { id: "3", text: "Hi", sender: "admin", time: "10:32 AM" },
  { id: "4", text: "Hi", sender: "user", time: "10:33 AM" },
  { id: "5", text: "Yes", sender: "admin", time: "10:34 AM" },
];

export default function Inbox() {
  const [activeTab, setActiveTab] = useState<"customer" | "delivery">("customer");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(mockContacts[0]);
  const [messages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");

  const filteredContacts = mockContacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="help-support-container">
      <div className="help-header">
        <h1>
          <span className="header-icon">💬</span>
          Chatting List
        </h1>
      </div>

      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="chat-search">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>

          <div className="chat-tabs">
            <button
              className={activeTab === "customer" ? "active" : ""}
              onClick={() => setActiveTab("customer")}
            >
              Customer
            </button>
            <button
              className={activeTab === "delivery" ? "active" : ""}
              onClick={() => setActiveTab("delivery")}
            >
              Delivery Man
            </button>
          </div>

          <div className="contact-list">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`contact-item ${selectedContact?.id === contact.id ? "active" : ""}`}
                onClick={() => setSelectedContact(contact)}
              >
                <div className="contact-avatar">
                  <span className={`status-dot ${contact.online ? "online" : ""}`}></span>
                  {contact.name.charAt(0)}
                </div>
                <div className="contact-info">
                  <div className="contact-header">
                    <span className="contact-name">{contact.name}</span>
                    <span className="contact-time">{contact.time}</span>
                  </div>
                  <span className="contact-phone">{contact.phone}</span>
                  <span className="contact-last-message">{contact.lastMessage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-main">
          {selectedContact ? (
            <>
              <div className="chat-header">
                <div className="chat-user-info">
                  <div className="chat-avatar">
                    <span className="status-dot online"></span>
                    {selectedContact.name.charAt(0)}
                  </div>
                  <div>
                    <h3>{selectedContact.name}</h3>
                    <span className="phone">{selectedContact.phone}</span>
                  </div>
                </div>
                <button className="btn-more">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
              </div>

              <div className="chat-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.sender}`}>
                    <div className="message-bubble">
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="chat-input">
                <button className="btn-attach">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21,15 16,10 5,21" />
                  </svg>
                </button>
                <button className="btn-attach">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <button className="btn-attach">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </button>
                <input
                  type="text"
                  placeholder="Send a message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button className="btn-send">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22,2 15,22 11,13 2,9" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
