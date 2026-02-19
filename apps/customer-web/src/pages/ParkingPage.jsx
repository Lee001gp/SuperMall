import React, { useEffect, useState } from 'react';
import { endpoints } from '../api/endpoints';

export default function ParkingPage({ slug }) {
  const [zones, setZones] = useState([]);
  const [selected, setSelected] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    if (slug) endpoints.parkingZones(slug).then((rows) => {
      setZones(rows);
      setSelected(rows[0]?.id || '');
    });
  }, [slug]);

  const save = async () => {
    await endpoints.saveCar(slug, selected, notes);
    const found = await endpoints.findCar(slug);
    setSaved(found);
  };

  const refresh = async () => {
    const found = await endpoints.findCar(slug);
    setSaved(found);
  };

  return <div><h2>Parking</h2><select value={selected} onChange={(e) => setSelected(e.target.value)}>{zones.map((z) => <option key={z.id} value={z.id}>{z.zone_code} ({z.level_label})</option>)}</select><input value={notes} placeholder='Notes' onChange={(e) => setNotes(e.target.value)} /><button onClick={save}>Save car</button><button onClick={refresh}>Find car</button>{saved && <p>Last parked: {saved.zone_code} ({saved.level_label}) {saved.notes || ''}</p>}</div>;
}
