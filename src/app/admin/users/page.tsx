'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { UserProfile } from '@/types';
import RoleBadge from '@/components/RoleBadge';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Search,
  UserX,
  UserCheck,
  Users,
  Award,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

const ROLES = ['user', 'volunteer', 'admin', 'superadmin'];

export default function AdminUsersPage() {
  const { user, profile, loading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!loading) fetchUsers();
  }, [loading]);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    let res = users;
    if (q) {
      res = res.filter(u =>
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') {
      if (roleFilter === 'banned') {
        res = res.filter(u => u.isBanned);
      } else {
        res = res.filter(u => (u.role || 'user') === roleFilter);
      }
    }
    setFiltered(res);
  }, [users, search, roleFilter]);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      setUsers(snap.docs.map(d => ({ ...d.data() } as UserProfile)));
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleRoleChange = async (uid: string, newRole: string) => {
    setActionLoading(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole as any } : u));
      showToast(`রোল পরিবর্তন হয়েছে: ${newRole}`);
    } catch {
      showToast('সমস্যা হয়েছে।');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBan = async (u: UserProfile) => {
    const nextBanStatus = !u.isBanned;
    const confirmMsg = nextBanStatus
      ? `আপনি কি নিশ্চিত যে ${u.displayName || 'এই ইউজারকে'} সাসপেন্ড/ব্যান করতে চান?`
      : `আপনি কি ${u.displayName || 'এই ইউজারের'} ব্যান প্রত্যাহার করতে চান?`;
    
    if (!confirm(confirmMsg)) return;

    setActionLoading(u.uid);
    try {
      await updateDoc(doc(db, 'users', u.uid), { isBanned: nextBanStatus });
      setUsers(prev => prev.map(item => item.uid === u.uid ? { ...item, isBanned: nextBanStatus } : item));
      showToast(nextBanStatus ? 'ইউজারকে ব্যান করা হয়েছে।' : 'ব্যান প্রত্যাহার করা হয়েছে।');
    } catch {
      showToast('ব্যান স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে।');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || fetching) {
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

  const volunteerCount = users.filter(u => u.role === 'volunteer').length;
  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'superadmin').length;
  const bannedCount = users.filter(u => u.isBanned).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111614] text-white px-4 py-2.5 rounded-[6px] text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-[#111614]">ইউজার ম্যানেজমেন্ট ও রোল কন্ট্রোল</h1>
        <p className="text-[#8A948F] text-sm mt-0.5">মোট {users.length} জন নিবন্ধিত সদস্য</p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E1E5E2]">
          <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase">
            <Users className="w-4 h-4" />
            <span>মোট সদস্য</span>
          </div>
          <p className="text-2xl font-black text-stone-900 mt-1">{users.length}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E1E5E2]">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase">
            <Award className="w-4 h-4" />
            <span>ভলান্টিয়ার</span>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{volunteerCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E1E5E2]">
          <div className="flex items-center gap-2 text-[#34446A] text-xs font-semibold uppercase">
            <Shield className="w-4 h-4" />
            <span>অ্যাডমিন ও সুপার</span>
          </div>
          <p className="text-2xl font-black text-[#34446A] mt-1">{adminCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E1E5E2]">
          <div className="flex items-center gap-2 text-red-600 text-xs font-semibold uppercase">
            <UserX className="w-4 h-4" />
            <span>সাসপেন্ড / ব্যান</span>
          </div>
          <p className="text-2xl font-black text-red-700 mt-1">{bannedCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-[8px] border border-[#E1E5E2] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#8A948F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[13px] bg-[#F7F8F7] border border-[#E1E5E2] rounded-[6px] focus:outline-none focus:border-[#111614]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-400 shrink-0" />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-xs bg-[#F7F8F7] border border-[#E1E5E2] rounded-[6px] px-3 py-2 text-stone-800 font-medium focus:outline-none"
          >
            <option value="all">সব সদস্য ({users.length})</option>
            <option value="user">সাধারণ সদস্য</option>
            <option value="volunteer">ভলান্টিয়ার ({volunteerCount})</option>
            <option value="admin">অ্যাডমিন</option>
            <option value="superadmin">সুপার অ্যাডমিন</option>
            <option value="banned">ব্যানকৃত অ্যাকাউন্ট ({bannedCount})</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[8px] border border-[#E1E5E2] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[#F7F8F7] border-b border-[#E1E5E2]">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">ইউজার</th>
                <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">ইমেইল</th>
                <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">ফোন / এলাকা</th>
                <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">বর্তমান রোল</th>
                <th className="text-center px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">স্ট্যাটাস</th>
                <th className="text-right px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#8A948F]">কোনো ইউজার পাওয়া যায়নি।</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.uid} className="border-b border-[#F1F3F1] last:border-0 hover:bg-[#FCFDFC] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full object-cover border border-[#E1E5E2]" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#1D6B5F] text-white flex items-center justify-center font-bold text-[11px]">
                            {u.displayName?.slice(0, 1) || 'U'}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-[#111614] block">{u.displayName || 'অজানা'}</span>
                          {u.bio && <span className="text-[11px] text-stone-400 truncate max-w-[150px] block">{u.bio}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4F5A55]">{u.email || '—'}</td>
                    <td className="px-4 py-3 text-[#4F5A55]">
                      <span>{u.phone || '—'}</span>
                      {u.area && <span className="text-[11px] text-stone-400 block">{u.area}, {u.division}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role || 'user'} size="xs" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.isBanned ? (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-red-100 text-red-700">
                          ব্যানকৃত 🚫
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-50 text-emerald-700">
                          সক্রিয় ✅
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {actionLoading === u.uid ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#1D6B5F]" />
                        ) : (
                          <>
                            {/* Role selector */}
                            <select
                              value={u.role || 'user'}
                              onChange={e => handleRoleChange(u.uid, e.target.value)}
                              disabled={u.uid === user?.uid}
                              className="text-[12px] bg-[#F7F8F7] border border-[#E1E5E2] rounded-[5px] px-2 py-1 text-[#111614] focus:outline-none focus:border-[#111614] disabled:opacity-50"
                            >
                              {ROLES.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>

                            {/* Ban / Unban Button */}
                            {u.uid !== user?.uid && (
                              <button
                                onClick={() => handleToggleBan(u)}
                                title={u.isBanned ? 'ব্যান প্রত্যাহার করুন' : 'অ্যাকাউন্ট সাসপেন্ড/ব্যান করুন'}
                                className={`p-1.5 rounded-[5px] transition-colors ${
                                  u.isBanned
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                              >
                                {u.isBanned ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </>
                        )}
                        {u.uid === user?.uid && (
                          <span className="text-[10.5px] text-[#8A948F]">(আপনি)</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
