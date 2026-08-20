import axios from "axios";
import { getToken } from "./auth";

/**
 * The one axios instance for the whole client. Every page and context imports
 * this — never raw axios, or the Authorization header goes missing.
 *
 * The token travels in the header, not a cookie: SRS §4.2 returns it in the
 * login response body and SPRINT_PLAN.md §6 rules out httpOnly cookies.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

/** Absolute URL for a stored upload, e.g. "/uploads/17…-ab.pdf" (L-4). */
export const fileUrl = (storedPath) =>
  storedPath ? `${import.meta.env.VITE_API_URL}${storedPath}` : "";
