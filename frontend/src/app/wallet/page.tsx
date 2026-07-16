'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../api';
import { useAuthStore } from '../../store/authStore';
import { Wallet, Landmark, TrendingUp } from 'lucide-react';

interface Transaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: string;
  status: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export default function WalletPage() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(0.0);
  const [escrow, setEscrow] = useState(0.0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await api.get('/wallet/me');
      setBalance(res.data.balance);
      setEscrow(res.data.escrow_balance);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/wallet/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setLoading(true);
    try {
      await api.post(`/wallet/deposit?amount=${parseFloat(depositAmount)}`);
      setDepositAmount('');
      fetchWallet();
      fetchTransactions();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchTransactions();
    }
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <p className="text-gray-500 mt-8">Please log in to view your wallet details.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <Wallet className="text-indigo-600 h-8 w-8" />
          <span>My Wallet</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-md">
            <span className="text-indigo-100 text-xs font-bold uppercase tracking-wider block">Available Balance</span>
            <span className="text-4xl font-black mt-2 block">EUR {balance.toFixed(2)}</span>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Escrow Funds Locked</span>
              <span className="text-2xl font-black text-gray-800 mt-1 block">EUR {escrow.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Funds are safely protected in Escrow until job delivery completion.</p>
          </div>
        </div>

        {/* Deposit module */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Landmark className="text-indigo-600 h-5 w-5" />
            <span>Deposit Funds (Simulated Wallet)</span>
          </h2>
          <form onSubmit={handleDeposit} className="flex gap-2 max-w-sm">
            <input
              type="number"
              placeholder="EUR 100.00"
              className="flex-grow p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all text-sm"
              disabled={loading}
            >
              Deposit
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-indigo-600 h-5 w-5" />
            <span>Immutable Ledger Logs</span>
          </h2>

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-gray-400 text-sm">No transaction records found in ledger.</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-none">
                  <div>
                    <span className="font-bold text-gray-800 text-sm capitalize">{tx.type.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-400 block mt-1">Transaction ID: {tx.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-gray-900 block text-sm">EUR {tx.amount.toFixed(2)}</span>
                    <span className="text-xs text-indigo-600 font-semibold">{tx.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
