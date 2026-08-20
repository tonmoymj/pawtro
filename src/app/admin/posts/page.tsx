'use client';

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Pet } from '@/types';
import {
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Flag,
  Loader2,
  Search,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { deletePetImage } from '@/lib/image-upload';

export default function AdminPostsPage() {
  const { user, profile, loading } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [filtered, setFiltered] = useState<Pet[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (loading) return;
    const q = collection(db, 'pets');
    const unsubscribe = onSnapshot(q, (snap) => {
      const allPets = snap.docs.map(d => ({ id: d.id, ...d.data() } as Pet));
      allPets.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
        const tB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
        return tB - tA;
      });
      setPets(allPets);
      setFetching(false);
    }, (err) => {
      console.error(err);
      setFetching(false);
    });
    return () => unsubscribe();
  }, [loading]);

  useEffect(() => {
    let list = [...pets];
    if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.petName?.toLowerCase().includes(q) ||
        p.area?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
    setCurrentPage(1);
  }, [pets, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedPets = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleApprove = async (petId: string) => {
    setActionLoading(petId + '-approve');
    try {
      const targetPet = pets.find((p) => p.id === petId);
      await updateDoc(doc(db, 'pets', petId), { isApproved: true, updatedAt: serverTimestamp() });
      setPets((prev) => prev.map((p) => (p.id === petId ? { ...p, isApproved: true } : p)));

      // Send notification to pet owner
      if (targetPet?.userId) {
        try {
          await addDoc(collection(db, 'users', targetPet.userId, 'notifications'), {
            type: 'approval_success',
            fromUserId: user?.uid || 'admin',
            fromUserName: 'Pawtro মডারেশন টিম',
            petId,
            petName: targetPet.petName || (targetPet.species === 'cat' ? 'বিড়াল' : 'কুকুর'),
            message: `🎉 অভিনন্দন! আপনার "${targetPet.petName || 'পোষ্যের'}" পোস্টটি অ্যাডমিন কর্তৃক অনুমোদিত হয়েছে এবং এখন লাইভ ফিডে দেখা যাচ্ছে।`,
            read: false,
            createdAt: serverTimestamp(),
          });
        } catch (notifErr) {
          console.warn('Approval notification creation notice:', notifErr);
        }
      }

      showToast('পোস্টটি অনুমোদন করা হয়েছে এবং ব্যবহারকারীকে নোটিফিকেশন পাঠানো হয়েছে।');
    } catch {
      showToast('সমস্যা হয়েছে।');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (petId: string) => {
    setActionLoading(petId + '-resolve');
    try {
      await updateDoc(doc(db, 'pets', petId), { status: 'resolved', updatedAt: serverTimestamp() });
      setPets(prev => prev.map(p => p.id === petId ? { ...p, status: 'resolved' } : p));
      showToast('পোস্টটি সমাধান হয়েছে হিসেবে চিহ্নিত করা হয়েছে।');
    } catch { showToast('সমস্যা হয়েছে।'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (petId: string) => {
    if (!confirm('আপনি কি নিশ্চিত? এই পোস্টটি স্থায়ীভাবে ডিলিট করা হবে।')) return;
    const targetPet = pets.find((p) => p.id === petId);
    setActionLoading(petId + '-delete');
    try {
      await deleteDoc(doc(db, 'pets', petId));
      setPets(prev => prev.filter(p => p.id !== petId));
      if (targetPet?.images) {
        for (const img of targetPet.images) {
          if (typeof img === 'object' && (img as any)?.path) {
            await deletePetImage((img as any).path);
          }
        }
      }
      showToast('পোস্টটি ডিলিট করা হয়েছে।');
    } catch { showToast('সমস্যা হয়েছে।'); }
    finally { setActionLoading(null); }
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
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111614] text-white px-4 py-2.5 rounded-[6px] text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      <div>
        <div className="mb-2">
          <BackButton fallbackUrl="/admin" label="অ্যাডমিন কমান্ড সেন্টারে ফিরুন" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111614]">পোস্ট মডারেশন</h1>
        <p className="text-[#8A948F] text-xs sm:text-sm mt-0.5">মোট {pets.length}টি পোস্ট</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[8px] border border-[#E1E5E2] p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="w-3.5 h-3.5 text-[#8A948F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="পোস্ট খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[13px] bg-[#F7F8F7] border border-[#E1E5E2] rounded-[6px] focus:outline-none focus:border-[#111614]"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'lost', 'found', 'adoption'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-[6px] text-[12.5px] font-semibold transition-colors ${
                typeFilter === t
                  ? 'bg-[#111614] text-white'
                  : 'bg-[#F1F3F1] text-[#4F5A55] hover:bg-[#E1E5E2]'
              }`}
            >
              {t === 'all' ? 'সব' : t === 'lost' ? 'হারানো' : t === 'found' ? 'পাওয়া' : 'দত্তক'}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-[8px] border border-[#E1E5E2] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[#F7F8F7] border-b border-[#E1E5E2]">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">পোষ্য</th>
                <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">ধরন</th>
                <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">এলাকা</th>
                <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">স্ট্যাটাস</th>
                <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">অনুমোদন</th>
                <th className="text-right px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-[#8A948F] font-bold">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#8A948F]">
                    কোনো পোস্ট পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                paginatedPets.map(pet => (
                  <tr key={pet.id} className="border-b border-[#F1F3F1] last:border-0 hover:bg-[#FCFDFC] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[5px] bg-[#F1F3F1] overflow-hidden flex-shrink-0">
                          {(typeof pet.images?.[0] === 'string' ? pet.images[0] : pet.images?.[0]?.url) && (
                            <img src={typeof pet.images?.[0] === 'string' ? pet.images[0] : pet.images?.[0]?.url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-[#111614]">{pet.petName || 'অচেনা'}</div>
                          <div className="text-[11px] text-[#8A948F]">{pet.species}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${
                        pet.type === 'lost' ? 'text-[#9E3B36] bg-[#FBF4F3]' :
                        pet.type === 'found' ? 'text-[#1D6B5F] bg-[#F1F8F6]' :
                        'text-[#46577F] bg-[#F3F5FA]'
                      }`}>
                        {pet.type === 'lost' ? 'হারানো' : pet.type === 'found' ? 'পাওয়া' : 'দত্তক'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#4F5A55]">{pet.area || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded ${
                        pet.status === 'resolved' ? 'text-[#1D6B5F] bg-[#F1F8F6]' : 'text-[#B87A29] bg-[#FDF8EF]'
                      }`}>
                        {pet.status === 'resolved' ? 'সমাধান হয়েছে' : 'সক্রিয়'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {pet.isApproved ? (
                        <span className="text-[#1D6B5F] text-[11px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> অনুমোদিত
                        </span>
                      ) : (
                        <span className="text-[#B87A29] text-[11px] font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> মুলতবি
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link
                          href={`/pet/${pet.id}`}
                          target="_blank"
                          className="p-1.5 rounded-[5px] text-[#4F5A55] hover:bg-[#F1F3F1] transition-colors"
                          title="পোস্ট দেখুন"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {!pet.isApproved && (
                          <button
                            onClick={() => handleApprove(pet.id!)}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-[5px] text-[#1D6B5F] hover:bg-[#F1F8F6] transition-colors"
                            title="অনুমোদন করুন"
                          >
                            {actionLoading === pet.id + '-approve' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {pet.status !== 'resolved' && (
                          <button
                            onClick={() => handleResolve(pet.id!)}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-[5px] text-[#46577F] hover:bg-[#F3F5FA] transition-colors"
                            title="সমাধান হয়েছে"
                          >
                            {actionLoading === pet.id + '-resolve' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Flag className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(pet.id!)}
                          disabled={!!actionLoading}
                          className="p-1.5 rounded-[5px] text-[#9E3B36] hover:bg-[#FBF4F3] transition-colors"
                          title="ডিলিট করুন"
                        >
                          {actionLoading === pet.id + '-delete' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 bg-[#F7F8F7] border-t border-[#E1E5E2] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4F5A55]">
            <div className="flex items-center gap-2">
              <span>প্রতি পেজে:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#E1E5E2] rounded px-2 py-1 text-xs focus:outline-none"
              >
                <option value={10}>১০</option>
                <option value={25}>২৫</option>
                <option value={50}>৫০</option>
              </select>
              <span>
                (দেখানো হচ্ছে {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filtered.length)} / মোট {filtered.length} টি)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-white border border-[#E1E5E2] hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="পূর্ববর্তী পৃষ্ঠা"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-medium">
                পৃষ্ঠা {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded bg-white border border-[#E1E5E2] hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="পরবর্তী পৃষ্ঠা"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
