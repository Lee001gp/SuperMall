/** Customer app router with API-driven pages and auth area. */
import React,{useState} from 'react';
import AppShell from './layout/AppShell';
import { AuthProvider } from './auth/AuthProvider';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import ResetPasswordPage from './auth/ResetPasswordPage';
import MallDiscoveryPage from './pages/MallDiscoveryPage';
import MallDetailPage from './pages/MallDetailPage';
import StoreDirectoryPage from './pages/StoreDirectoryPage';
import StoreDetailPage from './pages/StoreDetailPage';
import SocialPage from './pages/SocialPage';

export default function App(){
  const [route,setRoute]=useState('malls');
  const [mall,setMall]=useState(null);
  const [store,setStore]=useState(null);
  return <AuthProvider><AppShell>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <button onClick={()=>setRoute('login')}>Login</button><button onClick={()=>setRoute('register')}>Register</button><button onClick={()=>setRoute('forgot')}>Forgot</button><button onClick={()=>setRoute('reset')}>Reset</button><button onClick={()=>setRoute('malls')}>Malls</button><button onClick={()=>setRoute('social')}>Social</button>
    </div>
    {route==='login'&&<LoginPage/>}
    {route==='register'&&<RegisterPage/>}
    {route==='forgot'&&<ForgotPasswordPage/>}
    {route==='reset'&&<ResetPasswordPage/>}
    {route==='malls'&&<MallDiscoveryPage onSelect={(m)=>{setMall(m);setRoute('mall')}}/>}
    {route==='mall'&&<MallDetailPage slug={mall?.slug}/>} 
    {route==='stores'&&<StoreDirectoryPage slug={mall?.slug} onOpen={(s)=>{setStore(s);setRoute('store')}}/>}
    {route==='store'&&<StoreDetailPage slug={mall?.slug} storeSlug={store?.slug}/>} 
    {route==='social'&&<SocialPage/>}
    {mall && route==='mall' && <button onClick={()=>setRoute('stores')}>Open Stores</button>}
  </AppShell></AuthProvider>;
}
