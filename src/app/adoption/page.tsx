'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pet } from '@/types';
import PetCard from '@/components/PetCard';
import Navbar from '@/components/Navbar';
import { HeartHandshake, Sparkles, Loader2, Heart, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AdoptionPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdoptionPets();
  }, []);

  const fetchAdoptionPets = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'pets'),
        where('isApproved', '==', true),
        where('type', '==', 'adoption'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setPets(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pet)));
    } catch (err) {
      console.warn('Adoption fetch fallback', err);
      // Fallback query without orderBy index requirement if index not yet built
      try {
        const fallbackQ = query(
          collection(db, 'pets'),
          where('isApproved', '==', true),
          where('type', '==', 'adoption')
        );
        const fallbackSnap = await getDocs(fallbackQ);
        setPets(fallbackSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Pet)));
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl mb-10">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>ফ্রি দত্তক প্রোগ্রাম</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">একটি নিঃসঙ্গ প্রাণীকে নতুন জীবন দিন</h1>
            <p className="text-amber-100 text-xs sm:text-base leading-relaxed">
              পোষা প্রাণী কেনাবেচা নয়, দত্তক নেওয়াই ভালোবাসার পরিচয়। Pawtro-তে সব প্রাণীর দত্তক সম্পূর্ণ বিনামূল্যে।
            </p>
            <div className="pt-2">
              <Link
                href="/post-pet?type=adoption"
                className="inline-flex items-center gap-2 bg-white text-amber-800 hover:bg-stone-100 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4 text-amber-700" />
                <span>দত্তক দেওয়ার পোস্ট প্রকাশ করুন</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Real-time Pets Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-stone-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-600" />
              <span>দত্তকের জন্য উপলব্ধ পোষ্যবৃন্দ ({pets.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="min-h-[30vh] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
            </div>
          ) : pets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {pets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border border-stone-200 shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                🐾
              </div>
              <h3 className="text-lg font-bold text-stone-800">বর্তমানে দত্তকের কোনো সক্রিয় পোস্ট নেই</h3>
              <p className="text-stone-500 text-xs sm:text-sm max-w-md mx-auto">
                আপনার কোনো বিড়াল, কুকুর বা পোষা প্রাণী দত্তক দেওয়ার থাকলে প্রথম পোস্টটি প্রকাশ করুন।
              </p>
              <div className="pt-2">
                <Link
                  href="/post-pet?type=adoption"
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>দত্তক পোস্ট করুন</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
