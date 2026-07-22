'use client';

import React, { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../api';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        username,
        password,
        totp_code: totpCode || null,
      });

      if (res.data.two_factor_required) {
        setTwoFactorRequired(true);
        setLoading(false);
        return;
      }

      const token = res.data.access_token;
      localStorage.setItem('token', token);

      // Fetch user profile info from /me
      const meRes = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setAuth(meRes.data, token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username, password, or 2FA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white border border-gray-100 p-10 rounded-3xl shadow-xl shadow-gray-100/50 mt-16">
        <div className="text-center mb-8">
          <span className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 font-bold mx-auto mb-4 border border-rose-100">
            <Lock className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-gray-400 font-semibold mt-1">Access your Peach Platform account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold p-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black tracking-wider uppercase text-gray-400 mb-2">Username</label>
            <input
              type="text"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm transition-all"
              placeholder="e.g. johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black tracking-wider uppercase text-gray-400 mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {twoFactorRequired && (
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl animate-fade-in">
              <label className="block text-xs font-black tracking-wider uppercase text-amber-700 mb-2">2FA TOTP Code Required</label>
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-amber-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-center tracking-widest font-black text-lg text-amber-900"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-4 rounded-2xl transition-all shadow-md text-sm sm:text-base disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-semibold text-gray-400">
          <span>Don't have an account? </span>
          <a href="/register" className="text-rose-500 hover:underline">Start onboarding &rarr;</a>
        </div>
      </div>
    </Layout>
  );
}
