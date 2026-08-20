import { createContext, useContext } from "react";

/**
 * The context object and its hook, kept apart from the provider component so
 * that the component file exports only components (React Fast Refresh).
 *
 * Shape: { user, token, isLoading, login, logout }.
 */
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
