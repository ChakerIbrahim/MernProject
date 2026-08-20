import { Navigate } from "react-router-dom";
import Spinner from "./Spinner";
import { useAuth } from "../functions/authContext";
import { dashboardPathFor } from "../functions/roles";

/**
 * FR-5.3 client mirror. Sends a user with the wrong role to their own
 * dashboard rather than rendering the screen even briefly. The server returns
 * 403 independently of anything this component does (FR-5.5).
 *
 * @param {string[]} roles
 */
const RequireRole = ({ roles, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner label="جاري التحقق من الصلاحيات…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={dashboardPathFor(user.role)} replace />;

  return children;
};

export default RequireRole;
