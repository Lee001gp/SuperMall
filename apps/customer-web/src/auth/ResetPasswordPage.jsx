import React, { useState } from 'react';
import { endpoints } from '../api/endpoints';
import FormField from '../components/FormField';
import Button from '../components/Button';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const submit = async () => {
    setMessage('');
    try {
      await endpoints.resetPassword(token, newPassword);
      setMessage('Password reset complete.');
    } catch (e) {
      setMessage(e.message);
    }
  };

  return <div><h2>Reset password</h2><FormField label='Reset token' value={token} onChange={(e) => setToken(e.target.value)} /><FormField label='New password' type='password' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />{message && <p>{message}</p>}<Button onClick={submit}>Reset</Button></div>;
}
