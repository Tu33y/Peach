'use client';

import React, { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../api';
import { useRouter } from 'next/navigation';
import { ShieldCheck, User, Briefcase, FileText, CheckCircle, Upload } from 'lucide-react';

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: Credentials, 2: Role, 3: Seller Compliance Verification
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [isAdult, setIsAdult] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [documentType, setDocumentType] = useState('passport');
  const [docFileUrl, setDocFileUrl] = useState('https://peach-platform.com/uploads/sample_id.png');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3 || password.length < 6) {
      setError('Username must be at least 3 chars and password at least 6 chars');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    if (selectedRole === 'provider') {
      setStep(3);
    } else {
      submitRegistration('client');
    }
  };

  const handleSellerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdult) {
      setError('You must confirm you are of legal age (18+) to sell on Peach Platform.');
      return;
    }
    if (!consentTerms || !consentPrivacy) {
      setError('You must accept Peach Platform terms and privacy regulations.');
      return;
    }
    setError('');
    submitRegistration('provider');
  };

  const submitRegistration = async (finalRole: string) => {
    setLoading(true);
    setError('');
    try {
      // 1. Submit auth registration
      const regRes = await api.post('/auth/register', {
        username,
        password,
        role: finalRole,
        accepted_terms: consentTerms,
        accepted_privacy: consentPrivacy,
        consent_version: 'v1.0'
      });

      // 2. If provider, submit mock document & verification request
      if (finalRole === 'provider') {
        const loginRes = await api.post('/auth/login', { username, password });
        const token = loginRes.data.access_token;

        const authHeaders = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        // Create document form-data
        const formDataDoc = new FormData();
        formDataDoc.append('document_type', documentType);
        // Create simple dummy file blob for uploads
        const fileBlob = new Blob(['dummy_content'], { type: 'image/png' });
        formDataDoc.append('file', fileBlob, 'passport.png');

        await api.post('/verification/upload-document', formDataDoc, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        // Submit age request
        const formDataAge = new FormData();
        formDataAge.append('type', 'age');
        await api.post('/verification/submit-verification', formDataAge, authHeaders);

        // Submit identity request
        const formDataIdent = new FormData();
        formDataIdent.append('type', 'identity');
        await api.post('/verification/submit-verification', formDataIdent, authHeaders);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Onboarding failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto bg-white border border-gray-100 p-10 rounded-3xl shadow-xl shadow-gray-100/50 mt-12">

        {/* Onboarding Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-3">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`h-2.5 w-12 rounded-full transition-all ${
                  step >= s ? 'bg-rose-500' : 'bg-gray-100'
                }`}
              />
            ))}
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Onboarding</h1>
          <p className="text-sm text-gray-400 font-semibold mt-1">Get started on Germany's safest marketplace</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold p-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-8">
            <span className="text-6xl block mb-4">🎉</span>
            <h3 className="text-2xl font-black text-emerald-600">Onboarding Complete!</h3>
            <p className="text-sm text-gray-400 font-semibold mt-2">
              Your credentials are registered. Redirecting to login...
            </p>
          </div>
        ) : (
          <>
            {/* STEP 1: Enter Username / Password */}
            {step === 1 && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black tracking-wider uppercase text-gray-400 mb-2">Username</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm transition-all"
                    placeholder="E.g. alex_berlin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black tracking-wider uppercase text-gray-400 mb-2">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm transition-all"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-4 rounded-2xl transition-all shadow-md text-sm sm:text-base"
                >
                  Continue
                </button>
              </form>
            )}

            {/* STEP 2: Account Role Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <span className="block text-xs font-black tracking-wider uppercase text-gray-400 mb-4 text-center">
                  Select your Account Type
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* CLIENT */}
                  <div
                    onClick={() => handleRoleSelect('client')}
                    className="border border-gray-100 bg-white hover:border-rose-300 p-8 rounded-3xl cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between h-56 text-left group"
                  >
                    <span className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold">
                      <User className="h-6 w-6" />
                    </span>
                    <div>
                      <h4 className="text-lg font-black text-gray-900 leading-snug group-hover:text-rose-500 transition-colors">
                        Client Account
                      </h4>
                      <p className="text-xs text-gray-400 font-semibold mt-1">
                        Book local services, schedule sessions, and protect your budget with Escrow.
                      </p>
                    </div>
                  </div>

                  {/* SELLER */}
                  <div
                    onClick={() => handleRoleSelect('provider')}
                    className="border border-gray-100 bg-white hover:border-rose-300 p-8 rounded-3xl cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between h-56 text-left group"
                  >
                    <span className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
                      <Briefcase className="h-6 w-6" />
                    </span>
                    <div>
                      <h4 className="text-lg font-black text-gray-900 leading-snug group-hover:text-amber-500 transition-colors">
                        Seller / Provider
                      </h4>
                      <p className="text-xs text-gray-400 font-semibold mt-1">
                        List services, schedule times, receive payouts securely, and unlock professional badge levels.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Compliance & Document Verification (Sellers Only) */}
            {step === 3 && (
              <form onSubmit={handleSellerSubmit} className="space-y-6">
                <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                  <h4 className="text-sm font-black text-rose-800 uppercase tracking-wider mb-2">Compliance Regulations (German Market)</h4>
                  <p className="text-xs text-rose-600 leading-relaxed font-semibold">
                    To maintain safety, German regulations require and enforce verified seller age, verified identity documentation, and formal platform consent logs before starting lists.
                  </p>
                </div>

                {/* Confirm age */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="isAdult"
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    checked={isAdult}
                    onChange={(e) => setIsAdult(e.target.checked)}
                  />
                  <label htmlFor="isAdult" className="text-xs font-bold text-gray-700 leading-normal">
                    I confirm that I am at least 18 years of age and hold legal capacity to provide physical services in Germany.
                  </label>
                </div>

                {/* Upload document */}
                <div>
                  <label className="block text-xs font-black tracking-wider uppercase text-gray-400 mb-2">
                    Identity Verification Document
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm transition-all mb-4"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                  >
                    <option value="passport">Passport</option>
                    <option value="id_card">National ID Card</option>
                    <option value="driver_license">Driver's License</option>
                  </select>

                  <div className="border-2 border-dashed border-gray-200 hover:border-rose-400 rounded-3xl p-8 text-center cursor-pointer transition-all">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm font-extrabold text-gray-800 block">Select image or PDF</span>
                    <span className="text-xs text-gray-400 font-semibold mt-1 block">Max size 10MB. Transmitted over SSL.</span>
                  </div>
                </div>

                {/* Consents and terms */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="consentTerms"
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      checked={consentTerms}
                      onChange={(e) => setConsentTerms(e.target.checked)}
                    />
                    <label htmlFor="consentTerms" className="text-xs font-bold text-gray-500 leading-normal">
                      I accept Peach Platform's general terms of service, platform rules, and billing commissions.
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="consentPrivacy"
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      checked={consentPrivacy}
                      onChange={(e) => setConsentPrivacy(e.target.checked)}
                    />
                    <label htmlFor="consentPrivacy" className="text-xs font-bold text-gray-500 leading-normal">
                      I accept Peach Platform's GDPR compliant Privacy Policy. My personal documents are protected and kept safe in secure local environments.
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-4 rounded-2xl transition-all shadow-md shadow-rose-500/20 text-sm sm:text-base disabled:opacity-50"
                >
                  {loading ? 'Submitting Documents...' : 'Agree & Finish Onboarding'}
                </button>
              </form>
            )}
          </>
        )}

        <div className="mt-8 text-center text-sm font-semibold text-gray-400">
          <span>Already have an account? </span>
          <a href="/login" className="text-rose-500 hover:underline">Sign In &rarr;</a>
        </div>
      </div>
    </Layout>
  );
}
