/** Store portal with live CRUD and analytics wiring. */
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const API='http://localhost:4000';
async function api(path, opts={}){const t=localStorage.getItem('accessToken');const tenant=localStorage.getItem('tenantId');const h={...(opts.headers||{})};if(t)h.Authorization=`Bearer ${t}`;if(tenant)h['X-Tenant-ID']=tenant;const r=await fetch(API+path,{...opts,headers:h});if(!r.ok)throw new Error(await r.text());return r.json();}

function App(){
  const [stores,setStores]=useState([]); const [selected,setSelected]=useState(null); const [promos,setPromos]=useState([]); const [events,setEvents]=useState([]); const [reviews,setReviews]=useState([]); const [analytics,setAnalytics]=useState([]);
  useEffect(()=>{api('/store-portal/me').then(s=>{setStores(s);if(s[0])setSelected(s[0]);}).catch(()=>{});},[]);
  useEffect(()=>{if(!selected)return;api(`/app/mall/${localStorage.getItem('mallSlug')}/store/${selected.slug}`).then(d=>{setPromos(d.promotions||[]);setReviews(d.reviews||[]);});api('/admin/analytics/tenant').then(setAnalytics).catch(()=>{});},[selected]);
  return <main style={{fontFamily:'Inter,sans-serif',padding:16}}><h1>Store Portal</h1><div>{stores.map(s=><button key={s.id} onClick={()=>setSelected(s)}>{s.name}</button>)}</div>{selected&&<section><h3>Profile</h3><input defaultValue={selected.name} onBlur={e=>api(`/store-portal/stores/${selected.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:e.target.value,description:selected.description||'',floorLabel:selected.floor_label||''})})}/><button onClick={()=>api(`/store-portal/stores/${selected.id}/hours`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({weekday:1,openAt:'09:00',closeAt:'21:00'})})}>Add Hours</button><button onClick={()=>api(`/store-portal/stores/${selected.id}/contacts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'phone',value:'+1'})})}>Add Contact</button></section>}
  {selected&&<section><h3>Promotions</h3><button onClick={async()=>{await api('/store-portal/promotions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({storeId:selected.id,title:'Flash',promoCode:'FLASH',startsAt:new Date().toISOString(),endsAt:new Date(Date.now()+86400000).toISOString()})});const d=await api(`/app/mall/${localStorage.getItem('mallSlug')}/store/${selected.slug}`);setPromos(d.promotions||[]);}}>Create</button>{promos.map(p=><div key={p.id}>{p.title}<button onClick={()=>api(`/store-portal/promotions/${p.id}`,{method:'DELETE'})}>Delete</button></div>)}</section>}
  {selected&&<section><h3>Events</h3><button onClick={async()=>{const e=await api('/store-portal/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({storeId:selected.id,title:'Store Event',startsAt:new Date().toISOString()})});setEvents([...events,e]);}}>Create Event</button></section>}
  {selected&&<section><h3>Reviews</h3>{reviews.map(r=><div key={r.id}>{r.body}<button onClick={()=>api(`/store-portal/reviews/${r.id}/respond`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({body:'Thanks'})})}>Respond</button></div>)}</section>}
  <section><h3>Analytics</h3><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>{analytics.slice(0,6).map((a,i)=><div key={i} style={{border:'1px solid #ddd',padding:8}}><b>{a.metric_name}</b><div>{a.metric_value}</div></div>)}</div></section>
  </main>
}
createRoot(document.getElementById('root')).render(<App/>);
