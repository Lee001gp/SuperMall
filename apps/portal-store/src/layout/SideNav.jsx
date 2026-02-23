import React from 'react';

export default function SideNav({ items, onPick, active }) {
  return <aside className='portal-sidenav'>{items.map((item) => <button key={item} className={`portal-nav-btn ${active === item ? 'is-active' : ''}`} onClick={() => onPick(item)}>{item.replace('Page', '')}</button>)}</aside>;
}
