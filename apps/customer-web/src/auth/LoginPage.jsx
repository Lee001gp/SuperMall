import React, { useState } from 'react';
import { endpoints } from '../api/endpoints';
import FormField from '../components/FormField';
import Button from '../components/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    try {
      const data = await endpoints.login({ email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    } catch (e) {
      setError(e.message);
    }
  };

  return <div><h2>Login</h2><FormField label='Email' value={email} onChange={(e) => setEmail(e.target.value)} /><FormField label='Password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} />{error && <p>{error}</p>}<Button onClick={submit}>Submit</Button></div>;
}
