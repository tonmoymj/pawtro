'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { ShieldCheck, Phone, MapPin, Loader2, HeartHandshake } from 'lucide-react';
import Link from 'next/link';

interface Org {
  id: string;
  name: string;
  area: string;
  phone: string;
  description: string;
  verified?: boolean;
}

export default function RescueTeamsPage() {
  const [teams, setTeams] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'organizations'));
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Org)));
    } catch (err) {
      console.warn('Organizations fetch notice', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">ভেরিফায়েড রেসকিউ টিম ও শেল্টার</h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            জরুরি উদ্ধারে অভিজ্ঞ ও নিবেদিত স্বেচ্ছাসেবক দলের সাথে যোগাযোগ করুন
          </p>
        </div>

        {loading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
          </div>
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teams.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg text-stone-900">{t.name}</h3>
                    {t.verified && (
                      <span title="ভেরিফায়েড">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t.area}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                {t.phone && (
                  <div className="pt-5 mt-4 border-t border-stone-100">
                    <a
                      href={`tel:${t.phone}`}
                      className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-900 font-semibold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      <span>কল করুন: {t.phone}</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border border-stone-200 shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
              🦺
            </div>
            <h3 className="text-lg font-bold text-stone-800">কোনো রেসকিউ টিম তালিকাভুক্ত নেই</h3>
            <p className="text-stone-500 text-xs sm:text-sm max-w-md mx-auto">
              অ্যাডমিন প্যানেল থেকে অনুমোদিত প্রাণী কল্যাণ সংস্থা ও উদ্ধারকারী দলের তথ্য যুক্ত করা যাবে।
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
