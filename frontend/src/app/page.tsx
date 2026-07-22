'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import { Search, Compass, MapPin, Briefcase, Star, Clock, ShieldCheck, Heart } from 'lucide-react';

const CATEGORIES = [
  { id: 'repairs', name: 'Repairs & Maintenance', count: 124, color: 'bg-rose-50 text-rose-600 border-rose-100/50' },
  { id: 'lessons', name: 'Academic Lessons', count: 86, color: 'bg-emerald-50 text-emerald-600 border-emerald-100/50' },
  { id: 'consulting', name: 'Professional Consulting', count: 95, color: 'bg-blue-50 text-blue-600 border-blue-100/50' },
  { id: 'assistance', name: 'Care & Assistance', count: 110, color: 'bg-amber-50 text-amber-600 border-amber-100/50' },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/services')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setServices(data.slice(0, 4));
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="text-center py-20 sm:py-28 max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-rose-50 border border-rose-100 rounded-full px-4 py-1.5 text-xs font-bold text-rose-600 mb-6 tracking-wide uppercase">
          <span>✨</span>
          <span>Redesigned Peach Platform v2.0</span>
        </div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-gray-900 leading-none">
          Find verified local services <br />
          <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">with absolute safety.</span>
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
          Operating fully under German compliance. Safe escrow payments, verified professional ID credentials, and dynamic safety/SOS tracking.
        </p>

        {/* Large Search Box */}
        <form action="/search" method="GET" className="mt-12 max-w-2xl mx-auto bg-white p-3 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center gap-2">
          <div className="flex items-center flex-grow pl-4">
            <Search className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
            <input
              type="text"
              name="query"
              placeholder="What service do you need today?"
              className="w-full text-gray-800 focus:outline-none text-sm sm:text-base font-semibold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-8 py-4 rounded-2xl text-sm sm:text-base transition-all shadow-md shadow-rose-500/20">
            Search
          </button>
        </form>
      </section>

      {/* Categories Grid */}
      <section className="py-16 border-t border-gray-100/60">
        <div className="flex items-center space-x-2.5 mb-10">
          <Compass className="h-6 w-6 text-rose-500" />
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Browse by Category</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <Link href={`/search?category_id=${cat.id}`} key={cat.id}>
              <div className={`p-8 rounded-3xl border text-center cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg shadow-gray-100/20 flex flex-col justify-between h-40 ${cat.color}`}>
                <span className="font-extrabold block text-lg tracking-tight leading-snug">{cat.name}</span>
                <span className="text-xs opacity-75 font-semibold mt-2 block">{cat.count} Active Ads</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured / Popular Services */}
      <section className="py-16 border-t border-gray-100/60">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-2.5">
            <Briefcase className="h-6 w-6 text-rose-500" />
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Featured services in Mitte</h2>
          </div>
          <Link href="/search" className="text-sm font-bold text-rose-500 hover:underline">
            View All Services &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-48 bg-gray-100 rounded-3xl animate-pulse"></div>
            <div className="h-48 bg-gray-100 rounded-3xl animate-pulse"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-500 font-semibold max-w-md mx-auto shadow-sm">
            No active listings found in your area. Let's create one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((s) => (
              <div key={s.id} className="bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-xl transition-all flex flex-col justify-between hover:scale-[1.01]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-500 bg-rose-50 px-3.5 py-1.5 rounded-full">
                      Active service
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500 font-bold">{s.city || 'Berlin Mitte'}</span>
                    </div>
                  </div>

                  <Link href={`/services/${s.id}`}>
                    <h3 className="text-xl font-black text-gray-900 leading-snug hover:text-rose-500 cursor-pointer transition-colors">
                      {s.title}
                    </h3>
                  </Link>
                  <p className="mt-3 text-sm text-gray-500 font-medium line-clamp-2">
                    {s.description}
                  </p>

                  <div className="mt-4 flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-extrabold text-gray-800">5.0</span>
                      <span className="text-xs text-gray-400 font-semibold">(Verified)</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-gray-600">
                      <ShieldCheck className="h-4.5 w-4.5 text-rose-500" />
                      <span className="text-xs font-extrabold">Professional Badge</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 font-bold block mb-1">Starting Price</span>
                    <span className="text-3xl font-black text-gray-900">€{s.price.toFixed(2)}</span>
                  </div>
                  <Link href={`/services/${s.id}`}>
                    <button className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-6 py-3.5 rounded-2xl text-sm transition-all shadow-md">
                      Book Now
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
