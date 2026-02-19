import React,{useEffect,useState} from 'react';
import Card from '../components/Card';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { endpoints } from '../api/endpoints';
export default function PromotionsPage(){
  const [rows,setRows]=useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{ endpoints.analytics().then((d)=>setRows(Array.isArray(d)?d:[])).catch(()=>setRows([])).finally(()=>setLoading(false)); },[]);
  if(loading) return <LoadingSkeleton/>;
  if(!rows.length) return <EmptyState message='No records yet'/>;
  return <Card><h2>PromotionsPage</h2><div>{rows.slice(0,5).map((r,i)=><div key={i}>{JSON.stringify(r)}</div>)}</div></Card>;
}
