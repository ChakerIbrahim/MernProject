import { Navigate, useLocation } from "react-router-dom";
import Spinner from "./Spinner";
import { useAuth } from "../functions/authContext";

/**
 * FR-5.5 — redirects an unauthenticated visitor to the login page. This is a
 * usability measure only; enforcement rests with the server's isAuth (FR-5.1).
 */
const RequireAuth = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner label="جاري التحقق من الجلسة…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return children;
};

export default RequireAuth;
