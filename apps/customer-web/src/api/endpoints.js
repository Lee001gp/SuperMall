/** Endpoint wrappers for customer workflows. */
import { api } from './client';

export const endpoints = {
  malls: () => api('/app/malls'),
  overview: (slug) => api(`/app/mall/${slug}/overview`),
  stores: (slug, query = '') => api(`/app/mall/${slug}/stores${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  store: (slug, storeSlug) => api(`/app/mall/${slug}/store/${storeSlug}`),
  distance: (slug, fromStoreId, toStoreId) => api(`/api/mall/${slug}/distance?fromStoreId=${encodeURIComponent(fromStoreId)}&toStoreId=${encodeURIComponent(toStoreId)}`),

  register: (payload) => api('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => api('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  refresh: (refreshToken) => api('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  logout: (refreshToken) => api('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  forgotPassword: (email) => api('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, newPassword) => api('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  joinTenant: (tenantId) => api('/auth/join-tenant', { method: 'POST', body: JSON.stringify({ tenantId }) }),

  posts: () => api('/social/posts'),
  createPost: ({ body, kind = 'post' }) => api('/social/posts', { method: 'POST', body: JSON.stringify({ body, kind }) }),
  likePost: (postId) => api(`/social/posts/${postId}/like`, { method: 'POST', body: '{}' }),
  commentOnPost: (postId, body) => api(`/social/posts/${postId}/comment`, { method: 'POST', body: JSON.stringify({ body }) }),
  sharePost: (postId) => api(`/social/posts/${postId}/share`, { method: 'POST', body: '{}' }),
  reportPost: (entityId, reason) => api('/social/reports', { method: 'POST', body: JSON.stringify({ entityType: 'post', entityId, reason }) }),

  messages: (slug) => api(`/app/mall/${slug}/messages`),
  replyToThread: (slug, threadId, body) => api(`/app/mall/${slug}/messages/${threadId}/reply`, { method: 'POST', body: JSON.stringify({ body }) }),

  parkingZones: (slug) => api(`/app/mall/${slug}/parking/zones`),
  saveCar: (slug, parkingZoneId, notes = '') => api(`/app/mall/${slug}/parking/save-car`, { method: 'POST', body: JSON.stringify({ parkingZoneId, notes }) }),
  findCar: (slug) => api(`/app/mall/${slug}/parking/find-car`),
};
