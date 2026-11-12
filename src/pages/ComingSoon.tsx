import "../styles/ui-kit.css";
import "../styles/reports.css";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function ComingSoon({ 
  title = "Coming Soon", 
  description = "This feature is currently under development and will be available soon." 
}: ComingSoonProps) {
  return (
    <div className="reports-container">
      <div className="table-card" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "400px", padding: "40px" }}>
          {/* Animated Icon */}
          <div style={{
            width: "120px",
            height: "120px",
            margin: "0 auto 24px",
            background: "linear-gradient(135deg, var(--color-champagne-gold-light, #fef7ed) 0%, var(--color-champagne-gold, #d4a574) 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulse 2s ease-in-out infinite",
          }}>
            <svg 
              width="56" 
              height="56" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          {/* Title */}
          <h1 style={{
            margin: "0 0 12px",
            fontSize: "1.75rem",
            fontWeight: 600,
            color: "var(--text-strong)",
          }}>
            {title}
          </h1>

          {/* Description */}
          <p style={{
            margin: "0 0 24px",
            fontSize: "0.95rem",
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}>
            {description}
          </p>

          {/* Progress indicator */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--color-champagne-gold)",
              animation: "bounce 1.4s ease-in-out infinite",
              animationDelay: "0s",
            }} />
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--color-champagne-gold)",
              animation: "bounce 1.4s ease-in-out infinite",
              animationDelay: "0.2s",
            }} />
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--color-champagne-gold)",
              animation: "bounce 1.4s ease-in-out infinite",
              animationDelay: "0.4s",
            }} />
          </div>

          {/* CSS Animations */}
          <style>{`
            @keyframes pulse {
              0%, 100% {
                transform: scale(1);
                opacity: 1;
              }
              50% {
                transform: scale(1.05);
                opacity: 0.9;
              }
            }
            @keyframes bounce {
              0%, 80%, 100% {
                transform: translateY(0);
              }
              40% {
                transform: translateY(-8px);
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
