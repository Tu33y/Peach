'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../api';
import { useAuthStore } from '../../store/authStore';
import { ShieldCheck, Upload, FileText, CheckCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function VerificationPage() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documentType, setDocumentType] = useState('passport');
  const [verificationType, setVerificationType] = useState('identity');

  // Admin reviewer list state
  const [adminRequests, setAdminRequests] = useState<any[]>([]);
  const [rejectReason, setRejectReason] = useState('');

  const fetchVerificationStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/verification/status');
      setStatus(res.data);

      if (user?.role === 'admin') {
        const adminRes = await api.get('/verification/admin/requests');
        if (Array.isArray(adminRes.data)) {
          setAdminRequests(adminRes.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVerificationStatus();
    }
  }, [user]);

  const handleConsent = async (type: string) => {
    try {
      await api.post('/verification/consent', {
        consent_type: type,
        version: 'v1.0',
        ip_address: '127.0.0.1'
      });
      alert(`Consent recorded successfully! Logged in secure environment.`);
      fetchVerificationStatus();
    } catch (e) {
      alert('Failed to log consent');
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('type', verificationType);
      await api.post('/verification/submit-verification', formData);
      alert('Verification request submitted successfully! Moderators will review within 24 hours.');
      fetchVerificationStatus();
    } catch (e) {
      alert('Request submission failed');
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('file', files[0]);
      await api.post('/verification/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Document uploaded successfully! Transmitted securely over HTTPS.');
      fetchVerificationStatus();
    } catch (e) {
      alert('Document upload failed');
    }
  };

  const handleAdminApprove = async (requestId: string) => {
    try {
      const formData = new FormData();
      formData.append('reason', 'Approved by administrator');
      await api.post(`/verification/admin/approve/${requestId}`, formData);
      alert('Request approved successfully!');
      fetchVerificationStatus();
    } catch (e) {
      alert('Approval failed');
    }
  };

  const handleAdminReject = async (requestId: string) => {
    if (!rejectReason) {
      alert('Please specify a rejection reason');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('reason', rejectReason);
      await api.post(`/verification/admin/reject/${requestId}`, formData);
      setRejectReason('');
      alert('Request rejected successfully!');
      fetchVerificationStatus();
    } catch (e) {
      alert('Rejection failed');
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-20 text-center font-semibold text-gray-500">
          Please log in to complete identity verification.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

        {/* Banner */}
        <div className="bg-gradient-to-r from-rose-500 to-amber-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-rose-500/10">
          <div className="relative z-10 max-w-lg space-y-2">
            <span className="text-xs font-black tracking-widest uppercase text-white/80 block">Compliance & Identity</span>
            <h1 className="text-3xl font-black tracking-tight leading-none">Safe Marketplace Verification</h1>
            <p className="text-sm text-white/90 font-medium leading-relaxed">
              In accordance with German regulations and privacy acts, we keep our community secure with strict identity, adult and consent tracking checks.
            </p>
          </div>
          <span className="absolute right-8 bottom-4 text-9xl select-none opacity-10">🛡️</span>
        </div>

        {/* Status Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* USER VERIFICATION SUMMARY */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Credentials Summary</h3>

            {loading ? (
              <p className="text-xs font-semibold text-gray-400">Loading status...</p>
            ) : status ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs font-black uppercase text-gray-400">Adult Verification (18+)</span>
                  <div className="flex items-center space-x-1.5 font-bold text-xs">
                    {status.is_adult_verified ? (
                      <span className="text-emerald-600 flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Not Verified</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs font-black uppercase text-gray-400">Identity Document Status</span>
                  <div className="flex items-center space-x-1.5 font-bold text-xs">
                    {status.identity_verified ? (
                      <span className="text-emerald-600 flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Not Verified</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs font-black uppercase text-gray-400">Global System Badge</span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                    status.verification_status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {status.verification_status}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* DOCUMENT SUBMISSIONS & CONSENTS */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Compliance & Actions</h3>

            <form onSubmit={handleSubmitRequest} className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Verification Request Type</label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-xs bg-white"
                  value={verificationType}
                  onChange={(e) => setVerificationType(e.target.value)}
                >
                  <option value="identity">Official Identity Check</option>
                  <option value="age">Adult Age Check (18+)</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-3.5 rounded-2xl text-xs transition-all shadow-md"
              >
                Submit Verification Request
              </button>
            </form>

            <div className="h-px bg-gray-50/60 my-6"></div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">Upload Passport or ID Card Image</label>
              <div className="relative">
                <input
                  type="file"
                  id="docFile"
                  className="hidden"
                  onChange={handleUploadDocument}
                />
                <label
                  htmlFor="docFile"
                  className="border-2 border-dashed border-gray-200 hover:border-rose-400 rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5"
                >
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-xs font-extrabold text-gray-800">Select official file</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ADMIN REQUESTS AUDIT TABLE VIEW */}
        {user.role === 'admin' && (
          <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Admin Reviews Workbench ({adminRequests.length})</h3>

            {adminRequests.length === 0 ? (
              <p className="text-xs font-semibold text-gray-400 text-center py-6">No pending compliance review requests.</p>
            ) : (
              <div className="space-y-4">
                {adminRequests.map((req) => (
                  <div key={req.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400">Request: {req.id}</span>
                      <h4 className="text-sm font-black text-gray-900 capitalize mt-1">Type: {req.type} Verification</h4>
                      <p className="text-xs text-gray-400 mt-1 font-semibold">User: {req.user_id}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="text"
                        placeholder="Rejection reason..."
                        className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <button
                        onClick={() => handleAdminApprove(req.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition-all shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAdminReject(req.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition-all shadow-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
