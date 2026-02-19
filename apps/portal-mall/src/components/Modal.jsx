/** Lightweight modal wrapper. */
import React from 'react';
export default function Modal({open, children}){ if(!open) return null; return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',padding:40}}><div style={{background:'#fff',padding:16,borderRadius:12,maxWidth:500,margin:'0 auto'}}>{children}</div></div>; }
