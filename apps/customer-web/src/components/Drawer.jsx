/** Right-side drawer panel. */
import React from 'react';
export default function Drawer({open, children}){ if(!open) return null; return <aside style={{position:'fixed',top:0,right:0,bottom:0,width:320,background:'#fff',borderLeft:'1px solid #ddd',padding:12,overflow:'auto'}}>{children}</aside>; }
