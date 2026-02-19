import React, { useEffect, useState } from 'react';
import { endpoints } from '../api/endpoints';

export default function StoreDirectoryPage({ slug, onOpen, onDistanceSelect }) {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (slug) endpoints.stores(slug, query).then(setRows);
  }, [slug, query]);

  return <div><h2>Store Directory</h2><input value={query} placeholder='Search stores' onChange={(e) => setQuery(e.target.value)} />{rows.map((store) => <div key={store.id}><b>{store.name}</b> <small>{store.floor_label || 'N/A'}</small><button onClick={() => onOpen(store)}>Open</button><button onClick={() => onDistanceSelect(store)}>Set as distance target</button></div>)}</div>;
}
