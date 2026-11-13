/**
 * Native Fetch API client service
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function apiClient(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Content-Type': 'application/json'
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = errorBody;
    throw error;
  }

  return response.json();
}

