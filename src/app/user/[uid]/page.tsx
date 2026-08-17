'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, Pet } from '@/types';
import RoleBadge from '@/components/RoleBadge';
import Navbar from '@/components/Navbar';
import PetCard from '@/components/PetCard';
import { 
  User, 
  MapPin, 
  Phone, 
  MessageCircle, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function PublicProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const resolvedParams = use(params);
  const uid = resolvedParams.uid;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileAndPosts();
  }, [uid]);

  const fetchProfileAndPosts = async () => {
    setLoading(true);
    try {
      // 1. Fetch User Profile
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setProfile({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
      } else {
        // Demo fallback
        setProfile({
          uid,
          displayName: 'কমিউনিটি সদস্য',
          email: '',
          role: 'user',
          bio: 'Pawtro কমিউনিটির একজন সক্রিয় পোষ্যপ্রেমী ও উদ্ধারকারী।',
          division: 'ঢাকা',
          area: 'ধানমন্ডি',
        });
      }

      // 2. Fetch User's Posts (Approved only for public view)
      try {
        const petsQuery = query(
          collection(db, 'pets'),
          where('userId', '==', uid),
          where('isApproved', '==', true)
        );
        const petSnaps = await getDocs(petsQuery);
        setUserPets(petSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Pet)));
      } catch {
        const fallbackQ = query(collection(db, 'pets'), where('userId', '==', uid));
        const petSnaps = await getDocs(fallbackQ);
        setUserPets(
          petSnaps.docs
            .map(d => ({ id: d.id, ...d.data() } as Pet))
            .filter(p => p.isApproved)
        );
      }
    } catch (err) {
      console.warn('Profile fetch fallback', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F7]">
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-amber-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F7F8F7]">
        <Navbar />
        <div className="max-w-xl mx-auto py-20 text-center px-4">
          <h2 className="text-xl font-bold text-stone-900">ব্যবহারকারী পাওয়া যায়নি</h2>
          <p className="text-stone-500 text-sm mt-2">এই অ্যাকাউন্টটি মুছে ফেলা হয়েছে বা প্রোফাইল লিংকটি ভুল।</p>
          <Link href="/" className="mt-5 inline-block text-amber-600 font-bold underline text-sm">
            হোমে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  const cleanPhone = profile.phone?.replace(/[^0-9+]/g, '');
  const cleanWa = profile.socialLinks?.whatsapp?.replace(/[^0-9]/g, '').replace(/^0/, '88');
  const hasSocial = Boolean(
    profile.socialLinks?.facebook || 
    profile.socialLinks?.instagram || 
    profile.socialLinks?.whatsapp || 
    cleanPhone
  );

  return (
    <div className="min-h-screen bg-[#F7F8F7]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-950 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ফিডে ফিরে যান</span>
        </Link>

        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
            <div className="flex items-center gap-5">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-stone-200 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-stone-900 text-white flex items-center justify-center text-3xl font-black shadow-inner">
                  {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
                    {profile.displayName}
                  </h1>
                  <RoleBadge role={profile.role || 'user'} size="sm" />
                </div>

                {(profile.area || profile.division) && (
                  <p className="text-xs sm:text-sm text-stone-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{profile.area ? `${profile.area}, ` : ''}{profile.division || 'বাংলাদেশ'}</span>
                  </p>
                )}

                {profile.role === 'volunteer' && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ভেরিফায়েড রেসকিউ ভলান্টিয়ার</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-6 pt-6 border-t border-stone-100">
              <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line bg-stone-50/70 p-4 rounded-2xl border border-stone-100">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Social Contact Buttons Section */}
          <div className="mt-6 pt-6 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
              যোগাযোগ ও সোশ্যাল মিডিয়া
            </h3>

            {hasSocial ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Facebook Button */}
                {profile.socialLinks?.facebook && (
                  <a
                    href={profile.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#0d65e0] text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
                  >
                    <span>📘 Facebook প্রোফাইল</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {/* Instagram Button */}
                {profile.socialLinks?.instagram && (
                  <a
                    href={profile.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
                  >
                    <span>📷 Instagram প্রোফাইল</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {/* WhatsApp Button */}
                {cleanWa && (
                  <a
                    href={`https://wa.me/${cleanWa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp-এ চ্যাট</span>
                  </a>
                )}

                {/* Direct Call Button (if phone provided) */}
                {cleanPhone && (
                  <a
                    href={`tel:${cleanPhone}`}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span>সরাসরি কল: {profile.phone}</span>
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400">এই ব্যবহারকারী কোনো সোশ্যাল মিডিয়া বা যোগাযোগ তথ্য যুক্ত করেননি।</p>
            )}
          </div>
        </div>

        {/* User's Posted Pets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>{profile.displayName}-এর পোস্টসমূহ ({userPets.length})</span>
            </h2>
          </div>

          {userPets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {userPets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center">
              <p className="text-stone-400 text-sm">এই ব্যবহারকারী এখনো কোনো পোস্ট বা রিপোর্ট প্রকাশ করেননি।</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
