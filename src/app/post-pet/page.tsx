'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadPetImage } from '@/lib/image-upload';
import { getGeohash } from '@/lib/geo';
import Navbar from '@/components/Navbar';
import { 
  Upload, 
  Loader2, 
  AlertCircle, 
  ArrowLeft,
  X,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

const DIVISIONS = ['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'];

function PostPetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();

  const initialType = searchParams.get('type');
  const [type, setType] = useState<'lost' | 'found' | 'adoption'>(
    initialType === 'found' ? 'found' : initialType === 'adoption' ? 'adoption' : 'lost'
  );

  useEffect(() => {
    const qType = searchParams.get('type');
    if (qType === 'found' || qType === 'adoption' || qType === 'lost') {
      setType(qType);
    }
  }, [searchParams]);

  const [species, setSpecies] = useState<'cat' | 'dog' | 'bird' | 'other'>('cat');
  const [petName, setPetName] = useState('');
  const [breed, setBreed] = useState('');
  const [colors, setColors] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'unknown'>('unknown');
  const [age, setAge] = useState('');
  const [marks, setMarks] = useState('');
  const [description, setDescription] = useState('');
  const [division, setDivision] = useState('ঢাকা');
  const [area, setArea] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [contactPhone, setContactPhone] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [lat, setLat] = useState<number>(23.8103);
  const [lng, setLng] = useState<number>(90.4125);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successPostId, setSuccessPostId] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 3);
      setFiles(selectedFiles);
      setPreviews(selectedFiles.map((file) => URL.createObjectURL(file)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('পোস্ট করতে দয়া করে আগে লগইন করুন।');
      return;
    }

    if (!area.trim()) {
      setError('দয়া করে সুনির্দিষ্ট এলাকা বা ঠিকানার নাম লিখুন।');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const geohash = getGeohash(lat, lng);
      const colorArray = colors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      // Temporary pet document to get ID
      const petData = {
        userId: user.uid,
        type,
        species,
        petName: petName.trim() || '',
        breed: breed.trim() || '',
        colors: colorArray,
        sex,
        age: age.trim() || '',
        marks: marks.trim() || '',
        description: description.trim(),
        division,
        area: area.trim(),
        lat,
        lng,
        geohash,
        eventDate,
        contactPhone: contactPhone.trim() || profile?.phone || '',
        status: 'active',
        isApproved: false,
        images: [] as { path: string; url: string }[],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'pets'), petData);

      // Upload Images
      const uploadedImages: { path: string; url: string }[] = [];
      for (const file of files) {
        const uploaded = await uploadPetImage(file, user.uid, docRef.id);
        uploadedImages.push(uploaded);
      }

      if (uploadedImages.length > 0) {
        const { updateDoc, doc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'pets', docRef.id), {
          images: uploadedImages,
        });
      }

      setSuccess(true);
      setSuccessPostId(docRef.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'পোস্ট প্রকাশে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!successPostId) return;
    const url = `${window.location.origin}/pet/${successPostId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Top Back & Cancel Bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-700 hover:text-stone-950 bg-white border border-stone-200 px-4 py-2 rounded-xl shadow-xs hover:bg-stone-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-amber-600" />
          <span>হোমপেজে ফিরে যান</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>বাতিল</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-xl">
        <div className="mb-8">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full">
            Pawtro Community Post
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
            পোষ্য সংক্রান্ত তথ্য রিপোর্ট করুন
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            সঠিক তথ্য দিয়ে হারিয়ে যাওয়া প্রাণীদের বাড়ি ফিরতে বা নতুন সঙ্গী পেতে সাহায্য করুন
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS CARD */}
        {success && successPostId ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-stone-900 mb-1">পোস্ট সফলভাবে প্রকাশিত!</h2>
            <p className="text-stone-500 text-sm mb-6">সম্প্রদায়কে সাহায্য করার জন্য ধন্যবাদ 🐾</p>

            <div className="w-full max-w-md p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-left mb-6">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">পর্যালোচনায় আছে ⏳</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  আপনার পোস্টটি অ্যাডমিন অনুমোদনের পর সবার নিউজফিডে দেখা যাবে। সাধারণত কয়েক ঘণ্টার মধ্যে অনুমোদন হয়।
                </p>
              </div>
            </div>

            <div className="w-full max-w-md space-y-2.5">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider text-left mb-2">এখনই শেয়ার করুন</p>
              <button
                onClick={() => { const url = encodeURIComponent(`${window.location.origin}/pet/${successPostId}`); window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400'); }}
                className="w-full py-3 px-4 bg-[#1877F2] hover:bg-[#0d65e0] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all"
              >
                <span>📘 Facebook-এ শেয়ার করুন</span>
              </button>
              <button
                onClick={() => { const url = `${window.location.origin}/pet/${successPostId}`; window.open(`https://wa.me/?text=${encodeURIComponent(`Pawtro-তে একটি পোস্ট দেখুন: ${url}`)}`, '_blank'); }}
                className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all"
              >
                <span>💬 WhatsApp-এ শেয়ার করুন</span>
              </button>
              <button
                onClick={copyLink}
                className={`w-full py-3 px-4 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all border ${
                  copied ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                {copied ? <><Check className="w-4 h-4" /><span>লিংক কপি হয়েছে!</span></> : <><Copy className="w-4 h-4" /><span>পোস্টের লিংক কপি করুন</span></>}
              </button>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => router.push(`/pet/${successPostId}`)}
                  className="py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>পোস্ট দেখুন</span>
                </button>
                <Link href="/"
                  className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  ফিডে ফিরুন
                </Link>
              </div>
            </div>
          </div>
        ) : (

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selector */}
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">পোস্টের ধরন *</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { id: 'lost', label: '🚨 হারিয়ে গেছে', desc: 'আমার পোষ্য হারিয়েছে' },
                { id: 'found', label: '🐾 পেয়েছি', desc: 'অচেনা প্রাণী পেয়েছি' },
                { id: 'adoption', label: '❤️ দত্তক দিতে চাই', desc: 'ফ্রি দত্তক' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setType(item.id as any)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    type === item.id
                      ? 'border-amber-600 bg-amber-50/70 text-amber-900 font-bold shadow-sm'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 font-medium'
                  }`}
                >
                  <div className="text-xs sm:text-sm">{item.label}</div>
                  <div className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Species & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">প্রাণীর প্রজাতি *</label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as any)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="cat">বিড়াল (Cat)</option>
                <option value="dog">কুকুর (Dog)</option>
                <option value="bird">পাখি (Bird)</option>
                <option value="other">অন্যান্য (Other)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">লিঙ্গ</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as any)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="unknown">অজানা (Unknown)</option>
                <option value="male">পুরুষ (Male)</option>
                <option value="female">স্ত্রী (Female)</option>
              </select>
            </div>
          </div>

          {/* Pet Name & Breed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">
                {type === 'found' ? 'ডাকনাম (যদি থাকে)' : 'পোষ্যের নাম'}
              </label>
              <input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="যেমন: টমি / মিকি"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">জাত বা ব্রিড</label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="যেমন: দেশি / পার্সিয়ান / জার্মান শেফার্ড"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Age & Colors & Special Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">বয়স</label>
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="যেমন: ৬ মাস / ২ বছর"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">রং (কমা দিয়ে আলাদা করুন)</label>
              <input
                type="text"
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                placeholder="যেমন: সাদা, বাদামি, কালো"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">বিশেষ চিহ্ন (যদি থাকে)</label>
              <input
                type="text"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="যেমন: গলায় লাল বেল্ট / লেজের ডগায় সাদা দাগ"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Location & Division */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">বিভাগ *</label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">সুনির্দিষ্ট এলাকা *</label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="যেমন: ধানমন্ডি ৮/এ, ঢাকা"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Date & Contact Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">তারিখ *</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">যোগাযোগের মোবাইল নম্বর</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1.5">বিস্তারিত বিবরণ *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ঘটনার বিস্তারিত বিবরণ দিন, যাতে মানুষ সহজে চিনতে পারে..."
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">ছবি আপলোড (সর্বোচ্চ ৩টি)</label>
            <div className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-stone-50">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-700">ছবি সিলেক্ট করতে ক্লিক করুন</p>
              <p className="text-xs text-stone-400 mt-1">JPEG, PNG (সর্বোচ্চ ৫ MB)</p>
            </div>

            {previews.length > 0 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {previews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Preview ${i}`}
                    className="w-20 h-20 object-cover rounded-xl border border-stone-200 shadow-sm"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>পোস্ট প্রক্রিয়াজাত করা হচ্ছে...</span>
              </>
            ) : (
              <span>পোস্ট প্রকাশ করুন</span>
            )}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}

export default function PostPetPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F7]">
      <Navbar />
      <Suspense fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      }>
        <PostPetForm />
      </Suspense>
    </div>
  );
}
