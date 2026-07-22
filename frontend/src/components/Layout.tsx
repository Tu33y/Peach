'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import {
  Compass, MapPin, Briefcase, Star, Clock, ShieldCheck,
  Search, User, LogOut, Wallet, MessageSquare, AlertTriangle,
  PlusCircle, Home, Calendar, Settings, FileText, CheckCircle
} from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname() || '';
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosLocation, setSosLocation] = useState('');
  const [sosSubmitted, setSosSubmitted] = useState(false);

  const triggerSos = async () => {
    if (!sosLocation) return;
    try {
      const response = await fetch('http://localhost:8000/api/v1/safety/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: 'SOS',
          location: sosLocation
        })
      });
      if (response.ok) {
        setSosSubmitted(true);
        setTimeout(() => {
          setShowSosModal(false);
          setSosSubmitted(false);
          setSosLocation('');
        }, 3000);
      }
    } catch (e) {
      alert('Failed to send SOS. Please dial local emergency numbers immediately!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-rose-200 selection:text-rose-900">

      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-12">
            <Link href="/" className="flex items-center space-x-2.5">
              <span className="h-10 w-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-rose-500/30">
                P
              </span>
              <span className="text-2xl font-black tracking-tight text-gray-900">
                Peach<span className="text-rose-500 font-extrabold">.</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8 text-sm font-semibold text-gray-500">
              <Link href="/search" className={`hover:text-gray-900 transition-colors ${pathname === '/search' ? 'text-gray-900 font-bold' : ''}`}>
                Explore
              </Link>
              <Link href="/services" className={`hover:text-gray-900 transition-colors ${pathname === '/services' ? 'text-gray-900 font-bold' : ''}`}>
                Services
              </Link>
              {user && (
                <>
                  <Link href="/chat" className={`hover:text-gray-900 transition-colors ${pathname === '/chat' ? 'text-gray-900 font-bold' : ''}`}>
                    Inbox
                  </Link>
                  <Link href="/wallet" className={`hover:text-gray-900 transition-colors ${pathname === '/wallet' ? 'text-gray-900 font-bold' : ''}`}>
                    Wallet
                  </Link>
                  <Link href="/verification" className={`hover:text-gray-900 transition-colors ${pathname === '/verification' ? 'text-gray-900 font-bold' : ''}`}>
                    Compliance
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* 🆘 EMERGENCY BUTTON */}
            <button
              onClick={() => setShowSosModal(true)}
              className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl transition-all border border-red-100 animate-pulse text-sm"
            >
              <span className="text-base">🆘</span>
              <span>Emergency SOS</span>
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={user.role === 'provider' ? '/dashboard/seller' : '/dashboard/customer'}
                  className="hidden md:flex items-center space-x-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-2xl transition-all"
                >
                  <User className="h-4 w-4" />
                  <span>{user.role === 'provider' ? 'Seller Hub' : 'Client Hub'}</span>
                </Link>

                <button
                  onClick={logout}
                  className="p-3 text-gray-400 hover:text-red-500 transition-colors rounded-2xl hover:bg-gray-50"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900 px-4 py-2.5">
                  Log in
                </Link>
                <Link href="/register" className="text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 px-5 py-3 rounded-2xl transition-all shadow-md">
                  Onboarding
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Layout (with responsive sidebars and subviews) */}
      <div className="flex-grow flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">

        {/* Desktop Sidebar: Shows if user is logged in */}
        {user && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sticky top-28 space-y-6">
              <div>
                <span className="text-xs font-black tracking-widest uppercase text-gray-400 block mb-3">Navigation</span>
                <nav className="space-y-1">
                  <Link href="/" className={`flex items-center space-x-3 text-sm font-bold p-3 rounded-2xl transition-all ${pathname === '/' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Home className="h-5 w-5" />
                    <span>Home</span>
                  </Link>
                  <Link href="/search" className={`flex items-center space-x-3 text-sm font-bold p-3 rounded-2xl transition-all ${pathname === '/search' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Search className="h-5 w-5" />
                    <span>Search</span>
                  </Link>
                  <Link href="/chat" className={`flex items-center space-x-3 text-sm font-bold p-3 rounded-2xl transition-all ${pathname === '/chat' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <MessageSquare className="h-5 w-5" />
                    <span>Messages</span>
                  </Link>
                  <Link href="/wallet" className={`flex items-center space-x-3 text-sm font-bold p-3 rounded-2xl transition-all ${pathname === '/wallet' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Wallet className="h-5 w-5" />
                    <span>Virtual Wallet</span>
                  </Link>
                  <Link href="/verification" className={`flex items-center space-x-3 text-sm font-bold p-3 rounded-2xl transition-all ${pathname === '/verification' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <ShieldCheck className="h-5 w-5" />
                    <span>Verification</span>
                  </Link>
                  <Link href="/settings" className={`flex items-center space-x-3 text-sm font-bold p-3 rounded-2xl transition-all ${pathname === '/settings' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                </nav>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <span className="text-xs font-black tracking-widest uppercase text-gray-400 block mb-3">Dashboards</span>
                <div className="space-y-1">
                  <Link href="/dashboard/customer" className={`flex items-center space-x-3 text-sm font-bold p-3 rounded-2xl transition-all ${pathname === '/dashboard/customer' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <User className="h-5 w-5" />
                    <span>Customer Dashboard</span>
                  </Link>
                  <Link href="/dashboard/seller" className={`flex items-center space-x-3 text-sm font-bold p-3 rounded-2xl transition-all ${pathname === '/dashboard/seller' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Briefcase className="h-5 w-5" />
                    <span>Seller Dashboard</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Content Viewport */}
        <main className="flex-grow min-w-0">
          {children}
        </main>
      </div>

      {/* Trust & Policy Footer */}
      <footer className="bg-white border-t border-gray-100 py-16 mt-16 mb-20 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm gap-4">
          <div className="flex items-center space-x-2">
            <span className="h-6 w-6 rounded-lg bg-rose-500 flex items-center justify-center text-white font-black text-sm shadow">
              P
            </span>
            <span className="font-extrabold text-gray-900">Peach Platform.</span>
            <span>&copy; {new Date().getFullYear()} LavoroHub GmbH. Operating under German Safety regulations.</span>
          </div>
          <div className="flex space-x-6 font-semibold">
            <Link href="/docs/regulations" className="hover:text-gray-900 transition-colors">Regulations</Link>
            <Link href="/docs/escrow" className="hover:text-gray-900 transition-colors">Escrow Protection</Link>
            <Link href="/docs/privacy" className="hover:text-gray-900 transition-colors">Privacy & GDPR</Link>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-20 flex items-center justify-around px-2 z-40 shadow-xl">
        <Link href="/" className={`flex flex-col items-center justify-center w-16 h-full text-xs font-bold ${pathname === '/' ? 'text-rose-500' : 'text-gray-400'}`}>
          <Home className="h-5 w-5 mb-1" />
          <span>Home</span>
        </Link>
        <Link href="/search" className={`flex flex-col items-center justify-center w-16 h-full text-xs font-bold ${pathname === '/search' ? 'text-rose-500' : 'text-gray-400'}`}>
          <Search className="h-5 w-5 mb-1" />
          <span>Search</span>
        </Link>
        <Link href={user ? (user.role === 'provider' ? '/dashboard/seller' : '/dashboard/customer') : '/login'} className={`flex flex-col items-center justify-center w-16 h-full text-xs font-bold ${pathname.includes('/dashboard') ? 'text-rose-500' : 'text-gray-400'}`}>
          <Calendar className="h-5 w-5 mb-1" />
          <span>Bookings</span>
        </Link>
        <Link href="/chat" className={`flex flex-col items-center justify-center w-16 h-full text-xs font-bold ${pathname === '/chat' ? 'text-rose-500' : 'text-gray-400'}`}>
          <MessageSquare className="h-5 w-5 mb-1" />
          <span>Chat</span>
        </Link>
        <Link href="/settings" className={`flex flex-col items-center justify-center w-16 h-full text-xs font-bold ${pathname === '/settings' ? 'text-rose-500' : 'text-gray-400'}`}>
          <Settings className="h-5 w-5 mb-1" />
          <span>Profile</span>
        </Link>
      </nav>

      {/* SOS EMERGENCY MODAL */}
      {showSosModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-red-100">
            <button
              onClick={() => setShowSosModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              &times;
            </button>

            <div className="text-center">
              <span className="text-5xl block mb-4">🆘</span>
              <h3 className="text-2xl font-black text-red-600 leading-snug">Emergency SOS Trigger</h3>
              <p className="mt-2 text-sm text-gray-500">
                If you are in immediate physical danger, please call national emergency numbers directly:
              </p>

              <div className="mt-4 bg-red-50 rounded-2xl p-4 border border-red-100 text-left space-y-2">
                <div className="flex justify-between font-black text-red-700">
                  <span>Police (Polizei):</span>
                  <a href="tel:110" className="underline hover:text-red-900">110</a>
                </div>
                <div className="flex justify-between font-black text-red-700">
                  <span>Ambulance/Fire (Feuerwehr):</span>
                  <a href="tel:112" className="underline hover:text-red-900">112</a>
                </div>
              </div>

              {!sosSubmitted ? (
                <div className="mt-6 text-left">
                  <label className="block text-xs font-black tracking-wider uppercase text-gray-400 mb-2">
                    Share your current location (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Berlin Mitte, Alexanderplatz 4"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    value={sosLocation}
                    onChange={(e) => setSosLocation(e.target.value)}
                  />
                  <button
                    onClick={triggerSos}
                    disabled={!sosLocation}
                    className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-red-600/30 text-sm"
                  >
                    Transmit Safety Report
                  </button>
                </div>
              ) : (
                <div className="mt-6 bg-emerald-50 text-emerald-700 rounded-2xl p-4 border border-emerald-100 text-sm font-bold flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Safety broadcast sent. Help is on the way!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
