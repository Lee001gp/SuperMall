/** Endpoint wrappers for customer workflows. */
import { api } from './client';
export const endpoints = {
  malls: () => api('/app/malls'),
  overview: (slug) => api(`/app/mall/${slug}/overview`),
  stores: (slug) => api(`/app/mall/${slug}/stores`),
  store: (slug, storeSlug) => api(`/app/mall/${slug}/store/${storeSlug}`),
  posts: () => api('/social/posts'),
};
