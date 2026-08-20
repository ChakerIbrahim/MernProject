import { useEffect, useState } from "react";
import api from "../functions/api";
import { AuthContext } from "../functions/authContext";
import {
  clearToken,
  getStoredUser,
  getToken,
  saveToken,
  saveUser,
} from "../functions/auth";

/**
 * Owns the session. This is the one component allowed to fetch, because it is
 * a self-contained lifecycle rather than a reusable view (react-component
 * skill §1).
 *
 * `isLoading` is initialised true whenever a token already exists, so guards
 * render a spinner rather than the login page while GET /api/users/me is in
 * flight — a flash of the login screen on every refresh is the classic bug
 * here.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getToken);
  const [isLoading, setIsLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    // No token means isLoading was initialised false already; nothing to do.
    if (!getToken()) return undefined;

    let cancelled = false;

    const restoreSession = async () => {
      try {
        const res = await api.get("/api/users/me");
        if (cancelled) return;
        setUser(res.data.user);
        saveUser(res.data.user);
      } catch {
        // Token missing, forged, or belonging to a deleted account.
        if (cancelled) return;
        clearToken();
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Throws on failure so the page can render the server's own message. */
  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { user: nextUser, token: nextToken } = res.data;

    saveToken(nextToken);
    saveUser(nextUser);
    setToken(nextToken);
    setUser(nextUser);

    return nextUser;
  };

  /** FR-3.5 — discards the client-held token. */
  const logout = () => {
    clearToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
