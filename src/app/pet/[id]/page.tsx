'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { doc, getDoc, updateDoc, collection, addDoc, query, orderBy, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Pet, Comment, UserProfile } from '@/types';
import { formatDate } from '@/lib/utils';
import RoleBadge from '@/components/RoleBadge';
import MissingPosterModal from '@/components/MissingPosterModal';
import { 
  MapPin, 
  Calendar, 
  Phone, 
  Share2, 
  MessageSquare, 
  Download, 
  ArrowLeft, 
  Send,
  Loader2,
  Printer,
  CheckCircle,
  AlertTriangle,
  Award,
  MessageCircle
} from 'lucide-react';
import QRCode from 'qrcode';

export default function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const petId = resolvedParams.id;
  const { user, profile } = useAuth();

  const [pet, setPet] = useState<Pet | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchPetDetails();
    generateQr();
  }, [petId]);

  const generateQr = async () => {
    if (typeof window !== 'undefined') {
      try {
        const url = window.location.href;
        const qr = await QRCode.toDataURL(url, { width: 160, margin: 1 });
        setQrDataUrl(qr);
      } catch (err) {
        console.error('QR generation failed', err);
      }
    }
  };

  const fetchPetDetails = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'pets', petId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const petData = { id: snap.id, ...snap.data() } as Pet;
        setPet(petData);

        // Fetch owner profile for social links
        try {
          const ownerDoc = await getDoc(doc(db, 'users', petData.userId));
          if (ownerDoc.exists()) setOwnerProfile(ownerDoc.data() as UserProfile);
        } catch {}
      } else {
        setPet(null);
      }

      // Fetch Comments
      const commentsQuery = query(collection(db, 'pets', petId, 'comments'), orderBy('createdAt', 'desc'));
      const commentSnaps = await getDocs(commentsQuery);
      setComments(commentSnaps.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)));
    } catch (err) {
      console.warn('Fallback loading', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setCommentSubmitting(true);
    try {
      const commentData = {
        petId,
        userId: user.uid,
        authorId: user.uid,
        author: profile?.displayName || 'ব্যবহারকারী',
        authorRole: profile?.role || 'user',
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'pets', petId, 'comments'), commentData);
      setComments([{ id: ref.id, ...commentData, createdAt: new Date().toISOString() }, ...comments]);
      setNewComment('');

      // Send notification to post owner (skip if commenter is the owner)
      if (pet && pet.userId && pet.userId !== user.uid) {
        try {
          const notifRef = doc(collection(db, 'users', pet.userId, 'notifications'));
          await setDoc(notifRef, {
            type: 'comment',
            fromUserId: user.uid,
            fromUserName: profile?.displayName || 'কেউ একজন',
            petId,
            petName: pet.petName || (pet.species === 'cat' ? 'বিড়াল' : 'কুকুর'),
            message: `${profile?.displayName || 'কেউ একজন'} আপনার পোস্টে মন্তব্য করেছেন।`,
            read: false,
            createdAt: serverTimestamp(),
          });
        } catch {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!confirm('আপনি কি নিশ্চিত যে পোষ্যটিকে পাওয়া গেছে এবং কেসটি সম্পন্ন হয়েছে?')) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'pets', petId), {
        status: 'resolved',
        updatedAt: serverTimestamp(),
      });
      setPet((prev) => (prev ? { ...prev, status: 'resolved' } : null));
      alert('অভিনন্দন! কেসটি সফলভাবে "সমাধান হয়েছে" হিসেবে চিহ্নিত হয়েছে।');
    } catch (err) {
      console.error(err);
      alert('স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে।');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVolunteerClaim = async () => {
    if (!user) return;
    if (!confirm('আপনি কি এই প্রাণীটির রেসকিউ/উদ্ধারের দায়িত্ব নিতে চান?')) return;
    setActionLoading(true);
    try {
      const claim = {
        volunteerId: user.uid,
        volunteerName: profile?.displayName || 'স্বেচ্ছাসেবক',
        volunteerPhone: profile?.phone || '',
        claimedAt: new Date().toISOString(),
        status: 'on_the_way' as const,
      };
      await updateDoc(doc(db, 'pets', petId), {
        rescueClaim: claim,
        updatedAt: serverTimestamp(),
      });
      setPet((prev) => (prev ? { ...prev, rescueClaim: claim } : null));
      alert('ধন্যবাদ! আপনি রেসকিউ মিশনে যুক্ত হয়েছেন।');
    } catch (err) {
      console.error(err);
      alert('রেসকিউ ক্লেইমে সমস্যা হয়েছে।');
    } finally {
      setActionLoading(false);
    }
  };

  const sharePet = () => {
    if (navigator.share) {
      navigator.share({
        title: `Pawtro: ${pet?.petName || 'পোষা প্রাণী'}`,
        text: pet?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('পোস্টের লিংক কপি করা হয়েছে!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center px-5">
        <h2 className="text-[17px] font-semibold text-stone-900">পোস্ট পাওয়া যায়নি</h2>
        <Link href="/" className="mt-4 inline-block text-amber-600 font-semibold underline text-sm">
          হোমে ফিরে যান
        </Link>
      </div>
    );
  }

  const isOwner = user?.uid === pet.userId;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const isVolunteer = profile?.role === 'volunteer' || isAdmin;

  const badgeClass =
    pet.type === 'lost'
      ? 'bg-red-50 text-red-700 border-red-200'
      : pet.type === 'found'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-blue-50 text-blue-700 border-blue-200';
  const badgeLabel = pet.type === 'lost' ? '🚨 হারিয়ে গেছে' : pet.type === 'found' ? '🐾 পাওয়া গেছে' : '🏠 দত্তক';

  const cleanPhone = pet.contactPhone?.replace(/[^0-9+]/g, '');
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone}?text=${encodeURIComponent(`সালাম, Pawtro-তে আপনার পোষ্য '${pet.petName || ''}' সম্পর্কিত পোস্টের ব্যাপারে জানতে চাইছি।`)}` : null;

  const hasSocialLinks = ownerProfile?.socialLinks && (
    ownerProfile.socialLinks.facebook ||
    ownerProfile.socialLinks.instagram ||
    ownerProfile.socialLinks.whatsapp
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      {/* Missing Poster Modal */}
      {showPosterModal && (
        <MissingPosterModal
          pet={pet}
          qrDataUrl={qrDataUrl}
          onClose={() => setShowPosterModal(false)}
        />
      )}

      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ফিডে ফিরে যান</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Gallery & Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="relative aspect-video bg-stone-100">
              <img
                src={pet.images?.[0]?.url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80'}
                alt={pet.petName || 'Pet'}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${badgeClass}`}>
                  {badgeLabel}
                </span>
                {pet.status === 'resolved' && (
                  <span className="bg-emerald-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>পোষ্য ঘরে ফিরেছে (Resolved)</span>
                  </span>
                )}
                {pet.isEmergency && (
                  <span className="bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>জরুরি রেসকিউ প্রয়োজন</span>
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
                    {pet.petName || (pet.species === 'cat' ? 'অচেনা বিড়াল' : 'অচেনা কুকুর')}
                  </h1>
                  <div className="flex items-center gap-1.5 text-stone-500 text-sm mt-1">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{pet.area}, {pet.division}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPosterModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4 text-amber-700" />
                    <span>পোস্টার প্রিন্ট</span>
                  </button>
                  <button
                    onClick={sharePet}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors shadow-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>শেয়ার</span>
                  </button>
                </div>
              </div>

              {/* Volunteer Rescue Status Banner */}
              {pet.rescueClaim && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm">রেসকিউ মিশন চলছে 🦺</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      স্বেচ্ছাসেবক <b>{pet.rescueClaim.volunteerName}</b> উদ্ধারে নিয়োজিত আছেন।
                    </p>
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs sm:text-sm">
                <div>
                  <span className="text-stone-400 text-[11px] font-semibold uppercase block">প্রজাতি</span>
                  <span className="font-bold text-stone-900">{pet.species === 'cat' ? 'বিড়াল' : pet.species === 'dog' ? 'কুকুর' : 'অন্যান্য'}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[11px] font-semibold uppercase block">জাত / ব্রিড</span>
                  <span className="font-bold text-stone-900">{pet.breed || 'দেশি'}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[11px] font-semibold uppercase block">লিঙ্গ</span>
                  <span className="font-bold text-stone-900">{pet.sex === 'male' ? 'পুরুষ' : 'স্ত্রী'}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[11px] font-semibold uppercase block">বয়স</span>
                  <span className="font-bold text-stone-900">{pet.age || 'অজানা'}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[11px] font-semibold uppercase block">রং</span>
                  <span className="font-bold text-stone-900">{pet.colors?.join(', ') || 'মিক্স'}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[11px] font-semibold uppercase block">তারিখ</span>
                  <span className="font-bold text-stone-900">{formatDate(pet.eventDate || pet.createdAt)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">ঘটনার বিবরণ</h3>
                <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line bg-stone-50/60 p-4 rounded-2xl border border-stone-100">
                  {pet.description}
                </p>
              </div>

              {pet.marks && (
                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-900">
                  <b>⚠️ শনাক্তকারী বিশেষ চিহ্ন:</b> {pet.marks}
                </div>
              )}

              {/* Owner / Admin Actions */}
              {(isOwner || isAdmin) && pet.status !== 'resolved' && (
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={handleMarkResolved}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>পোষ্য ঘরে ফিরেছে (Mark as Resolved)</span>
                  </button>
                </div>
              )}

              {/* Volunteer Rescue Claim Button */}
              {isVolunteer && !pet.rescueClaim && pet.status !== 'resolved' && (
                <div className="pt-2">
                  <button
                    onClick={handleVolunteerClaim}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 bg-stone-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all"
                  >
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>আমি উদ্ধারের দায়িত্ব নিচ্ছি (Claim Rescue)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-5">
            <h3 className="font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600" />
              <span>মন্তব্য ও সাইটিং আপডেট ({comments.length})</span>
            </h3>

            {user ? (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="আপনি কি একে কোথাও দেখেছেন? তথ্য ও এলাকা উল্লেখ করুন..."
                  className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={commentSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 rounded-2xl text-sm font-bold flex items-center justify-center shadow-md transition-all"
                >
                  {commentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            ) : (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center text-xs sm:text-sm">
                <span className="text-stone-500">মন্তব্য করতে বা প্রোফাইল দেখতে </span>
                <Link href="/login" className="text-amber-600 font-bold underline">লগইন করুন</Link>
                <span className="text-stone-500"> — তারপর কমেন্টে নামে ক্লিক করে যোগাযোগ করুন।</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              {comments.length === 0 && (
                <p className="text-center text-stone-400 text-sm py-4">এখনো কোনো মন্তব্য নেই। প্রথম সাইটিং আপডেট দিন!</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {c.authorId ? (
                        <Link
                          href={`/user/${c.authorId}`}
                          className="font-bold text-stone-900 hover:text-amber-700 hover:underline transition-colors"
                        >
                          {c.author}
                        </Link>
                      ) : (
                        <span className="font-bold text-stone-900">{c.author}</span>
                      )}
                      <RoleBadge role={c.authorRole || 'user'} size="xs" />
                    </div>
                    <span className="text-stone-400">{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Contact & QR */}
        <div className="space-y-5">
          {/* Contact Card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-3">
            <h3 className="font-bold text-stone-900 text-base">যোগাযোগের উপায়</h3>

            {pet.contactPhone ? (
              <div className="space-y-2.5">
                <a
                  href={`tel:${pet.contactPhone}`}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>সরাসরি কল: {pet.contactPhone}</span>
                </a>

                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp-এ মেসেজ পাঠান</span>
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400">ফোন নম্বর যুক্ত করা নেই। নিচের কমেন্ট বা সোশ্যাল লিংকে যোগাযোগ করুন।</p>
            )}

            {/* Owner social links */}
            {hasSocialLinks && (
              <div className="space-y-2 pt-1 border-t border-stone-100">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide pt-1">পোস্টদাতার সোশ্যাল প্রোফাইল</p>
                {ownerProfile?.socialLinks?.facebook && (
                  <a
                    href={ownerProfile.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#1877F2] hover:bg-[#0d65e0] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <span>📘 Facebook-এ দেখুন</span>
                  </a>
                )}
                {ownerProfile?.socialLinks?.instagram && (
                  <a
                    href={ownerProfile.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <span>📷 Instagram-এ দেখুন</span>
                  </a>
                )}
                {ownerProfile?.socialLinks?.whatsapp && (
                  <a
                    href={`https://wa.me/${ownerProfile.socialLinks.whatsapp.replace(/[^0-9]/g, '').replace(/^0/, '88')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <span>💬 WhatsApp-এ যোগাযোগ করুন</span>
                  </a>
                )}
              </div>
            )}

            <button
              onClick={() => setShowPosterModal(true)}
              className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-amber-200 transition-colors"
            >
              <Printer className="w-4 h-4 text-amber-700" />
              <span>প্রিন্টএবল মিসিং পোস্টার দেখুন</span>
            </button>
          </div>

          {/* QR Code */}
          {qrDataUrl && (
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm text-center space-y-3">
              <h3 className="font-bold text-stone-900 text-sm">ডিজিটাল QR কোড</h3>
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 inline-block">
                <img src={qrDataUrl} alt="QR Code" className="w-32 h-32 mx-auto rounded-lg" />
              </div>
              <p className="text-stone-400 text-[11px]">মোবাইলে স্ক্যান করে সহজেই এই পোস্টের বিস্তারিত পাওয়া যাবে</p>
              <a
                href={qrDataUrl}
                download={`pawtro-qr-${pet.petName || 'pet'}.png`}
                className="w-full py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>QR কোড ডাউনলোড</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
