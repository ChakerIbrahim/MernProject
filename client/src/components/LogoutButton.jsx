import { useNavigate } from "react-router-dom";
import Button from "./Button";
import { useAuth } from "../functions/authContext";

/**
 * FR-3.5 — discards the client-held token.
 *
 * Navigates to /login rather than /: clearing the user makes RequireAuth
 * redirect to /login on the same tick anyway, so sending the user anywhere
 * else here only creates a race the guard always wins.
 */
const LogoutButton = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Button variant="secondary" onClick={handleLogout}>
      تسجيل الخروج
    </Button>
  );
};

export default LogoutButton;
