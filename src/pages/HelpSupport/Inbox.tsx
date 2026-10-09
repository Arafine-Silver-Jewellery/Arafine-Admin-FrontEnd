import { useState } from "react";
import "../../styles/help-support.css";

interface ChatContact {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  time: string;
  online: boolean;
  type: "customer" | "delivery";
  unread?: number;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "admin";
  time: string;
}

const mockContacts: ChatContact[] = [
  // Customers
  {
    id: "c1",
    name: "Janaki Bharath",
    phone: "+919885864333",
    lastMessage: "Yes, please ship it today.",
    time: "2 min ago",
    online: true,
    type: "customer",
    unread: 2,
  },
  {
    id: "c2",
    name: "Priya Sharma",
    phone: "+919876543210",
    lastMessage: "Can I get a discount on the gold necklace?",
    time: "15 min ago",
    online: true,
    type: "customer",
  },
  {
    id: "c3",
    name: "Rahul Kumar",
    phone: "+919123456789",
    lastMessage: "Thanks, order received!",
    time: "1 hr ago",
    online: false,
    type: "customer",
  },
  {
    id: "c4",
    name: "Sneha Reddy",
    phone: "+918899776655",
    lastMessage: "Is the ring available in size 7?",
    time: "3 hr ago",
    online: false,
    type: "customer",
    unread: 1,
  },
  {
    id: "c5",
    name: "Karthik Srirangam",
    phone: "+919988776655",
    lastMessage: "Please share the tracking link.",
    time: "Yesterday",
    online: false,
    type: "customer",
  },
  {
    id: "c6",
    name: "Ananya Iyer",
    phone: "+917894561230",
    lastMessage: "Loved the packaging!",
    time: "2 days ago",
    online: true,
    type: "customer",
  },
  {
    id: "c7",
    name: "Vikram Mehta",
    phone: "+919001122334",
    lastMessage: "When will the earrings be back in stock?",
    time: "3 days ago",
    online: false,
    type: "customer",
  },
  // Delivery Men
  {
    id: "d1",
    name: "Ramesh Yadav",
    phone: "+919900112233",
    lastMessage: "Delivered to the customer. OTP verified.",
    time: "5 min ago",
    online: true,
    type: "delivery",
  },
  {
    id: "d2",
    name: "Suresh Patil",
    phone: "+919812345678",
    lastMessage: "Customer not available at the address.",
    time: "30 min ago",
    online: true,
    type: "delivery",
    unread: 1,
  },
  {
    id: "d3",
    name: "Mahesh Kumar",
    phone: "+919988112233",
    lastMessage: "Reached the hub, 5 parcels left.",
    time: "2 hr ago",
    online: false,
    type: "delivery",
  },
  {
    id: "d4",
    name: "Anil Sharma",
    phone: "+919876112233",
    lastMessage: "Out for delivery now.",
    time: "4 hr ago",
    online: true,
    type: "delivery",
  },
  {
    id: "d5",
    name: "Deepak Verma",
    phone: "+919765432198",
    lastMessage: "Picked up the package.",
    time: "Yesterday",
    online: false,
    type: "delivery",
  },
];

