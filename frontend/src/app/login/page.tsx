'use client';

import React, { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../api';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [error, setError] = useState('');

  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', {
        username,
        password,
        totp_code: totpCode || null,
      });

      if (res.data.two_factor_required) {
        setTwoFactorRequired(true);
        return;
      }

      const token = res.data.access_token;
      localStorage.setItem('token', token);

      // Decode or mock user details
      const user = {
        id: 'mock_user_id',
        username,
        role: username === 'admin' ? 'admin' : 'client',
        is_verified: true,
        reliability_level: 'verified',
        two_factor_enabled: twoFactorRequired,
      };

      setAuth(user, token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white border border-gray-100 p-8 rounded-3xl shadow-sm mt-12">
        <h1 className="text-3xl font-black text-gray-900 mb-6">Welcome Back</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Username</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Password</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {twoFactorRequired && (
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">2FA TOTP Code</label>
              <input
                type="text"
                placeholder="123456"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-center tracking-widest font-black"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
              />
            </div>
          )}

          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm">
            Sign In
          </button>
        </form>
      </div>
    </Layout>
  );
}
