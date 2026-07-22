'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../api';
import { useAuthStore } from '../../store/authStore';
import { Wallet, ArrowDownLeft, ArrowUpRight, HelpCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function WalletPage() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(0.0);
  const [escrowBalance, setEscrowBalance] = useState(0.0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchWalletDetails = async () => {
    setLoading(true);
    try {
      const walletRes = await api.get('/wallet/me');
      setBalance(walletRes.data.balance);
      setEscrowBalance(walletRes.data.escrow_balance);

      const txRes = await api.get('/wallet/transactions');
      if (Array.isArray(txRes.data)) {
        setTransactions(txRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWalletDetails();
    }
  }, [user]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;
    try {
      await api.post(`/wallet/deposit?amount=${depositAmount}`);
      setDepositAmount('');
      alert(`Successfully topped up €${depositAmount}! Funds are available immediately.`);
      fetchWalletDetails();
    } catch (e) {
      alert('Top-up request failed');
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-20 text-center font-semibold text-gray-500">
          Please log in to inspect your wallet.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

        {/* Banner */}
        <div className="bg-gradient-to-r from-rose-500 to-amber-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-rose-500/10">
          <div className="relative z-10 max-w-md space-y-2">
            <span className="text-xs font-black tracking-widest uppercase text-white/80 block">Virtual Escrow Wallet</span>
            <h1 className="text-3xl font-black tracking-tight leading-none">Your Funds & Security</h1>
            <p className="text-sm text-white/90 font-medium leading-relaxed">
              We protect your payments. Funds remain safely locked in escrow until appointments are physically completed.
            </p>
          </div>
          <span className="absolute right-8 bottom-4 text-9xl select-none opacity-10">💳</span>
        </div>

        {/* Balance Grid & Top-Up Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* AVAILABLE FUNDS */}
          <div className="bg-white border border-gray-100 p-8 rounded-3xl space-y-4 shadow-sm">
            <span className="text-xs font-black tracking-widest uppercase text-gray-400 block mb-1">Available Budget</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-black text-gray-900">€{balance.toFixed(2)}</span>
              <span className="text-xs text-gray-400 font-semibold">EUR</span>
            </div>
            <p className="text-xs text-gray-400 font-semibold leading-normal pt-2">
              Used for buying local professional services or ready to be withdrawn to your German bank account.
            </p>
          </div>

          {/* ESCROW LOCKED FUNDS */}
          <div className="bg-white border border-gray-100 p-8 rounded-3xl space-y-4 shadow-sm">
            <span className="text-xs font-black tracking-widest uppercase text-gray-400 block mb-1">Locked in Escrow</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-black text-rose-500">€{escrowBalance.toFixed(2)}</span>
              <span className="text-xs text-rose-400 font-semibold">EUR</span>
            </div>
            <p className="text-xs text-gray-400 font-semibold leading-normal pt-2">
              Protected in our immutable platform escrow ledger. Safe from fraud, released upon appointment check-in completion.
            </p>
          </div>

          {/* TOP UP DEPOSIT FORM */}
          <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-xl shadow-gray-200/20">
            <span className="text-xs font-black tracking-widest uppercase text-gray-400 block mb-3">Deposit Funds</span>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  placeholder="E.g., 250"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all pl-8"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                />
                <span className="absolute left-4.5 top-3.5 text-sm font-black text-gray-400">€</span>
              </div>
              <button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-md text-xs"
              >
                Top-Up Instantly
              </button>
            </form>
          </div>
        </div>

        {/* IMMUTABLE TRANSACTION LOG LEDGER */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-50">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="h-5 w-5 text-rose-500" />
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Immutable Ledger Book</h3>
            </div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Blockchain Audit Trail Enabled</span>
          </div>

          {loading ? (
            <p className="text-xs font-semibold text-gray-400 text-center py-8">Updating ledger...</p>
          ) : transactions.length === 0 ? (
            <p className="text-xs font-semibold text-gray-400 text-center py-8">No transaction logs have been written to this ledger yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-400 h-10">
                    <th className="pb-3">Transaction UUID</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Balance Before</th>
                    <th className="pb-3 text-right">Balance After</th>
                    <th className="pb-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50 text-xs font-semibold text-gray-600">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="h-12 hover:bg-gray-50/40">
                      <td className="font-mono text-gray-400 select-all">{tx.id}</td>
                      <td className="capitalize font-extrabold">{tx.type.replace('_', ' ')}</td>
                      <td className={`text-right font-black ${
                        ['deposit', 'escrow_release', 'refund'].includes(tx.type) ? 'text-emerald-600' : 'text-rose-500'
                      }`}>
                        {['deposit', 'escrow_release', 'refund'].includes(tx.type) ? '+' : '-'}€{tx.amount.toFixed(2)}
                      </td>
                      <td>
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                          {tx.status}
                        </span>
                      </td>
                      <td className="text-right text-gray-400 font-bold">€{tx.balance_before.toFixed(2)}</td>
                      <td className="text-right font-black text-gray-900">€{tx.balance_after.toFixed(2)}</td>
                      <td className="text-right text-gray-400 text-[10px] font-bold">{new Date(tx.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
