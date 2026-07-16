'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../api';
import { useAuthStore } from '../../store/authStore';
import { ShieldAlert, Users, TrendingUp, Cpu } from 'lucide-react';

interface Stats {
  total_users: number;
  total_orders: number;
  completed_orders: number;
  total_revenue: number;
  platform_earnings: number;
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <Layout>
        <p className="text-red-500 font-bold mt-8">Access Denied. Administrator privileges required.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-2">
          <ShieldAlert className="text-red-600 h-8 w-8" />
          <span>Platform Admin Panel</span>
        </h1>
        <p className="text-gray-500 text-sm mb-8">Inspect platform metrics, manage registered users, and audit platform fees.</p>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Total Users</span>
              <span className="text-3xl font-black text-gray-800 mt-2 block">{stats.total_users}</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Total Bookings</span>
              <span className="text-3xl font-black text-gray-800 mt-2 block">{stats.total_orders}</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Gross Volume</span>
              <span className="text-3xl font-black text-gray-800 mt-2 block">EUR {stats.total_revenue.toFixed(2)}</span>
            </div>

            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-md">
              <span className="text-indigo-100 text-xs font-bold uppercase tracking-wider block">Platform Earnings (Fees)</span>
              <span className="text-3xl font-black mt-2 block">EUR {stats.platform_earnings.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
