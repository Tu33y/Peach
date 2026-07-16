'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../api';
import { Search, MapPin, Star, ShieldCheck } from 'lucide-react';

interface Service {
  id: string;
  provider_id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  is_available: boolean;
  location_general: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchServices = async (searchQuery: string = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/services?query=${encodeURIComponent(searchQuery)}`);
      setServices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Services</h1>

        {/* Search bar */}
        <div className="flex gap-2 max-w-xl mb-8">
          <input
            type="text"
            placeholder="Search services..."
            className="flex-grow p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={() => fetchServices(query)}
            className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 text-sm transition-all"
          >
            Search
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading services...</p>
        ) : services.length === 0 ? (
          <p className="text-gray-500">No services found match your criteria.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((s) => (
              <div key={s.id} className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-snug">{s.title}</h3>
                  <p className="text-gray-500 text-sm mt-2 line-clamp-3">{s.description}</p>

                  <div className="mt-4 flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-gray-800">5.0</span>
                    </div>
                    {s.location_general && (
                      <div className="flex items-center space-x-1.5 text-gray-400 text-xs">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{s.location_general}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 font-medium block">Starting Price</span>
                    <span className="text-2xl font-black text-gray-900">EUR {s.price.toFixed(2)}</span>
                  </div>
                  <button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-all shadow-sm">
                    Book Service
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
