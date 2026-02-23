import React from 'react';
import TopBar from './TopBar';

export default function AppShell({ children }) {
  return <main className='portal-shell'><TopBar />{children}</main>;
}
