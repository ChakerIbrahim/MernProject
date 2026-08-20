/**
 * The only module that touches auth storage. Nothing else may read or write
 * these keys directly.
 *
 * The cached user is a rendering hint so the shell can paint immediately after
 * a reload. It authorises nothing: the server re-derives the role from the
 * verified token on every request (FR-5.4, NFR-S6), and AuthContext confirms
 * the session against GET /api/users/me before any guard decides anything.
 */
const TOKEN_KEY = "procurement.token";
const USER_KEY = "procurement.user";

export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const saveUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** FR-3.5 — logout discards the client-held token. */
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
