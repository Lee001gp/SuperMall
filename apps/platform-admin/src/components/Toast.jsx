/** Toast message component. */
import React from 'react';
export default function Toast({message}){ if(!message) return null; return <div style={{position:'fixed',top:16,right:16,background:'#111',color:'#fff',padding:'8px 12px',borderRadius:8}}>{message}</div>; }
