'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import { Building2, Phone, MapPin, Clock, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';

interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours?: string;
  division?: string;
}

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'clinics'));
      setClinics(snap.docs.map(d => ({ id: d.id, ...d.data() } as Clinic)));
    } catch (err) {
      console.warn('Clinics fetch notice', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-6">
          <BackButton fallbackUrl="/" label="প্রধান ফিডে ফিরে যান" />
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">জরুরি ভেট ক্লিনিক ডিরেক্টরি</h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            জরুরি অবস্থায় আপনার নিকটস্থ পশু হাসপাতাল বা ক্লিনিকে যোগাযোগ করুন
          </p>
        </div>

        {loading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
          </div>
        ) : clinics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clinics.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-lg text-stone-900">{c.name}</h3>
                  {c.division && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                      {c.division}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs sm:text-sm text-stone-600">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{c.address}</span>
                  </p>
                  {c.hours && (
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>{c.hours}</span>
                    </p>
                  )}
                </div>

                {c.phone && (
                  <div className="pt-3 border-t border-stone-100">
                    <a
                      href={`tel:${c.phone}`}
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{c.phone}</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border border-stone-200 shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
              🏥
            </div>
            <h3 className="text-lg font-bold text-stone-800">কোনো ক্লিনিক তথ্য যুক্ত করা হয়নি</h3>
            <p className="text-stone-500 text-xs sm:text-sm max-w-md mx-auto">
              অ্যাডমিন প্যানেল থেকে অনুমোদিত ও বিশ্বস্ত ভেট ক্লিনিকের তথ্য যুক্ত করা যাবে।
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
