/** Protects pages that require authenticated session. */
import React from 'react';
import { useAuth } from './AuthProvider';
export default function RequireAuth({children}){ const {token}=useAuth(); if(!token) return <p>Please login.</p>; return children; }
