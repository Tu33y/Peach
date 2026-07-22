'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, Star, MapPin, Globe, Calendar, MessageSquare } from 'lucide-react';

export default function PublicProfilePage() {
  const { id } = useParams() || {};
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/v1/profiles/${id}/public`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-12 space-y-6">
          <div className="h-20 bg-gray-100 rounded-3xl animate-pulse w-1/3"></div>
          <div className="h-48 bg-gray-100 rounded-3xl animate-pulse"></div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-20 text-center font-semibold text-gray-500">
          User profile not found.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

        {/* Profile Card Header */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
          <div className="h-24 w-24 bg-rose-500 rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-lg shadow-rose-500/20">
            {profile.username?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-grow space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
                {profile.username}
              </h1>
              {profile.badge_verified && (
                <div className="inline-flex items-center space-x-1 bg-rose-50 text-rose-500 px-3 py-1 rounded-full text-xs font-bold border border-rose-100/50 self-center">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Verified Professional</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs font-bold text-gray-400">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-gray-800 text-sm font-black">{profile.rating_average || '5.0'}</span>
                <span>Average Rating</span>
              </div>
              <div className="h-4 w-px bg-gray-100"></div>
              <div className="flex items-center space-x-1">
                <span className="text-rose-500 text-sm font-black">{profile.reputation_score || '100.0'}</span>
                <span>Reputation Score</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 font-semibold leading-relaxed max-w-xl">
              {profile.description || 'Verified local services seller on Peach Platform. Passionate about quality, safety, and client happiness.'}
            </p>
          </div>

          <div className="shrink-0 pt-4 sm:pt-0">
            <button
              onClick={() => router.push(`/chat?recipient_id=${profile.id}`)}
              className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs transition-all shadow-md flex items-center space-x-2"
            >
              <MessageSquare className="h-4.5 w-4.5" />
              <span>Contact Seller</span>
            </button>
          </div>
        </div>

        {/* Dynamic Schedule Availability */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Services offered list */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Active Services ({profile.services?.length || 0})</h3>

            {profile.services?.length === 0 ? (
              <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center text-gray-400 font-semibold text-sm">
                This seller has no active service listings.
              </div>
            ) : (
              <div className="space-y-4">
                {profile.services?.map((s: any) => (
                  <div key={s.id} className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all flex justify-between items-center hover:scale-[1.01]">
                    <div>
                      <h4 className="font-extrabold text-gray-900 hover:text-rose-500 transition-colors cursor-pointer text-base leading-snug">
                        {s.title}
                      </h4>
                      <p className="text-xs text-gray-400 font-semibold mt-1 line-clamp-1">{s.description}</p>

                      <div className="flex items-center space-x-3 text-xs text-gray-500 font-bold mt-3">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <span>{s.city || 'Berlin Mitte'}</span>
                        </div>
                        {s.languages && (
                          <>
                            <div className="h-3 w-px bg-gray-200"></div>
                            <div className="flex items-center space-x-1">
                              <Globe className="h-3.5 w-3.5 text-gray-400" />
                              <span>{s.languages}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-gray-400 font-bold block mb-1">Starting at</span>
                      <span className="text-xl font-black text-gray-900">€{s.price.toFixed(2)}</span>
                      <button
                        onClick={() => router.push(`/services/${s.id}`)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold px-4 py-2 rounded-xl text-xs transition-all mt-2.5 block w-full"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Calendar widget */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 h-fit">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-50">
              <Calendar className="h-4.5 w-4.5 text-rose-500" />
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-wide">Weekly Availability</h4>
            </div>

            {profile.availability?.length === 0 ? (
              <p className="text-xs text-gray-400 font-semibold text-center py-4">No custom schedule specified.</p>
            ) : (
              <div className="space-y-3">
                {profile.availability?.map((a: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-gray-400 font-extrabold">{a.day}</span>
                    <span className={`px-2.5 py-1 rounded-lg ${a.available ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-400'}`}>
                      {a.available ? `${a.start_time} - ${a.end_time}` : 'Unavailable'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Client Reviews Section */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-6">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Ratings & Reviews</h3>

          {profile.reviews?.length === 0 ? (
            <p className="text-xs font-semibold text-gray-400 py-4 text-center">No reviews submitted yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {profile.reviews?.map((r: any, idx: number) => (
                <div key={idx} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center space-x-1.5 mb-2.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4.5 w-4.5 ${
                          star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed mb-3 italic">
                    "{r.comment || 'Perfect, highly professional services!'}"
                  </p>
                  <span className="text-[10px] text-gray-400 font-black tracking-wider uppercase">Anonymous Client</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
