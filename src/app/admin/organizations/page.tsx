'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, ShieldX, ShieldAlert, Loader2, Search, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';

interface Org {
  id?: string;
  name: string;
  area: string;
  description: string;
  phone: string;
  verified: boolean;
  userId?: string;
}

export default function AdminOrganizationsPage() {
  const { user, profile, loading } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', area: '', description: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading) fetchOrgs(); }, [loading]);

  const fetchOrgs = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'organizations'), orderBy('verified', 'desc')));
      setOrgs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Org)));
    } catch (err) { console.error(err); }
    finally { setFetching(false); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const toggleVerify = async (org: Org) => {
    setActionLoading(org.id!);
    try {
      await updateDoc(doc(db, 'organizations', org.id!), { verified: !org.verified });
      setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, verified: !o.verified } : o));
      showToast(org.verified ? 'ভেরিফিকেশন বাতিল করা হয়েছে।' : 'ভেরিফায়েড করা হয়েছে!');
    } catch { showToast('সমস্যা হয়েছে।'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ডিলিট করবেন?')) return;
    setActionLoading(id);
    try {
      await deleteDoc(doc(db, 'organizations', id));
      setOrgs(prev => prev.filter(o => o.id !== id));
      showToast('মুছে ফেলা হয়েছে।');
    } catch { showToast('সমস্যা হয়েছে।'); }
    finally { setActionLoading(null); }
  };

  const handleAddOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, 'organizations'), {
        ...form, verified: true, userId: user?.uid, createdAt: serverTimestamp(),
      });
      setOrgs(prev => [{ id: ref.id, ...form, verified: true }, ...prev]);
      setForm({ name: '', area: '', description: '', phone: '' });
      setShowForm(false);
      showToast('নতুন অর্গানাইজেশন যোগ করা হয়েছে।');
    } catch { showToast('সমস্যা হয়েছে।'); }
    finally { setSaving(false); }
  };

  const filtered = orgs.filter(o =>
    !search.trim() ||
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.area.toLowerCase().includes(search.toLowerCase())
  );

  if (loading || fetching) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-6 h-6 text-[#1D6B5F] animate-spin" />
    </div>
  );

  if (!user || (profile?.role !== 'admin' && profile?.role !== 'superadmin')) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-center p-8">
      <ShieldAlert className="w-10 h-10 text-[#9E3B36]" />
      <h2 className="text-xl font-bold">প্রবেশাধিকার নেই</h2>
      <Link href="/" className="text-[#1D6B5F] underline text-sm">হোমপেজে ফিরুন</Link>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111614] text-white px-4 py-2.5 rounded-[6px] text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111614]">রেসকিউ টিম ও ক্লিনিক</h1>
          <p className="text-[#8A948F] text-sm mt-0.5">মোট {orgs.length}টি অর্গানাইজেশন</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-[#1D6B5F] hover:bg-[#15544a] text-white px-4 py-2 rounded-[6px] text-[13px] font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> নতুন যোগ করুন
        </button>
      </div>

      {/* Add Org Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-[#111614]/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] border border-[#E1E5E2] p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#111614] text-lg">নতুন অর্গানাইজেশন</h3>
              <button onClick={() => setShowForm(false)} className="text-[#8A948F] hover:text-[#111614]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddOrg} className="space-y-3">
              {['name', 'area', 'phone'].map(field => (
                <div key={field}>
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8A948F] block mb-1">
                    {field === 'name' ? 'নাম' : field === 'area' ? 'এলাকা' : 'ফোন'}
                  </label>
                  <input
                    type="text" required
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full p-2.5 bg-[#F7F8F7] border border-[#E1E5E2] rounded-[6px] text-[13.5px] focus:outline-none focus:border-[#111614]"
                  />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8A948F] block mb-1">বিবরণ</label>
                <textarea
                  rows={3} required value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 bg-[#F7F8F7] border border-[#E1E5E2] rounded-[6px] text-[13.5px] focus:outline-none focus:border-[#111614]"
                />
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-2.5 bg-[#111614] text-white font-bold rounded-[6px] text-[13px] flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'সংরক্ষণ করুন'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-[8px] border border-[#E1E5E2] p-4">
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#8A948F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="নাম বা এলাকা দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[13px] bg-[#F7F8F7] border border-[#E1E5E2] rounded-[6px] focus:outline-none focus:border-[#111614]" />
        </div>
      </div>

      {/* Org Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(org => (
          <div key={org.id} className="bg-white rounded-[8px] border border-[#E1E5E2] p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#111614] text-[15px]">{org.name}</h3>
                  {org.verified && <ShieldCheck className="w-4 h-4 text-[#1D6B5F]" />}
                </div>
                <p className="text-[12px] text-[#8A948F] mt-0.5">{org.area} · {org.phone}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => toggleVerify(org)}
                  disabled={!!actionLoading}
                  className={`p-1.5 rounded-[5px] transition-colors ${
                    org.verified
                      ? 'text-[#9E3B36] hover:bg-[#FBF4F3]'
                      : 'text-[#1D6B5F] hover:bg-[#F1F8F6]'
                  }`}
                  title={org.verified ? 'ভেরিফিকেশন বাতিল' : 'ভেরিফায়েড করুন'}
                >
                  {actionLoading === org.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : org.verified ? (
                    <ShieldX className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </button>
                <button onClick={() => handleDelete(org.id!)} disabled={!!actionLoading}
                  className="p-1.5 rounded-[5px] text-[#9E3B36] hover:bg-[#FBF4F3] transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[13px] text-[#4F5A55] leading-relaxed">{org.description}</p>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
              org.verified ? 'text-[#1D6B5F] bg-[#F1F8F6]' : 'text-[#B87A29] bg-[#FDF8EF]'
            }`}>
              {org.verified ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
              {org.verified ? 'ভেরিফায়েড' : 'অপেক্ষমাণ'}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-[#8A948F] text-sm">
            কোনো অর্গানাইজেশন পাওয়া যায়নি।
          </div>
        )}
      </div>
    </div>
  );
}
