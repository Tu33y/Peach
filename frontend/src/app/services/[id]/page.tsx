'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import api from '../../api';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Star, ShieldCheck, Globe, Scale, Calendar, Clock, CheckCircle } from 'lucide-react';

export default function ServiceDetailPage() {
  const { id } = useParams() || {};
  const [service, setService] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [schedStart, setSchedStart] = useState('');
  const [schedEnd, setSchedEnd] = useState('');
  const [bookingSuccess, setBookingSubmitted] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/v1/services/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setService(data);
        // Also fetch seller public profile
        return fetch(`http://localhost:8000/api/v1/profiles/${data.provider_id}/public`);
      })
      .then((res) => res.json())
      .then((sellerData) => {
        setSeller(sellerData);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!schedStart || !schedEnd) {
      setError('Please select both start and end times for the appointment.');
      return;
    }

    try {
      const res = await api.post('/requests', {
        service_id: id,
        scheduled_start_time: new Date(schedStart).toISOString(),
        scheduled_end_time: new Date(schedEnd).toISOString()
      });
      if (res.status === 200 || res.status === 201) {
        setBookingSubmitted(true);
        setTimeout(() => {
          router.push('/dashboard/customer');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Booking request failed. Check your wallet balance (must have at least €' + (service?.price || 0) + ' for Escrow lock).');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-12 space-y-6">
          <div className="h-10 bg-gray-100 rounded-3xl animate-pulse w-2/3"></div>
          <div className="h-64 bg-gray-100 rounded-3xl animate-pulse"></div>
        </div>
      </Layout>
    );
  }

  if (!service) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-20 text-center font-semibold text-gray-500">
          Service listing not found.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Title and Category */}
        <div className="mb-6">
          <span className="text-xs font-black uppercase tracking-wider text-rose-500 bg-rose-50 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Service Listing
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-snug">
            {service.title}
          </h1>
          <div className="flex flex-wrap items-center mt-3 text-sm text-gray-400 gap-4 font-semibold">
            <div className="flex items-center space-x-1.5">
              <MapPin className="h-4.5 w-4.5 text-gray-400" />
              <span>{service.city || 'Berlin Mitte'}</span>
            </div>
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-gray-700 font-extrabold">5.0</span>
              <span>(Verified)</span>
            </div>
          </div>
        </div>

        {/* Media / Images Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-gradient-to-br from-rose-100 to-amber-100 rounded-3xl h-80 flex items-center justify-center text-rose-500/20 text-8xl font-black shadow-inner">
            📸
          </div>

          {/* Pricing & Scheduling Form */}
          <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-xl shadow-gray-200/30 flex flex-col justify-between">
            <div>
              <span className="text-xs font-black tracking-widest uppercase text-gray-400 block mb-1">Escrow Guaranteed Price</span>
              <span className="text-4xl font-black text-gray-900">€{service.price.toFixed(2)}</span>

              <div className="h-px bg-gray-50 my-6"></div>

              {bookingSuccess ? (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl p-4 font-bold flex items-center justify-center space-x-2 text-sm">
                  <CheckCircle className="h-5 w-5" />
                  <span>Booking request submitted! Redirecting...</span>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-4 rounded-xl leading-normal">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    <div>
                      <label className="block text-[10px] font-black tracking-wider uppercase text-gray-400 mb-1.5 flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Start Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs font-semibold"
                        value={schedStart}
                        onChange={(e) => setSchedStart(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black tracking-wider uppercase text-gray-400 mb-1.5 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>End Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs font-semibold"
                        value={schedEnd}
                        onChange={(e) => setSchedEnd(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-rose-500/20 text-sm mt-4"
                  >
                    Confirm Escrow Booking
                  </button>
                </form>
              )}
            </div>

            <div className="text-[10px] text-gray-400 font-bold leading-normal mt-6">
              🔒 Safe payment flow: Your budget is locked in LavoroHub Escrow and only released after your physical service is marked as complete.
            </div>
          </div>
        </div>

        {/* Detailed Listing Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-8 space-y-8">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-4">About this service</h3>
              <p className="text-gray-500 font-semibold text-sm leading-relaxed whitespace-pre-line">
                {service.description}
              </p>
            </div>

            <div className="pt-6 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Languages */}
              <div className="flex items-start space-x-3">
                <Globe className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-black tracking-wider uppercase text-gray-400">Languages</h5>
                  <p className="text-sm font-extrabold text-gray-800 mt-1">{service.languages || 'English, German'}</p>
                </div>
              </div>

              {/* Rules */}
              <div className="flex items-start space-x-3">
                <Scale className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-black tracking-wider uppercase text-gray-400">Rules & Requirements</h5>
                  <p className="text-sm font-extrabold text-gray-800 mt-1">{service.rules || 'No special requirements.'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Side Card */}
          {seller && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 text-center space-y-4">
              <span className="text-[10px] font-black tracking-widest uppercase text-gray-400 block mb-2">Verified Host</span>
              <div className="h-16 w-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto shadow-md">
                {seller.username?.charAt(0).toUpperCase()}
              </div>

              <div>
                <h4 className="text-lg font-black text-gray-900 leading-snug">{seller.username}</h4>
                <div className="flex items-center justify-center space-x-1.5 text-xs text-rose-500 font-bold mt-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Reputation Score: {seller.reputation_score}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 font-semibold leading-relaxed px-2 line-clamp-3">
                {seller.description || 'Experienced local services professional on Peach Platform.'}
              </p>

              <div className="pt-4 border-t border-gray-50 flex items-center justify-center gap-3">
                <button
                  onClick={() => router.push(`/chat?recipient_id=${service.provider_id}`)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all w-full"
                >
                  Contact
                </button>
                <button
                  onClick={() => router.push(`/profile/${service.provider_id}`)}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all w-full"
                >
                  Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
