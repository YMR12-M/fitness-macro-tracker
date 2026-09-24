// HTTP client for the FitTrack API.
//
// Auth lives in httpOnly cookies, so nothing here touches tokens directly —
// `credentials: 'include'` is what carries the session. When an access token
// expires mid-session the client refreshes once and replays the request, so a
// user is never bounced to the login screen just because 15 minutes passed.

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  /** Field-keyed messages, for attaching errors to the inputs that caused them. */
  get fieldErrors() {
    if (!Array.isArray(this.details)) return {};
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

let refreshInFlight = null;

/** Refresh at most once even when several requests fail at the same moment. */
function refreshSession() {
  refreshInFlight ??= fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include'
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(response.status, 'The server returned a malformed response');
  }
}

async function send(path, { method = 'GET', body, signal, params } = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Cannot reach the server. Check your connection.');
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(response.status, payload?.error?.message ?? response.statusText, payload?.error?.details);
  }
  return payload;
}

// Endpoints where a 401 means "these credentials are wrong", not "this access
// token expired" — refreshing would be pointless, and refreshing /auth/refresh
// itself would recurse.
const NO_REFRESH_RETRY = ['/auth/refresh', '/auth/login', '/auth/register', '/auth/logout'];

async function request(path, options = {}) {
  try {
    return await send(path, options);
  } catch (error) {
    // A 401 from any other endpoint — /auth/me very much included — means the
    // short-lived access token lapsed while the refresh token is still good.
    // Refresh once and replay, so returning to a tab after 15 minutes does not
    // sign the user out of a session that is valid for 30 days.
    const canRetry = !NO_REFRESH_RETRY.some((prefix) => path.startsWith(prefix));
    if (error instanceof ApiError && error.status === 401 && canRetry) {
      if (await refreshSession()) return send(path, options);
    }
    throw error;
  }
}

export const api = {
  get: (path, params, signal) => request(path, { params, signal }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path, params, body) => request(path, { method: 'DELETE', params, body })
};
