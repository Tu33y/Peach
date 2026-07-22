'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import api from '../../api';
import { useAuthStore } from '../../../store/authStore';
import { useRouter } from 'next/navigation';
import { Calendar, Wallet, CheckCircle, Clock, AlertTriangle, Star, CheckSquare } from 'lucide-react';

export default function CustomerDashboardPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const router = useRouter();

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests');
      if (Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await api.put(`/requests/${orderId}/status?new_status=${status}`);
      fetchCustomerData();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to update order status');
    }
  };

  const handlePreCheckIn = async (orderId: string) => {
    try {
      await api.post('/safety/checkin', {
        booking_id: orderId,
        type: 'pre-appointment',
        location: 'confirmed_presence'
      });
      alert('Presence confirmed! Stay safe and keep your SOS button active.');
    } catch (e) {
      alert('Pre check-in failed');
    }
  };

  const handlePostCheckIn = async (orderId: string, status: string) => {
    try {
      await api.post('/safety/checkin', {
        booking_id: orderId,
        type: 'post-appointment',
        location: status === 'completed' ? 'success' : 'issue'
      });
      if (status === 'issue') {
        alert('Safety report generated! The order has been flagged for dispute.');
        handleStatusChange(orderId, 'disputed');
      } else {
        alert('Appointment marked as completed successfully!');
        handleStatusChange(orderId, 'completed');
      }
    } catch (e) {
      alert('Post check-in failed');
    }
  };

  const openReviewModal = (orderId: string) => {
    setActiveOrderId(orderId);
    setShowReviewModal(true);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        order_id: activeOrderId,
        rating,
        comment
      });
      setShowReviewModal(false);
      setComment('');
      fetchCustomerData();
      alert('Review posted! The seller reputation score has been updated.');
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to submit review');
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

        {/* Banner */}
        <div className="bg-gradient-to-r from-rose-500 to-amber-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-rose-500/20">
          <div className="relative z-10 max-w-lg space-y-2">
            <span className="text-xs font-black tracking-widest uppercase text-white/80 block">Customer Workspace</span>
            <h1 className="text-3xl font-black tracking-tight leading-none">Your Bookings & Escrow</h1>
            <p className="text-sm text-white/90 font-medium leading-relaxed">
              Track active local appointments, confirm safety check-ins, and safely release escrow payouts upon complete service delivery.
            </p>
          </div>
          <span className="absolute right-8 bottom-4 text-9xl select-none opacity-10">🗓️</span>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Main Bookings Feed */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Active Appointments</h3>

            {loading ? (
              <div className="space-y-4">
                <div className="h-28 bg-gray-100 rounded-3xl animate-pulse"></div>
                <div className="h-28 bg-gray-100 rounded-3xl animate-pulse"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white border border-gray-100 p-12 text-center rounded-3xl text-gray-400 font-semibold shadow-sm">
                You haven't booked any local services yet. Let's find some!
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-black tracking-wider uppercase text-gray-400">
                          Booking ID: {o.id.slice(0, 8)}
                        </span>

                        {/* ORDER STATUS BADGE */}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                          o.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                          o.status === 'accepted' ? 'bg-blue-50 text-blue-600' :
                          o.status === 'disputed' ? 'bg-red-50 text-red-600 border border-red-100' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {o.status}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-gray-900 hover:text-rose-500 cursor-pointer text-base leading-snug">
                        Local Service Booking
                      </h4>

                      {/* Escrow price info */}
                      <div className="mt-3 flex items-center space-x-1">
                        <span className="text-sm font-black text-gray-800">€{o.price.toFixed(2)}</span>
                        <span className="text-[10px] text-gray-400 font-semibold">(Commission locked in Escrow)</span>
                      </div>

                      {/* Scheduled appointment time details */}
                      {o.scheduled_start_time && (
                        <div className="mt-2.5 flex items-center space-x-1.5 text-xs text-gray-400 font-semibold">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>{new Date(o.scheduled_start_time).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Check-ins & Actions interface */}
                    <div className="mt-6 pt-4 border-t border-gray-50 flex flex-wrap items-center justify-between gap-3">

                      {/* Safety Presence Checkins */}
                      {o.status === 'accepted' && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handlePreCheckIn(o.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold px-3 py-2 rounded-xl text-xs transition-all border border-rose-100"
                          >
                            Pre-CheckIn
                          </button>
                          <button
                            onClick={() => handlePostCheckIn(o.id, 'completed')}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-extrabold px-3 py-2 rounded-xl text-xs transition-all border border-emerald-100"
                          >
                            Post-CheckIn (Success)
                          </button>
                          <button
                            onClick={() => handlePostCheckIn(o.id, 'issue')}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-extrabold px-3 py-2 rounded-xl text-xs transition-all border border-red-100"
                          >
                            Report Issue
                          </button>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 ml-auto">
                        {o.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(o.id, 'cancelled')}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold px-4 py-2 rounded-xl text-xs transition-all"
                          >
                            Cancel
                          </button>
                        )}
                        {o.status === 'completed' && (
                          <button
                            onClick={() => openReviewModal(o.id)}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-rose-500/10"
                          >
                            Leave Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-50">
                <Wallet className="h-4.5 w-4.5 text-rose-500" />
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">My Budget Balance</h4>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-gray-400 block">Available Funds</span>
                <span className="text-3xl font-black text-gray-900">€1,000.00</span>
              </div>

              <button
                onClick={() => router.push('/wallet')}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-sm"
              >
                Top-Up / Deposit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEW CREATION MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              &times;
            </button>

            <form onSubmit={submitReview} className="space-y-6 text-center">
              <span className="text-5xl block mb-2">⭐</span>
              <h3 className="text-2xl font-black text-gray-900 leading-snug">Review Appointment</h3>
              <p className="text-xs text-gray-400 font-semibold mt-1">
                Your feedback dynamically changes the provider reputation score. Be precise and honest!
              </p>

              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-gray-400 mb-2">Rating Stars</label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm transition-all bg-white"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  <option value="5">⭐⭐⭐⭐• 5 - Excellent</option>
                  <option value="4">⭐⭐⭐⭐☆ 4 - Great</option>
                  <option value="3">⭐⭐⭐☆☆ 3 - Average</option>
                  <option value="2">⭐⭐☆☆☆ 2 - Bad</option>
                  <option value="1">⭐☆☆☆☆ 1 - Horrible</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-gray-400 mb-2">Comment</label>
                <textarea
                  placeholder="Tell us about the service quality..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm transition-all h-24"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-lg shadow-rose-500/20 text-sm"
              >
                Submit Verified Feedback
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
