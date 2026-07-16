'use client';

import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Search, Compass, MapPin, Briefcase, Star, Clock, ShieldCheck } from 'lucide-react';

const CATEGORIES = [
  { id: 'riparazioni', name: 'Riparazioni', count: 124, color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { id: 'lezioni', name: 'Lezioni Private', count: 86, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { id: 'consulenze', name: 'Consulenze', count: 95, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'assistenza', name: 'Assistenza', count: 110, color: 'bg-amber-50 text-amber-600 border-amber-100' },
];

const POPULAR_SERVICES = [
  {
    id: '1',
    title: 'Riparazione Lavatrici ed Elettrodomestici a domicilio',
    category: 'Riparazioni',
    price: 50.0,
    rating: 4.9,
    reviews: 18,
    provider: 'Mario Rossi',
    level: 'Reliable',
    location: 'Milano, Italia',
    badgeColor: 'text-emerald-700 bg-emerald-50'
  },
  {
    id: '2',
    title: 'Ripetizioni di Matematica e Fisica Superiori / Università',
    category: 'Lezioni',
    price: 25.0,
    rating: 5.0,
    reviews: 24,
    provider: 'Giulia Verdi',
    level: 'Professional',
    location: 'Torino, Italia',
    badgeColor: 'text-indigo-700 bg-indigo-50'
  }
];

export default function Home() {
  const [search, setSearch] = useState('');

  return (
    <Layout>
      {/* Hero Section */}
      <section className="text-center py-16 sm:py-24 max-w-4xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-gray-900 leading-tight">
          Trova professionisti locali <br />
          <span className="text-indigo-600">affidabili e verificati</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
          La piattaforma leader per la compravendita di servizi. Pagamenti sicuri in escrow, reputazione verificata tramite audit-trail e ledger immutabile delle transazioni.
        </p>

        {/* Large Search Box */}
        <div className="mt-10 max-w-2xl mx-auto bg-white p-2 rounded-full shadow-lg border border-gray-100 flex items-center">
          <div className="flex items-center flex-grow pl-4">
            <Search className="h-5 w-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="What service do you need today?"
              className="w-full text-gray-700 focus:outline-none text-sm sm:text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 sm:px-8 py-3 rounded-full text-sm sm:text-base transition-all shadow-sm">
            Cerca
          </button>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 border-t border-gray-100">
        <div className="flex items-center space-x-2 mb-8">
          <Compass className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Sfoglia per Categoria</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className={`p-6 rounded-2xl border text-center cursor-pointer transition-all hover:shadow-md ${cat.color}`}>
              <span className="font-bold block text-lg">{cat.name}</span>
              <span className="text-xs opacity-75 font-medium mt-1 block">{cat.count} annunci attivi</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured / Popular Services */}
      <section className="py-12 border-t border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Servizi in Evidenza</h2>
          </div>
          <span className="text-sm font-semibold text-indigo-600 cursor-pointer hover:underline">Vedi Tutti &rarr;</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {POPULAR_SERVICES.map((s) => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {s.category}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">{s.location}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 leading-snug hover:text-indigo-600 cursor-pointer">
                  {s.title}
                </h3>

                <div className="mt-4 flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-gray-800">{s.rating}</span>
                    <span className="text-xs text-gray-400">({s.reviews} recensioni)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-gray-600">{s.provider} ({s.level})</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 font-medium block">Prezzo di partenza</span>
                  <span className="text-2xl font-black text-gray-900">€{s.price.toFixed(2)}</span>
                </div>
                <button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-all shadow-sm">
                  Dettagli
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
