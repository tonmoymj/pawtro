'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadPetImage } from '@/lib/image-upload';
import { getGeohash } from '@/lib/geo';
import { 
  Upload, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  X,
  Clock,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

const DIVISIONS = ['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'];

interface PostPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'lost' | 'found' | 'adoption';
}

export default function PostPetModal({ isOpen, onClose, initialType = 'lost' }: PostPetModalProps) {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [type, setType] = useState<'lost' | 'found' | 'adoption'>(initialType);
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
  const [lat] = useState<number>(23.8103);
  const [lng] = useState<number>(90.4125);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successPostId, setSuccessPostId] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync initial type when opened
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setError('');
      setSuccess(false);
      setSuccessPostId('');
      setCopied(false);
      if (profile?.phone && !contactPhone) {
        setContactPhone(profile.phone);
      }
    }
  }, [isOpen, initialType, profile]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
      setError('পোস্ট প্রকাশ করতে দয়া করে আগে লগইন করুন।');
      return;
    }

    if (!area.trim()) {
      setError('দয়া করে সুনির্দিষ্ট এলাকা বা ঠিকানার নাম লিখুন।');
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
      setError(err.message || 'পোস্ট প্রকাশে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      
      {/* Backdrop Click Close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div 
        className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden z-10 border border-stone-200 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Sticky Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Pawtro Report
            </span>
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              {success ? 'পোস্ট সম্পন্ন হয়েছে!' : 'পোষ্য সংক্রান্ত তথ্য রিপোর্ট করুন'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── SUCCESS PANEL ─── */}
        {success && successPostId ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col items-center text-center">
            {/* Big checkmark */}
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <h3 className="text-xl font-black text-stone-900 mb-1">পোস্ট সফলভাবে প্রকাশিত!</h3>
            <p className="text-stone-600 text-sm mb-5">সম্প্রদায়কে সাহায্য করার জন্য ধন্যবাদ 🐾</p>

            {/* Pending approval notice */}
            <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-left mb-6">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">পর্যালোচনায় আছে ⏳</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  আপনার পোস্টটি অ্যাডমিন অনুমোদনের পর সবার নিউজফিডে দেখা যাবে। সাধারণত কয়েক ঘণ্টার মধ্যে অনুমোদন হয়।
                </p>
              </div>
            </div>

            {/* Quick Share Actions */}
            <div className="w-full space-y-2.5">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider text-left mb-2">এখনই শেয়ার করুন</p>
              
              <button
                onClick={() => {
                  const url = encodeURIComponent(`${window.location.origin}/pet/${successPostId}`);
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
                }}
                className="w-full py-3 px-4 bg-[#1877F2] hover:bg-[#0d65e0] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>📘</span>
                <span>Facebook-এ শেয়ার করুন</span>
              </button>

              <button
                onClick={() => {
                  const url = `${window.location.origin}/pet/${successPostId}`;
                  const text = encodeURIComponent(`Pawtro-তে একটি পোস্ট দেখুন: ${url}`);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>💬</span>
                <span>WhatsApp-এ শেয়ার করুন</span>
              </button>

              <button
                onClick={copyLink}
                className={`w-full py-3 px-4 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all border ${
                  copied
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                {copied ? (
                  <><Check className="w-4 h-4" /><span>লিংক কপি হয়েছে!</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>পোস্টের লিংক কপি করুন</span></>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => { router.push(`/pet/${successPostId}`); onClose(); }}
                  className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>পোস্ট দেখুন</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>ফিডে ফিরুন</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
        <>
          {/* Scrollable Form Body */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form id="petReportForm" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Post Type Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">পোস্টের ধরন *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'lost', label: '🚨 হারিয়ে গেছে', desc: 'আমার পোষ্য' },
                    { id: 'found', label: '🐾 পেয়েছি', desc: 'অচেনা প্রাণী' },
                    { id: 'adoption', label: '❤️ দত্তক দিতে চাই', desc: 'ফ্রি দত্তক' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setType(item.id as any)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        type === item.id
                          ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 font-medium'
                      }`}
                    >
                      <div className="text-xs sm:text-sm">{item.label}</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Species & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">প্রাণীর প্রজাতি *</label>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value as any)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="cat">বিড়াল (Cat)</option>
                    <option value="dog">কুকুর (Dog)</option>
                    <option value="bird">পাখি (Bird)</option>
                    <option value="other">অন্যান্য (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">লিঙ্গ</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="unknown">অজানা (Unknown)</option>
                    <option value="male">পুরুষ (Male)</option>
                    <option value="female">স্ত্রী (Female)</option>
                  </select>
                </div>
              </div>

              {/* Pet Name & Breed */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {type === 'found' ? 'ডাকনাম (যদি থাকে)' : 'পোষ্যের নাম'}
                  </label>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="যেমন: টমি / মিকি"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">জাত বা ব্রিড</label>
                  <input
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    placeholder="যেমন: দেশি / পার্সিয়ান"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Age & Colors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">বয়স</label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="যেমন: ৬ মাস / ২ বছর"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">রং (কমা দিয়ে আলাদা)</label>
                  <input
                    type="text"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    placeholder="যেমন: সাদা, বাদামি"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Special Marks */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">বিশেষ চিহ্ন (যদি থাকে)</label>
                <input
                  type="text"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  placeholder="যেমন: গলায় লাল বেল্ট / লেজের ডগায় সাদা দাগ"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Location & Division */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">বিভাগ *</label>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">সুনির্দিষ্ট এলাকা *</label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="যেমন: ধানমন্ডি ৮/এ, ঢাকা"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Date & Contact Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">যোগাযোগ নম্বর (ঐচ্ছিক)</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">বিস্তারিত বিবরণ *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ঘটনার বিস্তারিত বিবরণ দিন, যাতে মানুষ সহজে চিনতে পারে..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">ছবি আপলোড (সর্বোচ্চ ৩টি)</label>
                <div className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-4 text-center cursor-pointer transition-colors relative bg-stone-50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-stone-700">ছবি সিলেক্ট করতে ক্লিক করুন</p>
                  <p className="text-[10px] text-stone-400">JPEG, PNG (সর্বোচ্চ ৫ MB)</p>
                </div>

                {previews.length > 0 && (
                  <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1">
                    {previews.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Preview ${i}`}
                        className="w-16 h-16 object-cover rounded-xl border border-stone-200 shadow-xs"
                      />
                    ))}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2.5 sticky bottom-0 z-20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 font-bold text-xs sm:text-sm transition-colors"
            >
              বাতিল
            </button>

            <button
              type="submit"
              form="petReportForm"
              disabled={loading}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>পোস্ট প্রকাশ হচ্ছে...</span>
                </>
              ) : (
                <span>পোস্ট প্রকাশ করুন 🚀</span>
              )}
            </button>
          </div>
        </>
        )}
      </div>
    </div>
  );
}
