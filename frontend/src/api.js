// Auth is provided via setAuthTokenGetter; no direct hook import needed here.

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Create a function to get auth token (will be called from components)
let getAuthToken = null;

export function setAuthTokenGetter(tokenGetter) {
  getAuthToken = tokenGetter;
}

export async function apiCall(path, options = {}) {
  const url = `${API_BASE}${path}`;
  
  // Get auth token if available
  const token = getAuthToken ? await getAuthToken() : null;
  
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    payload = { success: response.ok, data: text };
  }

  if (!response.ok || (payload && payload.success === false)) {
    const msg = payload?.error || payload?.message || `Request failed (${response.status})`;
    const err = new Error(msg);
    err.status = response.status;
    err.body = payload;
    throw err;
  }

  // Support both raw payloads and { success, data }
  return payload?.data !== undefined ? payload : payload;
}

export async function apiGet(path, params = {}) {
  const searchParams = new URLSearchParams(params);
  const queryString = searchParams.toString();
  const url = queryString ? `${path}?${queryString}` : path;
  return apiCall(url);
}

export async function apiPost(path, data) {
  return apiCall(path, {
    method: 'POST',
    body: data,
  });
}

export async function apiPut(path, data) {
  return apiCall(path, {
    method: 'PUT',
    body: data,
  });
}

export async function apiPatch(path, data) {
  return apiCall(path, {
    method: 'PATCH',
    body: data,
  });
}

export async function apiDelete(path) {
  return apiCall(path, {
    method: 'DELETE',
  });
}
