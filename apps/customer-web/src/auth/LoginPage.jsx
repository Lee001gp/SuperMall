/** LoginPage */
import React, { useState } from 'react';
import { api } from '../api/client';
import FormField from '../components/FormField';
import Button from '../components/Button';
export default function LoginPage(){ const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const submit=async()=>{
  if('LoginPage'==='RegisterPage') await api('/auth/register',{method:'POST',body:JSON.stringify({email,password,displayName:email})});
  if('LoginPage'==='LoginPage'){ const d=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})}); localStorage.setItem('accessToken',d.accessToken); localStorage.setItem('refreshToken',d.refreshToken); }
}; return <div><h2>Login</h2><FormField label='Email' value={email} onChange={e=>setEmail(e.target.value)} /><FormField label='Password' type='password' value={password} onChange={e=>setPassword(e.target.value)} /><Button onClick={submit}>Submit</Button></div>; }
