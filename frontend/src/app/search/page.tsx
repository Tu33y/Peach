'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { Search, MapPin, Star, ShieldCheck, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState('10');
  const [sortBy, setSortBy] = useState('newest');

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:8000/api/v1/services?`;
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);

      // If city is provided, we geocode center coordinates first!
      if (city) {
        // Simple client geocoding lookup
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
        const geoData = await geoRes.json();
        if (geoData && geoData[0]) {
          params.append('lat', geoData[0].lat);
          params.append('lon', geoData[0].lon);
          params.append('radius', radius);
        }
      }

      if (sortBy) {
        if (sortBy === 'distance' && city) {
          params.append('sort_by', 'distance');
        } else if (sortBy === 'price_asc') {
          params.append('sort_by', 'price_asc');
        } else if (sortBy === 'price_desc') {
          params.append('sort_by', 'price_desc');
        }
      }

      const res = await fetch(url + params.toString());
      const data = await res.json();
      if (Array.isArray(data)) {
        setServices(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
  }, [sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSearchResults();
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Filters Sidebar */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-6 sticky top-28">
            <div className="flex items-center justify-between pb-4 border-b border-gray-50">
              <span className="flex items-center space-x-2 text-base font-black text-gray-900">
                <SlidersHorizontal className="h-5 w-5 text-rose-500" />
                <span>Search Filters</span>
              </span>
              <button
                onClick={() => {
                  setQuery(''); setMinPrice(''); setMaxPrice(''); setCity(''); setRadius('10'); setSortBy('newest');
                }}
                className="text-xs font-bold text-gray-400 hover:text-rose-500 transition-colors"
              >
                Reset All
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-6">
              {/* Keywords */}
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-gray-400 mb-2">Keywords</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. plumbing, tutor..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm transition-all"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
                </div>
              </div>

              {/* Geo location */}
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-gray-400 mb-2">German City / Postcode</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Berlin Mitte, 10115"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm transition-all"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <MapPin className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
                </div>
              </div>

              {/* Radius Limit */}
              {city && (
                <div>
                  <label className="block text-xs font-black tracking-wider uppercase text-gray-400 mb-2">Search Radius (KM)</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm transition-all bg-white"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                  >
                    <option value="5">Within 5 km</option>
                    <option value="10">Within 10 km</option>
                    <option value="25">Within 25 km</option>
                    <option value="50">Within 50 km</option>
                  </select>
                </div>
              )}

              {/* Price range */}
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-gray-400 mb-2">Price Budget (€)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm transition-all"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm transition-all"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-md shadow-rose-500/20 text-sm"
              >
                Apply Filters
              </button>
            </form>
          </div>
        </aside>

        {/* Search Results Content */}
        <section className="flex-grow">
          {/* Sorting / Quick Results count header */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Search Results</h2>
              <span className="text-xs font-semibold text-gray-400">{services.length} active listings match your parameters</span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5 text-xs font-black tracking-wider uppercase text-gray-400">
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort by</span>
              </span>
              <select
                className="px-4 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-xs transition-all bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                {city && <option value="distance">Nearest Distance</option>}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-56 bg-gray-100 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center text-gray-400 font-semibold shadow-sm max-w-lg mx-auto mt-8">
              <span className="text-5xl block mb-4">🔍</span>
              <h3 className="text-lg font-black text-gray-900">No Services Found</h3>
              <p className="text-sm text-gray-400 mt-1 font-semibold leading-relaxed">
                We couldn't find any services matching those search filters. Adjust your budget, search keywords or expand your search radius!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((s) => (
                <div key={s.id} className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all flex flex-col justify-between hover:scale-[1.01]">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-500 bg-rose-50 px-3 py-1 rounded-full">
                        Active List
                      </span>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500 font-bold">{s.city || 'Berlin Mitte'}</span>
                      </div>
                    </div>

                    <Link href={`/services/${s.id}`}>
                      <h4 className="text-lg font-black text-gray-900 leading-snug hover:text-rose-500 transition-colors cursor-pointer">
                        {s.title}
                      </h4>
                    </Link>
                    <p className="text-xs text-gray-400 font-semibold mt-2 line-clamp-2">{s.description}</p>

                    <div className="mt-4 flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black text-gray-800">5.0</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <ShieldCheck className="h-4 w-4 text-rose-500" />
                        <span className="text-xs font-bold">Verified Provider</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block">Commission Escrow Protected</span>
                      <span className="text-xl font-black text-gray-900">€{s.price.toFixed(2)}</span>
                    </div>
                    <Link href={`/services/${s.id}`}>
                      <button className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm">
                        Inspect
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
