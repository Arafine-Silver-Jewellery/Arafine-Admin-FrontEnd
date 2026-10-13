import "../styles/ui-kit.css";

interface EmptyStateProps {
  icon?: "search" | "box" | "file" | "users" | "cart" | "bell" | "folder" | "image" | "custom";
  customIcon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  className?: string;
}

const icons = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  cart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21,15 16,10 5,21" />
    </svg>
  ),
};

export default function EmptyState({
  icon = "box",
  customIcon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  if (icon === "custom" && customIcon) {
    return (
      <div className={`ak-empty ${className}`}>
        <div className="ak-empty__icon">{customIcon}</div>
        <h3 className="ak-empty__title">{title}</h3>
        {description && <p className="ak-empty__desc">{description}</p>}
        {action && (
          <button
            type="button"
            className={`ak-btn ${action.variant === "secondary" ? "ak-btn--secondary" : "ak-btn--primary"} ak-empty__action`}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }
  
  const iconElement = icons[icon as keyof typeof icons];
  
  return (
    <div className={`ak-empty ${className}`}>
      <div className="ak-empty__icon">
        {iconElement}
      </div>
      <h3 className="ak-empty__title">{title}</h3>
      {description && <p className="ak-empty__desc">{description}</p>}
      {action && (
        <button
          type="button"
          className={`ak-btn ${action.variant === "secondary" ? "ak-btn--secondary" : "ak-btn--primary"} ak-empty__action`}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
