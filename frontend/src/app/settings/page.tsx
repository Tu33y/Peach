'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../api';
import { useAuthStore } from '../../store/authStore';
import { Settings, Shield, User, Key, CheckCircle, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const { user, setAuth } = useAuthStore();
  const [role, setRole] = useState(user?.role || 'client');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled || false);
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setTwoFactorEnabled(user.two_factor_enabled);
    }
  }, [user]);

  const handleRoleChange = async (newRole: string) => {
    try {
      await api.post(`/auth/role?role=${newRole}`);
      setRole(newRole);
      setSuccessMsg('Account role updated successfully! Refreshing...');

      // Update store
      if (user) {
        setAuth({ ...user, role: newRole }, localStorage.getItem('token'));
      }

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      alert('Failed to update account type');
    }
  };

  const handleSetup2FA = async () => {
    try {
      const res = await api.post('/auth/2fa/setup');
      setTotpSecret(res.data.secret);
      setQrCodeBase64(res.data.qr_code_base64);
      setIsSettingUp(true);
    } catch (e) {
      alert('Failed to initiate 2FA setup');
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/auth/2fa/enable?code=${totpCode}`);
      setTwoFactorEnabled(true);
      setIsSettingUp(false);
      setTotpCode('');
      setSuccessMsg('Two-Factor Authentication is now active! Keep your secret safe.');
      if (user) {
        setAuth({ ...user, two_factor_enabled: true }, localStorage.getItem('token'));
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      alert('Invalid code. Please verify your authenticator app timer.');
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = prompt('Please enter your 6-digit TOTP code to confirm deactivation:');
    if (!code) return;
    try {
      await api.post(`/auth/2fa/disable?code=${code}`);
      setTwoFactorEnabled(false);
      setSuccessMsg('Two-Factor Authentication disabled successfully.');
      if (user) {
        setAuth({ ...user, two_factor_enabled: false }, localStorage.getItem('token'));
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      alert('Failed to disable 2FA. Invalid code.');
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-20 text-center font-semibold text-gray-500">
          Please log in to customize account settings.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

        {/* Banner */}
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
          <Settings className="text-rose-500 h-8 w-8 animate-spin-slow" />
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Security & Account Settings</h1>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">Manage your preferences, roles, and 2FA credentials</p>
          </div>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl p-4 font-bold flex items-center space-x-2 text-xs">
            <CheckCircle className="h-4.5 w-4.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* SWITCH ACCOUNT TYPE */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-6">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-50">
              <User className="h-4.5 w-4.5 text-rose-500" />
              <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">Account Mode</h3>
            </div>

            <p className="text-xs text-gray-400 font-semibold leading-relaxed">
              Dynamically switch your active profile mode on Peach Platform. Customer mode is optimized for browsing and booking, while Seller mode unlocks service listings and scheduling calendars.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleRoleChange('client')}
                className={`p-4 rounded-2xl text-xs font-extrabold border transition-all ${
                  role === 'client'
                    ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-500'
                }`}
              >
                Customer Mode
              </button>
              <button
                onClick={() => handleRoleChange('provider')}
                className={`p-4 rounded-2xl text-xs font-extrabold border transition-all ${
                  role === 'provider'
                    ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-500'
                }`}
              >
                Seller Mode
              </button>
            </div>
          </div>

          {/* TWO-FACTOR AUTHENTICATION */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-6">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-50">
              <Shield className="h-4.5 w-4.5 text-rose-500" />
              <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">Two-Factor Authentication (2FA)</h3>
            </div>

            <p className="text-xs text-gray-400 font-semibold leading-relaxed">
              Add an extra layer of security to your wallet and account. Protect your ledger deposits using Google Authenticator or Authy.
            </p>

            {twoFactorEnabled ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-700 text-xs font-bold flex items-center justify-between">
                  <span>2FA is Active and Protecting your Account</span>
                  <Shield className="h-4.5 w-4.5 animate-pulse" />
                </div>
                <button
                  onClick={handleDisable2FA}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-extrabold py-3 px-6 rounded-2xl text-xs transition-all w-full"
                >
                  De-activate 2FA
                </button>
              </div>
            ) : !isSettingUp ? (
              <button
                onClick={handleSetup2FA}
                className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs transition-all w-full flex items-center justify-center space-x-2 shadow-md"
              >
                <Key className="h-4 w-4" />
                <span>Configure Authenticator 2FA</span>
              </button>
            ) : (
              <form onSubmit={handleEnable2FA} className="space-y-4 animate-fade-in text-center">
                {qrCodeBase64 && (
                  <div className="bg-gray-50 p-4 rounded-3xl inline-block border border-gray-100 mx-auto">
                    <img
                      src={`data:image/png;base64,${qrCodeBase64}`}
                      alt="TOTP QR Code"
                      className="h-32 w-32 object-contain"
                    />
                  </div>
                )}

                <div className="text-left bg-rose-50 border border-rose-100 rounded-2xl p-4">
                  <span className="text-[10px] font-black uppercase text-rose-800 block">Backup Recovery Secret</span>
                  <span className="font-mono text-xs font-black text-rose-950 mt-1 select-all block leading-tight">{totpSecret}</span>
                </div>

                <div className="text-left space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Authenticator 6-digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-center tracking-widest font-black text-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSettingUp(false)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-extrabold py-3 rounded-2xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-md shadow-rose-500/10"
                  >
                    Activate
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
