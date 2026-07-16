'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../api';
import { useAuthStore } from '../../store/authStore';
import { Shield, Clock, AlertTriangle, Play } from 'lucide-react';

interface Order {
  id: string;
  client_id: string;
  provider_id: string;
  service_id: string;
  price: number;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/requests');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/requests/${orderId}/status?new_status=${newStatus}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <p className="text-gray-500 mt-8">Please log in to access your dashboard.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">My Dashboard</h1>
        <p className="text-gray-500 text-sm mb-8">Manage active jobs, verify secure escrow placements, and complete reviews.</p>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="text-indigo-600 h-5 w-5" />
            <span>Active Contract Bookings ({orders.length})</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 text-xs font-bold uppercase text-gray-400">Order ID</th>
                  <th className="py-4 text-xs font-bold uppercase text-gray-400">Price</th>
                  <th className="py-4 text-xs font-bold uppercase text-gray-400">Status</th>
                  <th className="py-4 text-xs font-bold uppercase text-gray-400">Action Control</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-gray-400 text-sm">No bookings found.</td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50 last:border-none">
                      <td className="py-4 text-sm font-semibold text-gray-700">{o.id}</td>
                      <td className="py-4 text-sm font-black text-gray-900">EUR {o.price.toFixed(2)}</td>
                      <td className="py-4">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          o.status === 'completed'
                            ? 'bg-green-50 text-green-700'
                            : o.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-4 flex gap-2">
                        {user.role === 'provider' && o.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(o.id, 'accepted')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-all"
                          >
                            Accept Order & Lock Escrow
                          </button>
                        )}
                        {user.role === 'provider' && o.status === 'accepted' && (
                          <button
                            onClick={() => updateStatus(o.id, 'completed')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-all"
                          >
                            Mark as Completed
                          </button>
                        )}
                        {o.status !== 'completed' && o.status !== 'cancelled' && (
                          <button
                            onClick={() => updateStatus(o.id, 'cancelled')}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-1.5 rounded-xl text-xs transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
