'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pet } from '@/types';
import PetCard from '@/components/PetCard';
import Link from 'next/link';
import { User, PlusCircle, Heart, Bell, Shield, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyPosts();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchMyPosts = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'pets'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setMyPets(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pet)));
    } catch (err) {
      console.warn('Dashboard fetch fallback', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h2 className="text-xl font-bold text-stone-800">ড্যাশবোর্ড দেখতে লগইন করুন</h2>
        <p className="text-sm text-stone-500 mt-2">আপনার করা সব রিপোর্ট ও পোস্ট পরিচালনা করতে লগইন আবশ্যক।</p>
        <Link
          href="/login"
          className="mt-6 inline-block bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md"
        >
          লগইন করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile Overview */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-amber-500"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-2xl">
              {profile?.displayName?.slice(0, 1) || 'U'}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">{profile?.displayName || 'ব্যবহারকারী'}</h1>
            <p className="text-xs sm:text-sm text-stone-500">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                {profile?.role === 'admin' ? 'অ্যাডমিন' : 'সদস্য'}
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/post-pet"
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-md transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>নতুন রিপোর্ট যোগ করুন</span>
        </Link>
      </div>

      {/* My Posts Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-stone-900">আমার প্রকাশিত রিপোর্টসমূহ ({myPets.length})</h2>

        {myPets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {myPets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
            <p className="text-stone-500 text-sm">আপনি এখনো কোনো পোস্ট বা রিপোর্ট প্রকাশ করেননি।</p>
            <Link
              href="/post-pet"
              className="mt-4 inline-flex items-center gap-2 text-amber-600 font-bold text-sm hover:underline"
            >
              <PlusCircle className="w-4 h-4" />
              প্রথম রিপোর্ট পোস্ট করুন
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
