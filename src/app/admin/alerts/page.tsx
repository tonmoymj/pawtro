'use client';

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import {
  Megaphone,
  Send,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

const DIVISIONS = ['সব বিভাগ', 'ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'];
const ALERT_TYPES = [
  { id: 'emergency', label: '🚨 জরুরি ইমার্জেন্সি', color: '#9E3B36' },
  { id: 'info', label: 'ℹ️ সাধারণ তথ্য', color: '#46577F' },
  { id: 'success', label: '✅ সুখবর / সমাধান', color: '#1D6B5F' },
  { id: 'warning', label: '⚠️ সতর্কতা', color: '#B87A29' },
];

export default function AdminAlertsPage() {
  const { user, profile, loading } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [division, setDivision] = useState('সব বিভাগ');
  const [alertType, setAlertType] = useState('info');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);

    try {
      await addDoc(collection(db, 'broadcasts'), {
        title: title.trim(),
        message: message.trim(),
        division,
        alertType,
        createdBy: user?.uid,
        createdByName: profile?.displayName || 'অ্যাডমিন',
        createdAt: serverTimestamp(),
        active: true,
      });
      showToast('ব্রডকাস্ট সফলভাবে পাঠানো হয়েছে!');
      setTitle('');
      setMessage('');
      setDivision('সব বিভাগ');
      setAlertType('info');
    } catch (err) {
      console.error(err);
      showToast('সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-[#1D6B5F] animate-spin" />
      </div>
    );
  }

  if (!user || (profile?.role !== 'admin' && profile?.role !== 'superadmin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-center p-8">
        <ShieldAlert className="w-10 h-10 text-[#9E3B36]" />
        <h2 className="text-xl font-bold">প্রবেশাধিকার নেই</h2>
        <Link href="/" className="text-[#1D6B5F] underline text-sm">হোমপেজে ফিরুন</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111614] text-white px-4 py-2.5 rounded-[6px] text-sm font-medium shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#6EBFA9]" />
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-[#111614]">ব্রডকাস্ট ও ইমার্জেন্সি অ্যালার্ট</h1>
        <p className="text-[#8A948F] text-sm mt-0.5">
          কমিউনিটিকে জরুরি তথ্য জানাতে ব্রডকাস্ট মেসেজ পাঠান
        </p>
      </div>

      {/* Warning Note */}
      <div className="p-4 bg-[#FDF8EF] border border-[#EBDCC0] rounded-[8px] text-[13px] text-[#6A5326] flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#B87A29]" />
        <div>
          <b>সতর্কতা:</b> এই মেসেজটি নির্বাচিত বিভাগের সকল ইউজারের কাছে প্রদর্শিত হবে। অযথা ব্যবহার থেকে বিরত থাকুন।
        </div>
      </div>

      <form onSubmit={handleBroadcast} className="bg-white rounded-[8px] border border-[#E1E5E2] p-6 space-y-5">
        {/* Alert Type */}
        <div>
          <label className="block text-[11px] font-mono font-bold tracking-wider uppercase text-[#8A948F] mb-2">
            অ্যালার্টের ধরন
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ALERT_TYPES.map(type => (
              <button
                type="button"
                key={type.id}
                onClick={() => setAlertType(type.id)}
                className={`p-3 rounded-[6px] border text-[13px] font-medium text-left transition-all ${
                  alertType === type.id
                    ? 'border-[#111614] bg-[#F7F8F7] font-bold'
                    : 'border-[#E1E5E2] hover:bg-[#F7F8F7] text-[#4F5A55]'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target Division */}
        <div>
          <label className="block text-[11px] font-mono font-bold tracking-wider uppercase text-[#8A948F] mb-2">
            টার্গেট বিভাগ
          </label>
          <select
            value={division}
            onChange={e => setDivision(e.target.value)}
            className="w-full p-2.5 bg-[#F7F8F7] border border-[#E1E5E2] rounded-[6px] text-[13.5px] focus:outline-none focus:border-[#111614]"
          >
            {DIVISIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[11px] font-mono font-bold tracking-wider uppercase text-[#8A948F] mb-2">
            শিরোনাম *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="যেমন: ধানমন্ডিতে জরুরি রেসকিউ অভিযান"
            className="w-full p-2.5 bg-[#F7F8F7] border border-[#E1E5E2] rounded-[6px] text-[13.5px] focus:outline-none focus:border-[#111614]"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-[11px] font-mono font-bold tracking-wider uppercase text-[#8A948F] mb-2">
            মেসেজ *
          </label>
          <textarea
            rows={4}
            required
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="ব্রডকাস্ট মেসেজের বিস্তারিত বিবরণ লিখুন..."
            className="w-full p-2.5 bg-[#F7F8F7] border border-[#E1E5E2] rounded-[6px] text-[13.5px] focus:outline-none focus:border-[#111614]"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full py-3 bg-[#111614] hover:bg-black text-white font-bold rounded-[6px] text-[14px] flex items-center justify-center gap-2 transition-colors"
        >
          {sending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> পাঠানো হচ্ছে...</>
          ) : (
            <><Send className="w-4 h-4" /> ব্রডকাস্ট পাঠান</>
          )}
        </button>
      </form>
    </div>
  );
}
