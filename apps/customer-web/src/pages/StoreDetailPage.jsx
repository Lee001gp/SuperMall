import React, { useEffect, useState } from 'react';
import { endpoints } from '../api/endpoints';

export default function StoreDetailPage({ slug, storeSlug }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (slug && storeSlug) endpoints.store(slug, storeSlug).then(setData);
  }, [slug, storeSlug]);

  if (!data) return <p>Loading store...</p>;

  return <div><h2>{data.name}</h2><p>{data.description}</p><p>Hours: {data.hours.length}</p><p>Contacts: {data.contacts.length}</p><p>Gallery: {data.gallery.length}</p><p>Promotions: {data.promotions.length}</p><p>Reviews: {data.reviews.length}</p><p>Social posts: {data.social.length}</p></div>;
}
