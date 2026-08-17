'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/admin/StatCard';
import RoleBadge from '@/components/RoleBadge';
import Link from 'next/link';
import {
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Eye,
  ShieldAlert,
  TrendingUp,
  Loader2,
  ArrowRight,
  MapPin,
  Award
} from 'lucide-react';

interface AdminStats {
  totalPets: number;
  totalUsers: number;
  lostPets: number;
  foundPets: number;
  adoptionPets: number;
  pendingApproval: number;
  reportedPosts: number;
  resolvedPets: number;
  successRate: number;
  divisionCounts: Record<string, number>;
  recentPets: any[];
  recentUsers: any[];
}

const DEFAULT_STATS: AdminStats = {
  totalPets: 0,
  totalUsers: 0,
  lostPets: 0,
  foundPets: 0,
  adoptionPets: 0,
  pendingApproval: 0,
  reportedPosts: 0,
  resolvedPets: 0,
  successRate: 0,
  divisionCounts: {},
  recentPets: [],
  recentUsers: [],
};

const DIVISIONS_LIST = ['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'];

export default function AdminOverviewPage() {
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState<AdminStats>(DEFAULT_STATS);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      fetchStats();
    }
  }, [loading]);

  const fetchStats = async () => {
    try {
      const results = await Promise.allSettled([
        getCountFromServer(collection(db, 'pets')),
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(query(collection(db, 'pets'), where('type', '==', 'lost'))),
        getCountFromServer(query(collection(db, 'pets'), where('type', '==', 'found'))),
        getCountFromServer(query(collection(db, 'pets'), where('type', '==', 'adoption'))),
        getCountFromServer(query(collection(db, 'pets'), where('isApproved', '==', false))),
        getCountFromServer(query(collection(db, 'pets'), where('reportCount', '>', 0))),
        getCountFromServer(query(collection(db, 'pets'), where('status', '==', 'resolved'))),
        getDocs(query(collection(db, 'pets'), orderBy('createdAt', 'desc'), limit(8))),
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5))),
        ...DIVISIONS_LIST.map((div) =>
          getCountFromServer(query(collection(db, 'pets'), where('division', '==', div)))
        ),
      ]);

      const getCount = (idx: number) => {
        const res = results[idx];
        if (res.status === 'fulfilled' && res.value && 'data' in res.value && typeof (res.value as any).data === 'function') {
          return (res.value as any).data().count || 0;
        }
        return 0;
      };

      const getDocsData = (idx: number): any[] => {
        const res = results[idx];
        if (res.status === 'fulfilled' && res.value && 'docs' in res.value) {
          return (res.value as any).docs || [];
        }
        return [];
      };

      const total = getCount(0);
      const resolved = getCount(7);
      const successRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      const divCounts: Record<string, number> = {};
      DIVISIONS_LIST.forEach((div, idx) => {
        divCounts[div] = getCount(10 + idx);
      });

      const recentPetsDocs = getDocsData(8);
      const recentUsersDocs = getDocsData(9);

      setStats({
        totalPets: total,
        totalUsers: getCount(1),
        lostPets: getCount(2),
        foundPets: getCount(3),
        adoptionPets: getCount(4),
        pendingApproval: getCount(5),
        reportedPosts: getCount(6),
        resolvedPets: resolved,
        successRate,
        divisionCounts: divCounts,
        recentPets: recentPetsDocs.map((d: any) => ({ id: d.id, ...d.data() })),
        recentUsers: recentUsersDocs.map((d: any) => ({ uid: d.id, ...d.data() })),
      });
    } catch (err) {
      console.error('Admin stats error:', err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-[#1D6B5F] animate-spin" />
      </div>
    );
  }

  // Guard: only admin or superadmin can access
  if (!user || (profile?.role !== 'admin' && profile?.role !== 'superadmin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-[#9E3B36]" />
        <h2 className="text-xl font-bold text-[#111614]">প্রবেশাধিকার নেই</h2>
        <p className="text-[#4F5A55] text-sm max-w-xs">
          শুধুমাত্র অ্যাডমিন অ্যাকাউন্ট এই ড্যাশবোর্ডে প্রবেশ করতে পারবে।
        </p>
        <Link href="/" className="text-[#1D6B5F] font-semibold text-sm underline mt-2">
          হোমপেজে ফিরুন
        </Link>
      </div>
    );
  }

  const s = stats;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111614]">কমান্ড সেন্টার</h1>
          <p className="text-[#8A948F] text-sm mt-0.5">Pawtro প্ল্যাটফর্মের পূর্ণাঙ্গ নিয়ন্ত্রণ ড্যাশবোর্ড</p>
        </div>
        <div className="bg-[#F1F8F6] border border-[#C2DAD5] text-[#1D6B5F] text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#1D6B5F] rounded-full animate-pulse"></span>
          লাইভ ডেটা
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="মোট পোস্ট" value={s.totalPets} icon={FileText} color="green" delta={s.pendingApproval} />
        <StatCard title="রেজিস্টার্ড ইউজার" value={s.totalUsers} icon={Users} color="blue" />
        <StatCard title="সাফল্যের হার" value={`${s.successRate}%`} icon={TrendingUp} color="green" />
        <StatCard title="ফ্ল্যাগড / রিপোর্ট" value={s.reportedPosts} icon={AlertTriangle} color="red" />
      </div>

      {/* Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category Breakdown */}
        <div className="bg-white rounded-[8px] border border-[#E1E5E2] p-5 col-span-1 space-y-6">
          <div>
            <h3 className="text-[13.5px] font-bold text-[#111614] mb-3">পোস্ট ক্যাটাগরি ব্রেকডাউন</h3>
            <div className="space-y-2.5">
              {[
                { label: 'হারিয়ে গেছে', count: s.lostPets, total: s.totalPets, color: '#9E3B36' },
                { label: 'পাওয়া গেছে', count: s.foundPets, total: s.totalPets, color: '#1D6B5F' },
                { label: 'দত্তক', count: s.adoptionPets, total: s.totalPets, color: '#46577F' },
                { label: 'সমাধান হয়েছে', count: s.resolvedPets, total: s.totalPets, color: '#059669' },
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#4F5A55] font-medium">{item.label}</span>
                    <span className="font-bold text-[#111614]">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-[#F1F3F1] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.total > 0 ? Math.round((item.count / item.total) * 100) : 0}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Division Breakdown */}
          <div className="pt-4 border-t border-[#E1E5E2]">
            <h3 className="text-[13px] font-bold text-[#111614] mb-2.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>বিভাগভিত্তিক কেস</span>
            </h3>
            <div className="space-y-1.5 text-xs">
              {Object.entries(s.divisionCounts).map(([div, count]) => (
                <div key={div} className="flex items-center justify-between text-[#4F5A55]">
                  <span>{div}</span>
                  <span className="font-bold text-[#111614] bg-[#F1F3F1] px-1.5 py-0.5 rounded text-[11px]">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-white rounded-[8px] border border-[#E1E5E2] p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13.5px] font-bold text-[#111614]">সাম্প্রতিক পোস্টসমূহ</h3>
            <Link href="/admin/posts" className="text-[#1D6B5F] text-[12px] font-semibold flex items-center gap-1 hover:underline">
              সব দেখুন <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {s.recentPets.length > 0 ? (
              s.recentPets.slice(0, 6).map((pet: any) => (
                <div key={pet.id} className="flex items-center gap-3 py-2 border-b border-[#F1F3F1] last:border-0">
                  <div className="w-9 h-9 rounded-lg bg-[#F1F3F1] overflow-hidden flex-shrink-0">
                    {pet.images?.[0]?.url && (
                      <img src={pet.images[0].url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          color: pet.type === 'lost' ? '#9E3B36' : pet.type === 'found' ? '#1D6B5F' : '#46577F',
                          background: pet.type === 'lost' ? '#FBF4F3' : pet.type === 'found' ? '#F1F8F6' : '#F3F5FA',
                        }}
                      >
                        {pet.type === 'lost' ? 'হারানো' : pet.type === 'found' ? 'পাওয়া' : 'দত্তক'}
                      </span>
                      <span className="text-[13px] font-semibold text-[#111614] truncate">
                        {pet.petName || 'অচেনা প্রাণী'}
                      </span>
                    </div>
                    <span className="text-[11.5px] text-[#8A948F]">{pet.area}</span>
                  </div>
                  <Link href={`/admin/posts`} className="text-[11px] text-[#1D6B5F] font-semibold hover:underline flex-shrink-0">
                    পরিচালনা
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-[#8A948F] text-center py-6">এখনো কোনো পোস্ট নেই।</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-[8px] border border-[#E1E5E2] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13.5px] font-bold text-[#111614]">সাম্প্রতিক রেজিস্ট্রেশন ও রোল</h3>
          <Link href="/admin/users" className="text-[#1D6B5F] text-[12px] font-semibold flex items-center gap-1 hover:underline">
            সব ইউজার <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {s.recentUsers.length > 0 ? (
            s.recentUsers.map((u: any) => (
              <div key={u.uid} className="flex items-center gap-2.5 p-3 bg-[#F7F8F7] rounded-[6px] border border-[#E1E5E2]">
                <div className="w-8 h-8 rounded-full bg-[#1D6B5F] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                  {u.displayName?.slice(0, 1) || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-[#111614] truncate">{u.displayName || 'ইউজার'}</div>
                  <div className="mt-0.5">
                    <RoleBadge role={u.role || 'user'} size="xs" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-[#8A948F] col-span-5 text-center py-4">এখনো কোনো ইউজার নেই।</p>
          )}
        </div>
      </div>
    </div>
  );
}
