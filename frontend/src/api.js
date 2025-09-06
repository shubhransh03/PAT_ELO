// Centralized Axios client with interceptors and auth token injection.
import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const IS_TEST = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

// Auth token getter injected by AuthProvider
let getAuthToken = null;
export function setAuthTokenGetter(tokenGetter) {
  getAuthToken = tokenGetter;
}

// Create Axios instance
export const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  // Optionally set a short timeout; adjust if needed
  timeout: 20000,
});

// Request interceptor: attach Authorization and any dynamic headers
http.interceptors.request.use(async (config) => {
  try {
    if (getAuthToken) {
      const token = await getAuthToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

// Response interceptor: normalize success/error shape and emit toasts on 401/403
http.interceptors.response.use(
  (response) => {
    // Pass through; most routes return { success, data, ... }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const payload = error?.response?.data;
    const message = payload?.error || payload?.message || error?.message || 'Request failed';
    // Global toast (best-effort; listener installed by ToastProvider)
    try {
      if (status === 401) window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', message: 'Please sign in to continue.' } }));
      if (status === 403) window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', message: 'You don\'t have permission to perform this action.' } }));
    } catch {}
    const err = new Error(message);
    err.status = status;
    err.body = payload;
    return Promise.reject(err);
  }
);

// Helper that keeps prior API shape compatibility: return parsed JSON payload
async function handleResponse(promise) {
  const res = await promise;
  const data = res?.data;
  // Keep returning the full payload (which includes success/data/pagination) to avoid breaking callers
  return data;
}

// In test environment, use fetch so unit tests can mock global.fetch without CORS issues
async function fetchRequest(method, path, { params, data } = {}) {
  // Build URL relative to API_BASE to preserve includes('/api/...') in tests
  let url;
  try {
    url = new URL(path, API_BASE);
  } catch {
    url = new URL(String(path), API_BASE);
  }
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      url.searchParams.set(k, String(v));
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  try {
    if (getAuthToken) {
      const token = await getAuthToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
  } catch {}

  const res = await fetch(url.toString(), {
    method,
    headers,
    credentials: 'include',
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });

  const ct = res.headers?.get?.('content-type') || '';
  const isJson = ct.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const message = (payload && (payload.error || payload.message)) || 'Network Error';
    const err = new Error(message);
    err.status = res.status;
    err.body = payload;
    throw err;
  }
  return payload;
}

export async function apiGet(path, params = {}) {
  if (IS_TEST) return fetchRequest('GET', path, { params });
  return handleResponse(http.get(path, { params }));
}

export async function apiPost(path, data) {
  if (IS_TEST) return fetchRequest('POST', path, { data });
  return handleResponse(http.post(path, data));
}

export async function apiPut(path, data) {
  if (IS_TEST) return fetchRequest('PUT', path, { data });
  return handleResponse(http.put(path, data));
}

export async function apiPatch(path, data) {
  if (IS_TEST) return fetchRequest('PATCH', path, { data });
  return handleResponse(http.patch(path, data));
}

export async function apiDelete(path) {
  if (IS_TEST) return fetchRequest('DELETE', path);
  return handleResponse(http.delete(path));
}
