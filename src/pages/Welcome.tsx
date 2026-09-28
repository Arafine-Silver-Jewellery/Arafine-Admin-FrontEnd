import { useAuth } from "../context/AuthContext";
import "../styles/welcome.css";

export default function Welcome() {
  const { employee } = useAuth();

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="welcome-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="80" height="80">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h1>Welcome, {employee?.firstName}!</h1>
        <p>You are logged in to the Arafine Admin Panel.</p>
        <p className="welcome-hint">
          Use the sidebar menu to navigate to your assigned screens.
        </p>
      </div>
    </div>
  );
}
