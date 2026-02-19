import React, { useState } from 'react';
import { endpoints } from '../api/endpoints';
import FormField from '../components/FormField';
import Button from '../components/Button';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');

  const submit = async () => {
    setMessage('');
    try {
      await endpoints.register({ email, password, displayName: displayName || email });
      setMessage('Registered. You can login now.');
    } catch (e) {
      setMessage(e.message);
    }
  };

  return <div><h2>Register</h2><FormField label='Display name' value={displayName} onChange={(e) => setDisplayName(e.target.value)} /><FormField label='Email' value={email} onChange={(e) => setEmail(e.target.value)} /><FormField label='Password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} />{message && <p>{message}</p>}<Button onClick={submit}>Submit</Button></div>;
}
