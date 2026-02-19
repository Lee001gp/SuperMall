/** Mobile bottom sheet for grouped actions. */
import React from 'react';
export default function BottomSheet({open, children}){ if(!open) return null; return <div style={{position:'fixed',left:0,right:0,bottom:0,background:'#fff',borderTop:'1px solid #ddd',padding:12,borderTopLeftRadius:12,borderTopRightRadius:12}}>{children}</div>; }
