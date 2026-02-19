/** Customer app with live API wiring and expandable button-driven UX. */
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

const API = 'http://localhost:4000';

async function api(path, opts = {}) {
  const token = localStorage.getItem('accessToken');
  const tenantId = localStorage.getItem('tenantId');
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function AuthPanel({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return <div><h3>Auth</h3><input placeholder='email' value={email} onChange={e=>setEmail(e.target.value)} /><input placeholder='password' type='password' value={password} onChange={e=>setPassword(e.target.value)} /><button onClick={async()=>{await api('/auth/register',{method:'POST',body:JSON.stringify({email,password,displayName:email})});alert('registered');}}>Register</button><button onClick={async()=>{const d=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});localStorage.setItem('accessToken',d.accessToken);localStorage.setItem('refreshToken',d.refreshToken);onAuth();}}>Login</button></div>;
}

function App() {
  const [malls, setMalls] = useState([]);
  const [selected, setSelected] = useState(localStorage.getItem('mallSlug') || '');
  const [overview, setOverview] = useState(null);
  const [stores, setStores] = useState([]);
  const [store, setStore] = useState(null);
  const [route, setRoute] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(()=>{ api('/app/malls').then(setMalls).catch(()=>{}); },[]);
  useEffect(()=>{ if(!selected) return; const tenant = malls.find(m=>m.slug===selected)?.id; if(tenant) localStorage.setItem('tenantId', tenant); localStorage.setItem('mallSlug', selected); api(`/app/mall/${selected}/overview`).then(setOverview).catch(()=>{}); api(`/app/mall/${selected}/stores`).then(setStores).catch(()=>{}); api('/social/posts').then(setPosts).catch(()=>{}); },[selected,malls]);

  const nav = useMemo(()=>['Home','Explore','Map','Specials','Social','More'],[]);

  return <main style={{fontFamily:'Inter, sans-serif',padding:16,maxWidth:1000,margin:'0 auto'}}>
    <h1>Customer App</h1>
    <AuthPanel onAuth={()=>setSelected(selected)} />
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <button onClick={()=>setFilterOpen(!filterOpen)}>Filter</button>
      {malls.map(m=><button key={m.id} onClick={()=>setSelected(m.slug)}>{m.name}</button>)}
    </div>
    {filterOpen && <section style={{border:'1px solid #ddd',padding:10,borderRadius:10,marginTop:8}}><strong>Filter Sheet</strong><div><button>Open now</button><button>Nearby</button><button>Categories</button></div></section>}
    {overview && <section><h2>Mall Detail</h2><p>Floors {overview.mapPreview.floors} • POIs {overview.mapPreview.pois}</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{['Stores','Map','Parking','Specials','Events','Social'].map(x=><button key={x}>{x}</button>)}</div></section>}
    <section><h2>Stores</h2>{stores.map(s=><div key={s.id} style={{border:'1px solid #ddd',padding:8,margin:'8px 0',borderRadius:8}}><b>{s.name}</b> {s.is_verified?'✅':''}<button onClick={async()=>setStore(await api(`/app/mall/${selected}/store/${s.slug}`))}>Open</button></div>)}</section>
    {store && <section><h2>{store.name}</h2><p>{store.description}</p><button onClick={async()=>{const dest=stores.find(s=>s.id!==store.id);if(!dest)return;setRoute(await api(`/api/mall/${selected}/distance?fromStoreId=${store.id}&toStoreId=${dest.id}`));}}>Walking distance to another store</button>{route && <p>{route.distance}m • {route.etaMinutes} min</p>}</section>}
    {overview && <section><h2>Parking</h2><button onClick={async()=>{if(!overview.parkingSummary[0]) return; await api(`/app/mall/${selected}/parking/save-car`,{method:'POST',body:JSON.stringify({parkingZoneId:overview.parkingSummary[0].id,notes:'near pillar'})}); alert('saved');}}>Save Car</button><button onClick={async()=>alert(JSON.stringify(await api(`/app/mall/${selected}/parking/find-car`)))}>Find Car</button></section>}
    <section><h2>Social</h2><button onClick={async()=>{const body=prompt('Post text'); if(!body) return; await api('/social/posts',{method:'POST',body:JSON.stringify({body})}); setPosts(await api('/social/posts'));}}>Create Post</button>{posts.map(p=><div key={p.id} style={{border:'1px solid #ddd',marginTop:6,padding:6}}>{p.body}<div><button onClick={()=>api(`/social/posts/${p.id}/like`,{method:'POST'})}>Like</button><button onClick={()=>api(`/social/posts/${p.id}/comment`,{method:'POST',body:JSON.stringify({body:'Nice'})})}>Comment</button><button onClick={()=>api(`/social/posts/${p.id}/share`,{method:'POST'})}>Share</button><button onClick={()=>api('/social/reports',{method:'POST',body:JSON.stringify({entityType:'post',entityId:p.id,reason:'spam'})})}>Report</button></div></div>)}</section>
    <nav style={{position:'fixed',left:12,right:12,bottom:12,display:'flex',justifyContent:'space-around',background:'#fff',border:'1px solid #ddd',borderRadius:12,padding:8}}>{nav.map(n=><button key={n}>{n}</button>)}</nav>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
