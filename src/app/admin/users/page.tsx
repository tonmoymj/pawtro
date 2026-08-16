'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { UserProfile } from '@/types';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Search,
  UserX,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';

const ROLES = ['user', 'volunteer', 'admin', 'superadmin'];

export default function AdminUsersPage() {
  const { user, profile, loading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!loading) fetchUsers();
  }, [loading]);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    if (!q) return setFiltered(users);
    setFiltered(users.filter(u =>
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    ));
  }, [users, search]);

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
      showToast(`রোল পরিবর্তন হয়েছে: ${newRole}`);
    } catch {
      showToast('সমস্যা হয়েছে।');
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111614] text-white px-4 py-2.5 rounded-[6px] text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-[#111614]">ইউজার ম্যানেজমেন্ট</h1>
        <p className="text-[#8A948F] text-sm mt-0.5">মোট {users.length}জন রেজিস্টার্ড ইউজার</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-[8px] border border-[#E1E5E2] p-4">
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#8A948F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[13px] bg-[#F7F8F7] border border-[#E1E5E2] rounded-[6px] focus:outline-none focus:border-[#111614]"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[8px] border border-[#E1E5E2] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[#F7F8F7] border-b border-[#E1E5E2]">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">ইউজার</th>
                <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">ইমেইল</th>
                <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">ফোন</th>
                <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">বর্তমান রোল</th>
                <th className="text-right px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">রোল পরিবর্তন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#8A948F]">কোনো ইউজার পাওয়া যায়নি।</td>
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
                        <span className="font-semibold text-[#111614]">{u.displayName || 'অজানা'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4F5A55]">{u.email || '—'}</td>
                    <td className="px-4 py-3 text-[#4F5A55]">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        u.role === 'superadmin' ? 'text-[#9E3B36] bg-[#FBF4F3]' :
                        u.role === 'admin' ? 'text-[#46577F] bg-[#F3F5FA]' :
                        u.role === 'volunteer' ? 'text-[#1D6B5F] bg-[#F1F8F6]' :
                        'text-[#4F5A55] bg-[#F1F3F1]'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {actionLoading === u.uid ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#1D6B5F]" />
                        ) : (
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
