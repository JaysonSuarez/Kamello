/**
 * @file api.js
 * Cliente HTTP centralizado que se conecta al backend en el mismo servidor.
 */

const API_BASE = '/api/v1';

function getToken() {
  return localStorage.getItem('kamello_token');
}

export function setToken(token) {
  localStorage.setItem('kamello_token', token);
}

export function clearToken() {
  localStorage.removeItem('kamello_token');
}

export function isLoggedIn() {
  return !!getToken();
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    const message =
      typeof data?.error === 'string'
        ? data.error
        : data?.error?.message || data?.message || 'Error desconocido';
    const err = new Error(message);
    err.status = res.status;
    err.code = data?.error?.code;
    err.details = data?.error?.details || data?.details;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  sendOtp:     (body) => request('POST', '/auth/send-otp', body),
  verifyOtp:   (body) => request('POST', '/auth/verify-otp', body),
  getMe:       ()     => request('GET',  '/auth/me'),

  // Skills
  getCategories:  ()        => request('GET',    '/skills/categories'),
  getSkills:      ()        => request('GET',    '/skills/list'),
  getMySkills:    ()        => request('GET',    '/skills/my-skills'),
  addMySkill:     (body)    => request('POST',   '/skills/my-skills', body),
  deleteMySkill:  (skillId) => request('DELETE', `/skills/my-skills/${skillId}`),

  // Profiles
  getProfile:    ()     => request('GET', '/profiles/me'),
  updateProfile: (body) => request('PUT', '/profiles/me', body),

  getKamelladores: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    return request('GET', `/profiles/kamelladores${qs ? '?' + qs : ''}`);
  },

  // Operations
  getOps:        () => request('GET',   '/ops'),
  createOp:   (body) => request('POST',  '/ops', body),
  updateStatus: (id, status) => request('PATCH', `/ops/${id}/status`, { status }),
};
