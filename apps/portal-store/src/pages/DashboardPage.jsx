import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { endpoints } from '../api/endpoints';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    endpoints.analyticsDashboard(30)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <EmptyState message='Analytics unavailable' />;

  return <Card>
    <h2 style={{ marginTop: 0 }}>Store Analytics Dashboard</h2>
    <div className='kpi-grid'>
      <div className='kpi-card'><div className='kpi-label'>Total Events (30d)</div><div className='kpi-value'>{data.summary?.totalEvents || 0}</div></div>
      <div className='kpi-card'><div className='kpi-label'>Active Days</div><div className='kpi-value'>{data.summary?.uniqueDays || 0}</div></div>
      <div className='kpi-card'><div className='kpi-label'>Avg / Day</div><div className='kpi-value'>{data.summary?.avgPerDay || 0}</div></div>
    </div>

    <h3>Top Events</h3>
    {!data.topEvents?.length ? <EmptyState message='No top events yet' /> : <ul>{data.topEvents.map((eventRow) => <li key={eventRow.metricName}>{eventRow.metricName}: {eventRow.total}</li>)}</ul>}

    <h3>CRM Contacts</h3>
    <ContactsPreview />
  </Card>;
}

function ContactsPreview() {
  const [contacts, setContacts] = useState([]);
  useEffect(() => { endpoints.crmContacts().then(setContacts).catch(() => setContacts([])); }, []);
  if (!contacts.length) return <p>No contacts yet.</p>;
  return <div>{contacts.slice(0, 5).map((contact) => <div key={contact.id}>{contact.display_name} · views {contact.store_views} · redemptions {contact.redemptions}</div>)}</div>;
}
