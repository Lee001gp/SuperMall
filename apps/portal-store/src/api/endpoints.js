/** Portal endpoint map. */
import { api } from './client';

export const endpoints = {
  analyticsDashboard: (days = 30) => api(`/admin/analytics/tenant?days=${encodeURIComponent(days)}`),
  analytics: () => api('/admin/analytics/tenant'),
  stores: () => api('/store-portal/me'),
  tenants: () => api('/platform/tenants'),
  reports: () => api('/mall-admin/reports'),
  crmContacts: () => api('/crm/contacts'),
  crmSegments: () => api('/crm/segments')
};
