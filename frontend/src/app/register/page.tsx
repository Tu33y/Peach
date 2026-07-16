'use client';

import React, { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../api';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', {
        username,
        password,
        role,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white border border-gray-100 p-8 rounded-3xl shadow-sm mt-12">
        <h1 className="text-3xl font-black text-gray-900 mb-6">Create Account</h1>

        {success ? (
          <p className="text-green-600 font-semibold">Account created successfully! Redirecting to login...</p>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}

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

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">I want to</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="client">Order local services (Client)</option>
                <option value="provider">Offer local services (Provider)</option>
              </select>
            </div>

            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm">
              Sign Up
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
