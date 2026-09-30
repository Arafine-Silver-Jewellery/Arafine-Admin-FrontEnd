import { useState } from "react";
import "../../styles/notifications.css";

interface NotificationMessage {
  id: string;
  label: string;
  message: string;
  enabled: boolean;
}

const customerMessages: NotificationMessage[] = [
  { id: "fund_added", label: "Fund added by admin message", message: "customize your fund added by admin message message", enabled: true },
  { id: "message_from_admin", label: "Message from admin", message: "customize your message from admin message", enabled: false },
  { id: "message_from_delivery", label: "Message from delivery man", message: "customize your message from delivery man message", enabled: true },
  { id: "message_from_seller", label: "Message from seller", message: "customize your message from seller message", enabled: true },
  { id: "order_canceled", label: "Order canceled message", message: "", enabled: false },
  { id: "order_confirmation", label: "Order confirmation message", message: "Order con Message", enabled: true },
  { id: "order_delivered", label: "Order delivered message", message: "Order del Message", enabled: true },
  { id: "order_edit", label: "Order edit message", message: "Order {orderId} edited", enabled: true },
  { id: "order_edit_return", label: "Order edit return amount message", message: "customize your order edit return amount message message", enabled: true },
  { id: "order_failed", label: "Order failed message", message: "Order fa Message", enabled: false },
  { id: "order_pending", label: "Order pending message", message: "order pen message", enabled: true },
  { id: "order_processing", label: "Order processing message", message: "Order pro Message", enabled: true },
];

const vendorMessages: NotificationMessage[] = [
  { id: "new_order", label: "New order message", message: "You have a new order", enabled: true },
  { id: "order_canceled", label: "Order canceled message", message: "Order has been canceled", enabled: true },
  { id: "withdraw_approved", label: "Withdraw approved message", message: "Your withdraw request approved", enabled: true },
  { id: "withdraw_rejected", label: "Withdraw rejected message", message: "Your withdraw request rejected", enabled: false },
];

const deliverymanMessages: NotificationMessage[] = [
  { id: "new_delivery", label: "New delivery request", message: "You have a new delivery request", enabled: true },
  { id: "order_assigned", label: "Order assigned message", message: "New order assigned to you", enabled: true },
  { id: "delivery_completed", label: "Delivery completed message", message: "Delivery marked as completed", enabled: true },
];

export default function PushNotificationsSetup() {
  const [activeTab, setActiveTab] = useState<"customer" | "vendor" | "deliveryman">("customer");
  const [customerNotifications, setCustomerNotifications] = useState(customerMessages);
  const [vendorNotifications, setVendorNotifications] = useState(vendorMessages);
  const [deliverymanNotifications, setDeliverymanNotifications] = useState(deliverymanMessages);

  function toggleNotification(id: string) {
    if (activeTab === "customer") {
      setCustomerNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n)
      );
    } else if (activeTab === "vendor") {
      setVendorNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n)
      );
    } else {
      setDeliverymanNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n)
      );
    }
  }

  function updateMessage(id: string, message: string) {
    if (activeTab === "customer") {
      setCustomerNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, message } : n)
      );
    } else if (activeTab === "vendor") {
      setVendorNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, message } : n)
      );
    } else {
      setDeliverymanNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, message } : n)
      );
    }
  }

  const currentMessages = activeTab === "customer" 
    ? customerNotifications 
    : activeTab === "vendor" 
      ? vendorNotifications 
      : deliverymanNotifications;

  return (
    <div className="notifications-container">
      <div className="notification-tabs">
        <button
          className={activeTab === "customer" ? "active" : ""}
          onClick={() => setActiveTab("customer")}
        >
          Customer
        </button>
        <button
          className={activeTab === "vendor" ? "active" : ""}
          onClick={() => setActiveTab("vendor")}
        >
          Vendor
        </button>
        <button
          className={activeTab === "deliveryman" ? "active" : ""}
          onClick={() => setActiveTab("deliveryman")}
        >
          Deliveryman
        </button>
      </div>

      <div className="notifications-setup-card">
        <div className="setup-header">
          <div>
            <h3>Push Notification</h3>
            <p>Here you setup your all push notification.</p>
          </div>
          <button className="btn-view-guideline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            View Guideline
          </button>
        </div>

        <div className="notification-messages-grid">
          {currentMessages.map((notification) => (
            <div key={notification.id} className="notification-message-item">
              <div className="message-header">
                <span className="message-label">{notification.label}</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notification.enabled}
                    onChange={() => toggleNotification(notification.id)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <textarea
                value={notification.message}
                onChange={(e) => updateMessage(notification.id, e.target.value)}
                placeholder={`customize your ${notification.label.toLowerCase()}`}
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
