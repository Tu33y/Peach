'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { Search, User, LogOut, Wallet, MessageSquare, ShieldAlert, PlusCircle } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-black text-indigo-600 tracking-tight">
              Lavoro<span className="text-gray-900">Hub</span>
            </Link>

            <div className="relative hidden md:block w-80">
              <input
                type="text"
                placeholder="Search local or consulting services..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <nav className="flex items-center space-x-6">
            <Link href="/services" className="text-sm font-medium text-gray-600 hover:text-indigo-600">
              Browse Services
            </Link>

            {user ? (
              <>
                {user.role === 'provider' && (
                  <Link href="/services/new" className="flex items-center space-x-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-full transition-all">
                    <PlusCircle className="h-4 w-4" />
                    <span>Create Service</span>
                  </Link>
                )}

                <Link href="/wallet" className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-indigo-600">
                  <Wallet className="h-4 w-4" />
                  <span>Wallet</span>
                </Link>

                <Link href="/chat" className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-indigo-600">
                  <MessageSquare className="h-4 w-4" />
                  <span>Messages</span>
                </Link>

                {user.role === 'admin' && (
                  <Link href="/admin" className="flex items-center space-x-1 text-sm font-semibold text-red-600 hover:text-red-700">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <div className="h-5 w-px bg-gray-200"></div>

                <Link href="/dashboard" className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-indigo-600">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase">
                    {user.username.charAt(0)}
                  </div>
                  <span className="hidden sm:inline">{user.username}</span>
                </Link>

                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-indigo-600">
                  Log in
                </Link>
                <Link href="/register" className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-full transition-all shadow-sm">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Trust & Policy Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="font-extrabold text-indigo-600">LavoroHub</span>
            <span>&copy; {new Date().getFullYear()}. All rights reserved.</span>
          </div>
          <div className="flex space-x-6 font-medium">
            <Link href="/docs/regulations" className="hover:text-gray-600">Platform Regulations</Link>
            <Link href="/docs/escrow" className="hover:text-gray-600">Escrow & Fees</Link>
            <Link href="/docs/privacy" className="hover:text-gray-600">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
