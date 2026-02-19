/** Session state hook for token lifecycle. */
import { useState } from 'react';
export function useSession(){ const [token,setToken]=useState(localStorage.getItem('accessToken')); const set=(t)=>{localStorage.setItem('accessToken',t); setToken(t)}; const clear=()=>{localStorage.removeItem('accessToken');localStorage.removeItem('refreshToken');setToken(null)}; return {token,setToken:set,clear}; }
