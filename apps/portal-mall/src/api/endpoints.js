/** Portal endpoint map. */
import { api } from './client';
export const endpoints = {
  analytics: () => api('/admin/analytics/tenant'),
  stores: () => api('/store-portal/me'),
  tenants: () => api('/platform/tenants'),
  reports: () => api('/mall-admin/reports')
};
