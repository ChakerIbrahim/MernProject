const configuredOrigin = import.meta.env.VITE_API_URL;

// An empty VITE_API_URL intentionally means same-origin production requests.
export const API_ORIGIN = (configuredOrigin === undefined
  ? 'http://localhost:8000'
  : configuredOrigin
).replace(/\/$/, '');

export function backendUrl(path = '') {
  if (!path) return API_ORIGIN;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
