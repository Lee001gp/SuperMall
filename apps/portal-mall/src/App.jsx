import React,{useState} from 'react';
import AppShell from './layout/AppShell';
import SideNav from './layout/SideNav';
import './styles/tokens.css';
import './styles/theme.css';
import DashboardPage from './pages/DashboardPage.jsx';
import BrandingPage from './pages/BrandingPage.jsx';
import LayoutPage from './pages/LayoutPage.jsx';
import StoresPage from './pages/StoresPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';
import ModerationPage from './pages/ModerationPage.jsx';
import ParkingPage from './pages/ParkingPage.jsx';
import MapFloorsPage from './pages/MapFloorsPage.jsx';
import MapPoisPage from './pages/MapPoisPage.jsx';
import MapNodesPage from './pages/MapNodesPage.jsx';
import MapEdgesPage from './pages/MapEdgesPage.jsx';

export default function App(){
  const [page,setPage]=useState('DashboardPage');
  const render=()=>{
    if (page === 'DashboardPage') return <DashboardPage/>;
    if (page === 'BrandingPage') return <BrandingPage/>;
    if (page === 'LayoutPage') return <LayoutPage/>;
    if (page === 'StoresPage') return <StoresPage/>;
    if (page === 'VerificationPage') return <VerificationPage/>;
    if (page === 'ModerationPage') return <ModerationPage/>;
    if (page === 'ParkingPage') return <ParkingPage/>;
    if (page === 'MapFloorsPage') return <MapFloorsPage/>;
    if (page === 'MapPoisPage') return <MapPoisPage/>;
    if (page === 'MapNodesPage') return <MapNodesPage/>;
    if (page === 'MapEdgesPage') return <MapEdgesPage/>;
    return <div/>;
  };
  return <AppShell><div style={{display:'flex',gap:16}}><SideNav items=['DashboardPage','BrandingPage','LayoutPage','StoresPage','VerificationPage','ModerationPage','ParkingPage','MapFloorsPage','MapPoisPage','MapNodesPage','MapEdgesPage'] onPick={setPage}/><section style={{flex:1}}>{render()}</section></div></AppShell>;
}
