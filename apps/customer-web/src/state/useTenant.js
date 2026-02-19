/** Tenant selection hook shared by customer pages. */
import { useState } from 'react';
export function useTenant(){ const [tenant,setTenant]=useState(localStorage.getItem('tenantId')); const [slug,setSlug]=useState(localStorage.getItem('mallSlug')); const save=(id,s)=>{localStorage.setItem('tenantId',id);localStorage.setItem('mallSlug',s);setTenant(id);setSlug(s);}; return {tenant,slug,setTenant:save}; }
