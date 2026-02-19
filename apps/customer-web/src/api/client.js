/** API client with tenant + token handling and request-id surfaced in errors. */
export async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const token = localStorage.getItem('accessToken');
  const tenantId = localStorage.getItem('tenantId');
  if (token) headers.Authorization = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  const res = await fetch(base + path, { ...opts, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} req:${res.headers.get('x-request-id')||'-'} ${await res.text()}`);
  return res.json();
}
