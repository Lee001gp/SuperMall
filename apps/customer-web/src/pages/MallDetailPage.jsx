import React, { useEffect, useState } from 'react';
import { endpoints } from '../api/endpoints';

export default function MallDetailPage({ slug }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (slug) endpoints.overview(slug).then(setData);
  }, [slug]);

  if (!data) return <p>Loading mall...</p>;

  return <div><h2>Mall Overview</h2><p>Featured stores: {data.featuredStores?.length || 0}</p><p>Specials: {data.specials?.length || 0}</p><p>Events: {data.events?.length || 0}</p><p>Social highlights: {data.socialHighlights?.length || 0}</p><p>Map floors: {data.mapPreview?.floors || 0}</p><p>Parking zones: {data.parkingSummary?.length || 0}</p></div>;
}
