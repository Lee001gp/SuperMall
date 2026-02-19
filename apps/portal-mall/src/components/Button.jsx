/** Reusable button component. */
import React from 'react';
export default function Button({children, ...props}){ return <button {...props} style={{padding:'8px 12px',borderRadius:8,border:'1px solid #d1d5db'}}>{children}</button>; }
