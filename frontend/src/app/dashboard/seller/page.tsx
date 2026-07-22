'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import api from '../../api';
import { useAuthStore } from '../../../store/authStore';
import { Calendar, Briefcase, PlusCircle, CheckCircle, Clock, Trash2, Edit } from 'lucide-react';

export default function SellerDashboardPage() {
  const { user } = useAuthStore();
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Listing creation form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [languages, setLanguages] = useState('');
  const [rules, setRules] = useState('');

  // Weekly Availability Form State
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const fetchSellerData = async () => {
    setLoading(true);
    try {
      // Fetch public seller details containing their listings
      if (user?.id) {
        const profileRes = await fetch(`http://localhost:8000/api/v1/profiles/${user.id}/public`);
        const profileData = await profileRes.json();
        if (profileData && profileData.services) {
          setServices(profileData.services);
        }
        if (profileData && profileData.availability) {
          setAvailabilities(profileData.availability);
        }
      }

      // Fetch requests/orders for provider
      const ordersRes = await api.get('/requests');
      if (Array.isArray(ordersRes.data)) {
        setOrders(ordersRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSellerData();
    }
  }, [user]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/services', {
        title,
        description,
        price: Number(price),
        city,
        postcode,
        languages,
        rules
      });
      setTitle(''); setDescription(''); setPrice(''); setCity(''); setPostcode(''); setLanguages(''); setRules('');
      alert('Service listing created successfully!');
      fetchSellerData();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to create service listing');
    }
  };

  const handleSetAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/availability', {
        day: selectedDay,
        start_time: startTime,
        end_time: endTime,
        available: true
      });
      alert(`Availability updated for ${selectedDay}!`);
      fetchSellerData();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to update schedule');
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await api.put(`/requests/${orderId}/status?new_status=${status}`);
      fetchSellerData();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to update request');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/services/${serviceId}`);
      fetchSellerData();
    } catch (e) {
      alert('Failed to delete service');
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-lg space-y-2">
            <span className="text-xs font-black tracking-widest uppercase text-gray-400 block">Seller Workspace</span>
            <h1 className="text-3xl font-black tracking-tight leading-none">Your Business & Earnings</h1>
            <p className="text-sm text-gray-400 font-semibold leading-relaxed">
              Create local service listings, configure your weekly calendar schedule, and accept client booking requests securely.
            </p>
          </div>
          <span className="absolute right-8 bottom-4 text-9xl select-none opacity-10">💼</span>
        </div>

        {/* Dash Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Create & Manage Listings Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Create Service Listing */}
            <div className="bg-white border border-gray-100 p-8 rounded-3xl space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-50">
                <PlusCircle className="h-5 w-5 text-rose-500" />
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">Create New Listing</h3>
              </div>

              <form onSubmit={handleCreateService} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black tracking-wider uppercase text-gray-400 mb-1.5">Service Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Home Electrical Repairs"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black tracking-wider uppercase text-gray-400 mb-1.5">Escrow Rate (€)</label>
                    <input
                      type="number"
                      placeholder="e.g. 75"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black tracking-wider uppercase text-gray-400 mb-1.5">Description</label>
                  <textarea
                    placeholder="Provide a detailed description of your experience, tools, and service..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all h-24"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black tracking-wider uppercase text-gray-400 mb-1.5">German City</label>
                    <input
                      type="text"
                      placeholder="e.g. Berlin"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black tracking-wider uppercase text-gray-400 mb-1.5">Postcode</label>
                    <input
                      type="text"
                      placeholder="e.g. 10115"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black tracking-wider uppercase text-gray-400 mb-1.5">Languages (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. English, German"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black tracking-wider uppercase text-gray-400 mb-1.5">Special Rules</label>
                    <input
                      type="text"
                      placeholder="e.g. Mask required"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-md shadow-rose-500/20 text-xs mt-2"
                >
                  Publish Live Service
                </button>
              </form>
            </div>

            {/* Manage My Listings */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">My Active Services</h3>
              {services.length === 0 ? (
                <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center text-gray-400 font-semibold text-xs shadow-sm">
                  You haven't listed any services yet. Use the creator above!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((s) => (
                    <div key={s.id} className="bg-white border border-gray-100 p-6 rounded-3xl hover:shadow-lg transition-all flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-gray-900 text-base leading-snug line-clamp-2">{s.title}</h4>
                        <span className="text-xs text-gray-400 font-semibold block mt-1">Starting at €{s.price.toFixed(2)}</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-extrabold">{s.city || 'Berlin'}</span>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-xl"
                          title="Delete Service"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Client Requests & Availability Sidebars Column */}
          <div className="space-y-8">

            {/* Calendar Availability Editor */}
            <div className="bg-white border border-gray-100 p-6 rounded-3xl space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-50">
                <Calendar className="h-4.5 w-4.5 text-rose-500" />
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Availability Scheduler</h4>
              </div>

              <form onSubmit={handleSetAvailability} className="space-y-3">
                <div>
                  <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Weekday</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-xs bg-white"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Start Hour</label>
                    <input
                      type="text"
                      placeholder="09:00"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">End Hour</label>
                    <input
                      type="text"
                      placeholder="17:00"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all mt-2"
                >
                  Set Day Schedule
                </button>
              </form>

              {/* Display Current Availabilities */}
              <div className="pt-4 border-t border-gray-50 space-y-2 max-h-36 overflow-y-auto">
                {availabilities.map((a, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] font-semibold">
                    <span className="text-gray-400 font-extrabold">{a.day}</span>
                    <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded border border-rose-100/50">
                      {a.start_time} - {a.end_time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Incoming Client Service Requests */}
            <div className="bg-white border border-gray-100 p-6 rounded-3xl space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-50">
                <Briefcase className="h-4.5 w-4.5 text-rose-500" />
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Incoming Requests</h4>
              </div>

              {orders.length === 0 ? (
                <p className="text-xs font-semibold text-gray-400 text-center py-4">No active service requests.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((o) => (
                    <div key={o.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-gray-400 uppercase">ID: {o.id.slice(0, 8)}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          o.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                          o.status === 'accepted' ? 'bg-blue-50 text-blue-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {o.status}
                        </span>
                      </div>

                      <div className="text-xs font-extrabold text-gray-800">
                        <span>Fee Rate: €{o.price.toFixed(2)}</span>
                      </div>

                      {o.status === 'pending' && (
                        <div className="flex space-x-1.5 pt-2">
                          <button
                            onClick={() => handleStatusChange(o.id, 'accepted')}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-1.5 px-3 rounded-lg text-[10px] transition-all"
                          >
                            Accept & Lock Escrow
                          </button>
                          <button
                            onClick={() => handleStatusChange(o.id, 'cancelled')}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-extrabold py-1.5 px-3 rounded-lg text-[10px] transition-all"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
