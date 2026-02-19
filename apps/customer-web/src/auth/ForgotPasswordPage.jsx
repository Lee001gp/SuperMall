import React, { useState } from 'react';
import { endpoints } from '../api/endpoints';
import FormField from '../components/FormField';
import Button from '../components/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');

  const submit = async () => {
    const data = await endpoints.forgotPassword(email);
    setToken(data.resetToken || 'If account exists, token is generated.');
  };

  return <div><h2>Forgot password</h2><FormField label='Email' value={email} onChange={(e) => setEmail(e.target.value)} />{token && <p>Reset token: {token}</p>}<Button onClick={submit}>Request reset token</Button></div>;
}
