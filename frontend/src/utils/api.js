const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export function apiUrl(path = "") {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function assetUrl(path = "") {
  if (!path) return path;
  if (/^https?:\/\//i.test(path) || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }
  if (path.startsWith("/api") || path.startsWith("/uploads")) {
    return apiUrl(path);
  }
  return path;
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}
