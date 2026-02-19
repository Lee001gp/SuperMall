import React, { useState } from 'react';
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
import ParkingPage from './pages/ParkingPage';
import MessagesPage from './pages/MessagesPage';
import { endpoints } from './api/endpoints';

export default function App() {
  const [route, setRoute] = useState('malls');
  const [mall, setMall] = useState(null);
  const [store, setStore] = useState(null);
  const [distanceFrom, setDistanceFrom] = useState(null);
  const [distanceTo, setDistanceTo] = useState(null);
  const [distance, setDistance] = useState(null);

  const calculateDistance = async () => {
    if (!mall || !distanceFrom || !distanceTo) return;
    const result = await endpoints.distance(mall.slug, distanceFrom.id, distanceTo.id);
    setDistance(result);
  };

  return <AuthProvider><AppShell><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button onClick={() => setRoute('login')}>Login</button><button onClick={() => setRoute('register')}>Register</button><button onClick={() => setRoute('forgot')}>Forgot</button><button onClick={() => setRoute('reset')}>Reset</button><button onClick={() => setRoute('malls')}>Malls</button><button onClick={() => setRoute('social')}>Social</button><button onClick={() => setRoute('parking')}>Parking</button><button onClick={() => setRoute('messages')}>Messages</button></div>{route === 'login' && <LoginPage />}{route === 'register' && <RegisterPage />}{route === 'forgot' && <ForgotPasswordPage />}{route === 'reset' && <ResetPasswordPage />}{route === 'malls' && <MallDiscoveryPage onSelect={(m) => { setMall(m); localStorage.setItem('tenantId', m.id); setRoute('mall'); }} />}{route === 'mall' && <MallDetailPage slug={mall?.slug} />}{route === 'stores' && <StoreDirectoryPage slug={mall?.slug} onOpen={(selectedStore) => { setStore(selectedStore); setRoute('store'); }} onDistanceSelect={(selectedStore) => {
    if (!distanceFrom) setDistanceFrom(selectedStore);
    else setDistanceTo(selectedStore);
  }} />}{route === 'store' && <StoreDetailPage slug={mall?.slug} storeSlug={store?.slug} />}{route === 'social' && <SocialPage />}{route === 'parking' && <ParkingPage slug={mall?.slug} />}{route === 'messages' && <MessagesPage slug={mall?.slug} />}{mall && <div><button onClick={() => setRoute('stores')}>Open Stores</button><button onClick={calculateDistance}>Calculate distance between selected stores</button>{distance && <p>Distance: {distance.distance}m (~{distance.etaMinutes} min)</p>}</div>}</AppShell></AuthProvider>;
}
