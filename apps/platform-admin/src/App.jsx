import React,{useState} from 'react';
import AppShell from './layout/AppShell';
import SideNav from './layout/SideNav';
import './styles/tokens.css';
import './styles/theme.css';
import DashboardPage from './pages/DashboardPage.jsx';
import TenantsPage from './pages/TenantsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import StoresPage from './pages/StoresPage.jsx';
import ModerationPage from './pages/ModerationPage.jsx';
import ImpersonationPage from './pages/ImpersonationPage.jsx';

export default function App(){
  const [page,setPage]=useState('DashboardPage');
  const render=()=>{
    if (page === 'DashboardPage') return <DashboardPage/>;
    if (page === 'TenantsPage') return <TenantsPage/>;
    if (page === 'UsersPage') return <UsersPage/>;
    if (page === 'StoresPage') return <StoresPage/>;
    if (page === 'ModerationPage') return <ModerationPage/>;
    if (page === 'ImpersonationPage') return <ImpersonationPage/>;
    return <div/>;
  };
  return <AppShell><div style={{display:'flex',gap:16}}><SideNav items=['DashboardPage','TenantsPage','UsersPage','StoresPage','ModerationPage','ImpersonationPage'] onPick={setPage}/><section style={{flex:1}}>{render()}</section></div></AppShell>;
}
