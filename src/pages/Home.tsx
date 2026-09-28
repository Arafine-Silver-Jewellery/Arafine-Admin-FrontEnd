import { useAuth } from "../context/AuthContext";
import Dashboard from "./Dashboard";
import Welcome from "./Welcome";

/**
 * Home page that shows Dashboard if user has permission,
 * otherwise shows a Welcome page
 */
export default function Home() {
  const { hasPermission } = useAuth();

  if (hasPermission("dashboard")) {
    return <Dashboard />;
  }

  return <Welcome />;
}
