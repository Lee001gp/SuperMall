import React, { useEffect, useState } from 'react';
import { endpoints } from '../api/endpoints';

export default function MessagesPage({ slug }) {
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState('');
  const [body, setBody] = useState('');

  const load = async () => {
    if (slug) {
      const rows = await endpoints.messages(slug);
      setThreads(rows);
      setActive(rows[0]?.thread_id || '');
    }
  };

  useEffect(() => { load(); }, [slug]);

  const reply = async () => {
    await endpoints.replyToThread(slug, active, body);
    setBody('');
    await load();
  };

  return <div><h2>Messages</h2>{threads.map((t) => <div key={t.thread_id}><button onClick={() => setActive(t.thread_id)}>Thread {t.thread_id.slice(0, 6)}</button> <small>{t.last_message || 'No messages yet'}</small></div>)}{active && <div><input value={body} onChange={(e) => setBody(e.target.value)} placeholder='Reply' /><button onClick={reply}>Send</button></div>}</div>;
}
