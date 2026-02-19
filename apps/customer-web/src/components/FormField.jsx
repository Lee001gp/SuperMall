/** Input field with inline label. */
import React from 'react';
export default function FormField({label, ...props}){ return <label style={{display:'block',marginBottom:8}}><div style={{fontSize:12,color:'#555'}}>{label}</div><input {...props} style={{width:'100%',padding:8,border:'1px solid #d1d5db',borderRadius:8}} /></label>; }
