'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pet, AppNotification } from '@/types';
import PetCard from '@/components/PetCard';
import RoleBadge from '@/components/RoleBadge';
import BackButton from '@/components/BackButton';
import { deletePetImage } from '@/lib/image-upload';
import Link from 'next/link';
import { 
  User, 
  PlusCircle, 
  Heart, 
  Bell, 
  Shield, 
  Loader2, 
  Settings, 
  FileText, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Trash2,
  ExternalLink,
  Save,
  Award,
  AlertTriangle,
  HeartHandshake,
  CheckCircle,
  Clock
} from 'lucide-react';

const DIVISIONS = ['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'];

export default function DashboardPage() {
  const { user, profile, loading: authLoading, updateUserProfile } = useAuth();
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [volunteerPets, setVolunteerPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'volunteer' | 'profile' | 'notifications'>('posts');

  // Form states for profile editing
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [division, setDivision] = useState('ঢাকা');
  const [area, setArea] = useState('');
  const [bio, setBio] = useState('');
  const [fbLink, setFbLink] = useState('');
  const [igLink, setIgLink] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Notification states (preferences)
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifSight, setNotifSight] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);
  const [notifRemind, setNotifRemind] = useState(true);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  // In-app notifications (inbox)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [markingRead, setMarkingRead] = useState(false);

  const isVolunteerOrAdmin = profile?.role === 'volunteer' || profile?.role === 'admin' || profile?.role === 'superadmin';

  useEffect(() => {
    if (user) {
      fetchMyPosts();
      if (isVolunteerOrAdmin) {
        fetchVolunteerFeed();
      }
      if (profile) {
        setName(profile.displayName || '');
        setPhone(profile.phone || '');
        setDivision(profile.division || 'ঢাকা');
        setArea(profile.area || '');
        setBio(profile.bio || '');
        setFbLink(profile.socialLinks?.facebook || '');
        setIgLink(profile.socialLinks?.instagram || '');
        setWaNumber(profile.socialLinks?.whatsapp || '');
        if (profile.notifPrefs) {
          setNotifMatch(profile.notifPrefs.match ?? true);
          setNotifSight(profile.notifPrefs.sight ?? true);
          setNotifDigest(profile.notifPrefs.digest ?? false);
          setNotifRemind(profile.notifPrefs.remind ?? true);
        }
      }

      // Real-time notification inbox
      const nq = query(
        collection(db, 'users', user.uid, 'notifications'),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(nq, (snap) => {
        setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
      }, () => {});
      return () => unsub();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, profile, authLoading, isVolunteerOrAdmin]);

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

  const fetchVolunteerFeed = async () => {
    try {
      const q = query(collection(db, 'pets'), where('isApproved', '==', true), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const allPets = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pet));
      // Show emergency or found or active cases that are approved
      setVolunteerPets(allPets.filter(p => p.isApproved && (p.status !== 'resolved' || p.rescueClaim?.volunteerId === user?.uid)));
    } catch (err) {
      console.warn('Volunteer feed fallback', err);
      try {
        const fallbackQ = query(collection(db, 'pets'), where('isApproved', '==', true));
        const snap = await getDocs(fallbackQ);
        const allPets = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pet));
        setVolunteerPets(allPets.filter(p => p.isApproved && (p.status !== 'resolved' || p.rescueClaim?.volunteerId === user?.uid)));
      } catch {}
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSuccess(false);
    try {
      await updateUserProfile({
        displayName: name.trim(),
        phone: phone.trim(),
        division,
        area: area.trim(),
        bio: bio.trim(),
        socialLinks: {
          facebook: fbLink.trim() || undefined,
          instagram: igLink.trim() || undefined,
          whatsapp: waNumber.trim() || undefined,
        },
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('প্রোফাইল সংরক্ষণে সমস্যা হয়েছে।');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    setSavingNotifs(true);
    setNotifSuccess(false);
    try {
      await updateUserProfile({
        notifPrefs: {
          match: notifMatch,
          sight: notifSight,
          digest: notifDigest,
          remind: notifRemind,
        },
      });
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('নোটিফিকেশন সেটিং সংরক্ষণে সমস্যা হয়েছে।');
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleMarkResolved = async (petId: string) => {
    if (!confirm('আপনি কি এই পোষ্যটির কেস সম্পন্ন/সমাধান হয়েছে চিহ্নিত করতে চান?')) return;
    try {
      await updateDoc(doc(db, 'pets', petId), {
        status: 'resolved',
        updatedAt: serverTimestamp(),
      });
      setMyPets((prev) => prev.map((p) => (p.id === petId ? { ...p, status: 'resolved' } : p)));
      setVolunteerPets((prev) => prev.map((p) => (p.id === petId ? { ...p, status: 'resolved' } : p)));
    } catch (err) {
      console.error(err);
      alert('স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে।');
    }
  };

  const handleDeletePost = async (petId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই পোস্টটি চিরতরে মুছে ফেলতে চান?')) return;
    const petToDelete = myPets.find((p) => p.id === petId);
    try {
      await deleteDoc(doc(db, 'pets', petId));
      setMyPets((prev) => prev.filter((p) => p.id !== petId));
      if (petToDelete?.images) {
        for (const img of petToDelete.images) {
          if (typeof img === 'object' && (img as any)?.path) {
            await deletePetImage((img as any).path);
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert('পোস্ট মুছতে সমস্যা হয়েছে।');
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
        <p className="text-sm text-stone-500 mt-2">আপনার করা সব রিপোর্ট ও প্রোফাইল পরিচালনা করতে লগইন আবশ্যক।</p>
        <Link
          href="/login"
          className="mt-6 inline-block bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all"
        >
          লগইন করুন
        </Link>
      </div>
    );
  }

  const resolvedCount = myPets.filter((p) => p.status === 'resolved').length;
  const activeCount = myPets.length - resolvedCount;
  const myClaimedRescues = volunteerPets.filter(p => p.rescueClaim?.volunteerId === user?.uid);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Top Back Navigation */}
      <div className="mb-5">
        <BackButton fallbackUrl="/" label="হোমে ফিরে যান" />
      </div>
      
      {/* Profile Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200 shadow-sm mb-6 sm:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-500 shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-sm shrink-0">
              {profile?.displayName?.slice(0, 1) || 'U'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900">{profile?.displayName || 'ব্যবহারকারী'}</h1>
              <RoleBadge role={profile?.role || 'user'} size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{profile?.email}</p>
            {profile?.phone && (
              <p className="text-xs text-stone-600 mt-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span>{profile.phone}</span>
                {profile?.area && <span>• {profile.area}, {profile.division}</span>}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {(profile?.role === 'admin' || profile?.role === 'superadmin') && (
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 bg-[#1D6B5F] hover:bg-[#15544a] text-white px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all flex-1 sm:flex-initial"
            >
              <Shield className="w-4 h-4" />
              <span>অ্যাডমিন কমান্ড সেন্টার</span>
            </Link>
          )}
          <Link
            href="/post-pet"
            className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all flex-1 sm:flex-initial"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন পোস্ট করুন</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] sm:text-xs font-semibold text-stone-400 uppercase">আমার রিপোর্ট</span>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">{myPets.length}</h3>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 uppercase">উদ্ধার / ঘরে ফিরেছে</span>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</h3>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] sm:text-xs font-semibold text-amber-600 uppercase">সক্রিয় কেস</span>
          <h3 className="text-xl sm:text-2xl font-black text-amber-700 mt-1">{activeCount}</h3>
        </div>
        {isVolunteerOrAdmin && (
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/30 col-span-2 sm:col-span-1">
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 uppercase">রেসকিউ মিশন</span>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-800 mt-1">{myClaimedRescues.length}</h3>
          </div>
        )}
      </div>

      {/* Navigation Tabs (Scrollable on Mobile) */}
      <div className="flex border-b border-stone-200 mb-6 gap-3 sm:gap-6 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'posts'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>আমার পোস্টসমূহ ({myPets.length})</span>
        </button>

        {isVolunteerOrAdmin && (
          <button
            onClick={() => setActiveTab('volunteer')}
            className={`pb-3 font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'volunteer'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-600" />
            <span>রেসকিউ হাব 🦺</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>প্রোফাইল সেটিংস</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'notifications'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <Bell className="w-4 h-4" />
            {notifications.some(n => !n.read) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
          <span>নোটিফিকেশন</span>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: My Posts */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {myPets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {myPets.map((pet) => (
                <div key={pet.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="p-4 flex gap-3.5 items-start">
                    <img
                      src={
                        (typeof pet.images?.[0] === 'string'
                          ? pet.images[0]
                          : pet.images?.[0]?.url) ||
                        (pet.species === 'cat'
                          ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400'
                          : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400')
                      }
                      alt={pet.petName || 'Pet'}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 bg-stone-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pet.type === 'lost' ? 'bg-red-100 text-red-700' : pet.type === 'found' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {pet.type === 'lost' ? 'হারিয়েছে' : pet.type === 'found' ? 'পাওয়া গেছে' : 'দত্তক'}
                        </span>
                        {pet.status === 'resolved' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-full">
                            সমাধান হয়েছে
                          </span>
                        ) : !pet.isApproved ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            পর্যালোচনায় আছে (অনুমোদন বাকি)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                            লাইভ ফিডে অনুমোদিত ✅
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-stone-900 text-sm mt-1.5 truncate">
                        {pet.petName || (pet.species === 'cat' ? 'বিড়াল' : 'কুকুর')}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{pet.area || pet.division}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                    <Link
                      href={`/pet/${pet.id}`}
                      className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>বিস্তারিত</span>
                    </Link>

                    <div className="flex items-center gap-2">
                      {pet.status !== 'resolved' && pet.id && (
                        <button
                          onClick={() => handleMarkResolved(pet.id!)}
                          className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg transition-colors text-[11px]"
                        >
                          ঘরে ফিরেছে ✅
                        </button>
                      )}
                      {pet.id && (
                        <button
                          onClick={() => handleDeletePost(pet.id!)}
                          title="মুছে ফেলুন"
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200 p-10 sm:p-12 text-center">
              <p className="text-stone-500 text-sm">আপনি এখনো কোনো পোস্ট বা রিপোর্ট প্রকাশ করেননি।</p>
              <Link
                href="/post-pet"
                className="mt-4 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>প্রথম রিপোর্ট পোস্ট করুন</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB: Volunteer Rescue Hub */}
      {activeTab === 'volunteer' && isVolunteerOrAdmin && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-emerald-950">স্বেচ্ছাসেবক রেসকিউ ফিড (Rescue Hub)</h2>
                <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                  আশেপাশের জরুরি কেস ও পাওয়া প্রাণীদের উদ্ধার সমন্বয়ে সহায়তা করুন।
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {volunteerPets.length > 0 ? (
              volunteerPets.map((pet) => (
                <div key={pet.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="p-4 flex gap-3.5 items-start">
                    <img
                      src={
                        (typeof pet.images?.[0] === 'string'
                          ? pet.images[0]
                          : pet.images?.[0]?.url) ||
                        (pet.species === 'cat'
                          ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400'
                          : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400')
                      }
                      alt={pet.petName || 'Pet'}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 bg-stone-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pet.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {pet.type === 'lost' ? 'হারানো' : 'পাওয়া গেছে'}
                        </span>
                        {pet.rescueClaim && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-700 text-white rounded-full">
                            রেসকিউ টিম ক্লেইমড
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-stone-900 text-sm mt-1.5 truncate">
                        {pet.petName || (pet.species === 'cat' ? 'অচেনা বিড়াল' : 'অচেনা কুকুর')}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{pet.area}, {pet.division}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
                    <Link
                      href={`/pet/${pet.id}`}
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold"
                    >
                      <span>রেসকিউ পৃষ্ঠা দেখুন</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    {pet.contactPhone && (
                      <a
                        href={`tel:${pet.contactPhone}`}
                        className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 rounded-lg text-stone-800 font-semibold text-[11px] flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>কল</span>
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center col-span-full">
                <p className="text-stone-500 text-sm">বর্তমানে কোনো পেন্ডিং রেসকিউ কেস নেই।</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-3xl p-5 sm:p-8 border border-stone-200 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900 mb-1">আপনার প্রোফাইল তথ্য</h2>
          <p className="text-xs sm:text-sm text-stone-500 mb-6">জরুরি প্রয়োজনে যোগাযোগের জন্য সঠিক তথ্য প্রদান করুন</p>

          {profileSuccess && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">আপনার নাম</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">ইমেইল ঠিকানা (অপরিবর্তনযোগ্য)</label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm text-stone-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">ফোন নম্বর (জরুরি যোগাযোগের জন্য)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="যেমন: 017XXXXXXXX"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">বিভাগ</label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {DIVISIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">থানা / এলাকা</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="যেমন: ধানমন্ডি, ঢাকা"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">সংক্ষিপ্ত বায়ো (Bio)</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="নিজের সম্পর্কে বা প্রাণিপ্রেম নিয়ে কিছু লিখুন..."
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Social Media Links Section */}
            <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <p className="text-xs font-bold text-stone-700 uppercase tracking-wide">সোশ্যাল মিডিয়া লিংক (যোগাযোগের জন্য)</p>
              <p className="text-[11px] text-stone-400 -mt-1">ফোন নম্বর দিতে না চাইলে এখানে সোশ্যাল লিংক দিন — পোস্টে ক্লিকযোগ্য বাটন দিয়ে দেখানো হবে।</p>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">📘 Facebook Profile URL</label>
                <input
                  type="url"
                  value={fbLink}
                  onChange={(e) => setFbLink(e.target.value)}
                  placeholder="https://facebook.com/yourname"
                  className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">📷 Instagram Profile URL</label>
                <input
                  type="url"
                  value={igLink}
                  onChange={(e) => setIgLink(e.target.value)}
                  placeholder="https://instagram.com/yourname"
                  className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">💬 WhatsApp নম্বর (01XXXXXXXXX)</label>
                <input
                  type="tel"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>পরিবর্তন সংরক্ষণ করুন</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="max-w-2xl space-y-6">

          {/* In-App Notification Inbox */}
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-stone-900">নোটিফিকেশন ইনবক্স</h2>
                <p className="text-xs text-stone-500 mt-0.5">আপনার পোস্টে নতুন মন্তব্য বা আপডেটের বিজ্ঞপ্তি</p>
              </div>
              {notifications.some(n => !n.read) && (
                <button
                  onClick={async () => {
                    if (!user) return;
                    setMarkingRead(true);
                    try {
                      const batch = writeBatch(db);
                      notifications.filter(n => !n.read).forEach(n => {
                        if (n.id) batch.update(doc(db, 'users', user.uid, 'notifications', n.id), { read: true });
                      });
                      await batch.commit();
                    } catch {}
                    setMarkingRead(false);
                  }}
                  disabled={markingRead}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  সব পঠিত মার্ক করুন
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-stone-400 text-sm">এখনো কোনো নোটিফিকেশন নেই।</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-colors ${
                      n.read ? 'bg-stone-50 border-stone-100' : 'bg-amber-50 border-amber-200 shadow-xs'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-stone-300' : 'bg-red-500 animate-pulse'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${n.read ? 'text-stone-600' : 'text-stone-900 font-semibold'}`}>
                        {n.message}
                      </p>
                      {n.petId && (
                        <Link
                          href={`/pet/${n.petId}`}
                          className="text-xs text-amber-700 font-bold hover:underline mt-1 inline-block"
                        >
                          পোস্ট দেখুন →
                        </Link>
                      )}
                    </div>
                    {!n.read && n.id && (
                      <button
                        onClick={async () => {
                          if (!user || !n.id) return;
                          try { await updateDoc(doc(db, 'users', user.uid, 'notifications', n.id), { read: true }); } catch {}
                        }}
                        title="পঠিত মার্ক করুন"
                        className="text-xs text-stone-400 hover:text-stone-700 px-2 py-1 bg-white rounded-md border border-stone-200 shadow-xs shrink-0"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">অ্যালার্ট প্রেফারেন্স</h2>
              <p className="text-xs text-stone-500 mt-0.5">কোন ধরনের বিজ্ঞপ্তি পেতে চান নির্ধারণ করুন</p>
            </div>

            {notifSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>নোটিফিকেশন সেটিংস সংরক্ষিত হয়েছে!</span>
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-start sm:items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200 cursor-pointer gap-3">
                <div>
                  <span className="font-bold text-stone-900 text-sm block">সম্ভাব্য ম্যাচ অ্যালার্ট</span>
                  <span className="text-xs text-stone-500">আপনার হারানো পোষ্যের মতো দেখতে কোনো পোষ্য পাওয়া গেলে স্বয়ংক্রিয় নোটিফিকেশন</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifMatch}
                  onChange={(e) => setNotifMatch(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded shrink-0 mt-1 sm:mt-0"
                />
              </label>

              <label className="flex items-start sm:items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200 cursor-pointer gap-3">
                <div>
                  <span className="font-bold text-stone-900 text-sm block">নতুন সাইটিং ও কমেন্ট অ্যালার্ট</span>
                  <span className="text-xs text-stone-500">আপনার পোস্টে কেউ নতুন তথ্য বা দেখার কথা জানালে জানানো হবে</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifSight}
                  onChange={(e) => setNotifSight(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded shrink-0 mt-1 sm:mt-0"
                />
              </label>

              <label className="flex items-start sm:items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200 cursor-pointer gap-3">
                <div>
                  <span className="font-bold text-stone-900 text-sm block">সাপ্তাহিক রিক্যাপ ও ডাইজেস্ট</span>
                  <span className="text-xs text-stone-500">আপনার এলাকার সাফল্যের গল্প ও দত্তকের সারসংক্ষেপ</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifDigest}
                  onChange={(e) => setNotifDigest(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded shrink-0 mt-1 sm:mt-0"
                />
              </label>

              <label className="flex items-start sm:items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200 cursor-pointer gap-3">
                <div>
                  <span className="font-bold text-stone-900 text-sm block">পোস্ট রিমাইন্ডার</span>
                  <span className="text-xs text-stone-500">আপনার হারানো পোষ্যের পোস্টের বর্তমান স্ট্যাটাস আপডেট করার রিমাইন্ডার</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifRemind}
                  onChange={(e) => setNotifRemind(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded shrink-0 mt-1 sm:mt-0"
                />
              </label>
            </div>

            <button
              onClick={handleSaveNotifications}
              disabled={savingNotifs}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all"
            >
              {savingNotifs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>সেটিংস সেভ করুন</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
