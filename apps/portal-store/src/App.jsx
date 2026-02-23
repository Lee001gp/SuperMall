import React, { useState } from 'react';
import AppShell from './layout/AppShell';
import SideNav from './layout/SideNav';
import './styles/tokens.css';
import './styles/theme.css';
import './styles/layout.css';
import DashboardPage from './pages/DashboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import HoursPage from './pages/HoursPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import PromotionsPage from './pages/PromotionsPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import ReviewsPage from './pages/ReviewsPage.jsx';

export default function App() {
  const [page, setPage] = useState('DashboardPage');
  const render = () => {
    if (page === 'DashboardPage') return <DashboardPage />;
    if (page === 'ProfilePage') return <ProfilePage />;
    if (page === 'HoursPage') return <HoursPage />;
    if (page === 'GalleryPage') return <GalleryPage />;
    if (page === 'PromotionsPage') return <PromotionsPage />;
    if (page === 'EventsPage') return <EventsPage />;
    if (page === 'MessagesPage') return <MessagesPage />;
    if (page === 'ReviewsPage') return <ReviewsPage />;
    return <div />;
  };

  const items = ['DashboardPage', 'ProfilePage', 'HoursPage', 'GalleryPage', 'PromotionsPage', 'EventsPage', 'MessagesPage', 'ReviewsPage'];

  return <AppShell><div className='portal-grid'><SideNav items={items} onPick={setPage} active={page} /><section className='portal-main'>{render()}</section></div></AppShell>;
}