const mockMessagesByContact: Record<string, Message[]> = {
  c1: [
    { id: "m1", text: "Hello, I just placed an order #100092.", sender: "user", time: "10:30 AM" },
    { id: "m2", text: "Hi Janaki, thank you for the order!", sender: "admin", time: "10:31 AM" },
    { id: "m3", text: "Can you confirm if the gold pendant is hallmarked?", sender: "user", time: "10:32 AM" },
    { id: "m4", text: "Yes, all our gold jewellery is BIS hallmarked.", sender: "admin", time: "10:33 AM" },
    { id: "m5", text: "Great, when will it be shipped?", sender: "user", time: "10:34 AM" },
    { id: "m6", text: "Yes, please ship it today.", sender: "user", time: "10:36 AM" },
  ],
  c2: [
    { id: "m1", text: "Hi, I'm interested in the gold necklace.", sender: "user", time: "9:15 AM" },
    { id: "m2", text: "Hi Priya, which design are you looking at?", sender: "admin", time: "9:17 AM" },
    { id: "m3", text: "The one with the ruby pendant.", sender: "user", time: "9:18 AM" },
    { id: "m4", text: "Nice choice! It is on a 10% festive offer.", sender: "admin", time: "9:20 AM" },
    { id: "m5", text: "Can I get a discount on the gold necklace?", sender: "user", time: "9:22 AM" },
    { id: "m6", text: "Use code FEST10 at checkout for an extra 5% off.", sender: "admin", time: "9:23 AM" },
  ],
  c3: [
    { id: "m1", text: "Order delivered?", sender: "admin", time: "8:00 AM" },
    { id: "m2", text: "Yes, just received it.", sender: "user", time: "8:05 AM" },
    { id: "m3", text: "Hope you liked it!", sender: "admin", time: "8:06 AM" },
    { id: "m4", text: "Thanks, order received!", sender: "user", time: "8:08 AM" },
  ],
  c4: [
    { id: "m1", text: "Hi, do you have the solitaire ring in size 7?", sender: "user", time: "Yesterday" },
    { id: "m2", text: "Let me check the inventory.", sender: "admin", time: "Yesterday" },
    { id: "m3", text: "Is the ring available in size 7?", sender: "user", time: "Yesterday" },
  ],
  c5: [
    { id: "m1", text: "Your order has been shipped.", sender: "admin", time: "Yesterday" },
    { id: "m2", text: "Please share the tracking link.", sender: "user", time: "Yesterday" },
    { id: "m3", text: "https://track.arafine.co/ABC123", sender: "admin", time: "Yesterday" },
  ],
  c6: [
    { id: "m1", text: "How was your order?", sender: "admin", time: "2 days ago" },
    { id: "m2", text: "Loved the packaging!", sender: "user", time: "2 days ago" },
  ],
  c7: [
    { id: "m1", text: "When will the earrings be back in stock?", sender: "user", time: "3 days ago" },
    { id: "m2", text: "Restocking by next Friday.", sender: "admin", time: "3 days ago" },
  ],
  d1: [
    { id: "m1", text: "Hi, are you at the delivery location?", sender: "admin", time: "9:00 AM" },
    { id: "m2", text: "Yes, almost there.", sender: "user", time: "9:02 AM" },
    { id: "m3", text: "Customer is asking for a bill copy.", sender: "user", time: "9:05 AM" },
    { id: "m4", text: "Hand it over with the parcel, we have emailed a copy.", sender: "admin", time: "9:06 AM" },
    { id: "m5", text: "Delivered to the customer. OTP verified.", sender: "user", time: "9:15 AM" },
  ],
  d2: [
    { id: "m1", text: "Hi, any update on order #100075?", sender: "admin", time: "11:00 AM" },
    { id: "m2", text: "Reached the address.", sender: "user", time: "11:10 AM" },
    { id: "m3", text: "Customer not available at the address.", sender: "user", time: "11:20 AM" },
  ],
  d3: [
    { id: "m1", text: "Status update please.", sender: "admin", time: "8:30 AM" },
    { id: "m2", text: "Reached the hub, 5 parcels left.", sender: "user", time: "8:35 AM" },
  ],
  d4: [
    { id: "m1", text: "Hi Anil, please start the delivery round.", sender: "admin", time: "7:00 AM" },
    { id: "m2", text: "Out for delivery now.", sender: "user", time: "7:15 AM" },
  ],
  d5: [
    { id: "m1", text: "Pickup confirmation for order #100068.", sender: "admin", time: "Yesterday" },
    { id: "m2", text: "Picked up the package.", sender: "user", time: "Yesterday" },
  ],
};

export default function Inbox() {
  const [activeTab, setActiveTab] = useState<"customer" | "delivery">("customer");
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts] = useState<ChatContact[]>(mockContacts);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(mockContacts[0]);
  const [messages, setMessages] = useState<Message[]>(mockMessagesByContact[mockContacts[0].id] ?? []);
  const [newMessage, setNewMessage] = useState("");

  const filteredContacts = contacts
    .filter(c => c.type === activeTab)
    .filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );

  function handleSelectContact(contact: ChatContact) {
    setSelectedContact(contact);
    setMessages(mockMessagesByContact[contact.id] ?? []);
  }

  function handleSendMessage() {
    const text = newMessage.trim();
    if (!text || !selectedContact) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [
      ...prev,
      { id: `m${prev.length + 1}-${Date.now()}`, text, sender: "admin", time },
    ]);
    setNewMessage("");
  }

  return (
    <div className="help-support-container">
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
            {filteredContacts.length === 0 ? (
              <div className="contact-empty">No conversations found</div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`contact-item ${selectedContact?.id === contact.id ? "active" : ""}`}
                  onClick={() => handleSelectContact(contact)}
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
                    <div className="contact-last-row">
                      <span className="contact-last-message">{contact.lastMessage}</span>
                      {contact.unread ? (
                        <span className="contact-unread-badge">{contact.unread}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                />
                <button className="btn-send" onClick={handleSendMessage}>
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
