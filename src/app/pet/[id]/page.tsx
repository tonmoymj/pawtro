'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { doc, getDoc, collection, addDoc, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Pet, Comment } from '@/types';
import { formatDate } from '@/lib/utils';
import { 
  MapPin, 
  Calendar, 
  Phone, 
  Share2, 
  MessageSquare, 
  Download, 
  ArrowLeft, 
  Send,
  Loader2
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
        setPet({ id: snap.id, ...snap.data() } as Pet);
      } else {
        // Fallback for demo
        setPet({
          id: petId,
          userId: 'user-demo',
          type: 'lost',
          species: 'cat',
          petName: 'মিকি (Miki)',
          breed: 'দেশি বিড়াল',
          colors: ['সাদা', 'বাদামি'],
          sex: 'male',
          age: '১.৫ বছর',
          marks: 'গলায় লাল বেল্ট ও লেজের ডগায় সাদা দাগ',
          description: 'ধানমন্ডি ৮/এ লেকের কাছে গত ১০ আগস্ট বিকেলে হারিয়ে গেছে। খুব চঞ্চল ও ডাকাডাকি করে। কেউ সন্ধান পেলে দয়া করে যোগাযোগ করুন।',
          images: [{ path: '', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80' }],
          division: 'ঢাকা',
          area: 'ধানমন্ডি ৮/এ, ঢাকা',
          lat: 23.7461,
          lng: 90.3742,
          geohash: 'wh0r8',
          eventDate: '২০২৬-০৮-১০',
          contactPhone: '01711000000',
          status: 'active',
          isApproved: true,
          createdAt: '2026-08-10',
          updatedAt: '2026-08-10',
        });
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
        author: profile?.displayName || 'ব্যবহারকারী',
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'pets', petId, 'comments'), commentData);
      setComments([{ id: ref.id, ...commentData, createdAt: new Date().toISOString() }, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSubmitting(false);
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
      alert('পোস্টের লিংক কপি করা হয়েছে!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#1D6B5F] animate-spin" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center px-5">
        <h2 className="text-[17px] font-semibold text-[#111614]">পোস্ট পাওয়া যায়নি</h2>
        <Link href="/" className="mt-4 inline-block text-[#1D6B5F] font-semibold underline text-sm">
          ফিডে ফিরে যান
        </Link>
      </div>
    );
  }

  const badgeClass = pet.type === 'lost' ? 'b-lost' : pet.type === 'found' ? 'b-found' : 'b-adopt';
  const badgeLabel = pet.type === 'lost' ? 'হারিয়ে গেছে' : pet.type === 'found' ? 'পাওয়া গেছে' : 'দত্তক';

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#4F5A55] hover:text-[#111614] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ফিডে ফিরে যান</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Gallery & Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[6px] border border-[#E1E5E2] overflow-hidden">
            <div className="relative aspect-16/9 bg-[#F1F3F1]">
              <img
                src={pet.images?.[0]?.url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80'}
                alt={pet.petName || 'Pet'}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className={`text-[11px] font-semibold px-2 py-1 rounded-[3px] border ${badgeClass}`}>
                  {badgeLabel}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#111614]">
                    {pet.petName || (pet.species === 'cat' ? 'অচেনা বিড়াল' : 'অচেনা কুকুর')}
                  </h1>
                  <div className="flex items-center gap-1.5 text-[#8A948F] text-[13px] mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#1D6B5F] shrink-0" />
                    <span>{pet.area}, {pet.division}</span>
                  </div>
                </div>

                <button
                  onClick={sharePet}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#CDD4D0] hover:bg-[#F1F3F1] text-[#111614] text-[13px] font-medium transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>শেয়ার</span>
                </button>
              </div>

              {/* Data Table */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3.5 bg-[#F7F8F7] rounded-[6px] border border-[#E1E5E2] text-[13px]">
                <div>
                  <span className="text-[#8A948F] text-[11px] font-mono uppercase block">প্রজাতি</span>
                  <span className="font-semibold text-[#111614]">{pet.species === 'cat' ? 'বিড়াল' : 'কুকুর'}</span>
                </div>
                <div>
                  <span className="text-[#8A948F] text-[11px] font-mono uppercase block">জাত / ব্রিড</span>
                  <span className="font-semibold text-[#111614]">{pet.breed || 'দেশি'}</span>
                </div>
                <div>
                  <span className="text-[#8A948F] text-[11px] font-mono uppercase block">লিঙ্গ</span>
                  <span className="font-semibold text-[#111614]">{pet.sex === 'male' ? 'পুরুষ' : 'স্ত্রী'}</span>
                </div>
                <div>
                  <span className="text-[#8A948F] text-[11px] font-mono uppercase block">বয়স</span>
                  <span className="font-semibold text-[#111614]">{pet.age || 'অজানা'}</span>
                </div>
                <div>
                  <span className="text-[#8A948F] text-[11px] font-mono uppercase block">রং</span>
                  <span className="font-semibold text-[#111614]">{pet.colors?.join(', ') || 'মিক্স'}</span>
                </div>
                <div>
                  <span className="text-[#8A948F] text-[11px] font-mono uppercase block">তারিখ</span>
                  <span className="font-semibold text-[#111614]">{formatDate(pet.eventDate || pet.createdAt)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-[#111614] mb-1.5">ঘটনার বিবরণ</h3>
                <p className="text-[#4F5A55] text-[14px] leading-relaxed whitespace-pre-line">
                  {pet.description}
                </p>
              </div>

              {pet.marks && (
                <div className="p-3 bg-[#FCFDFC] rounded-[6px] border border-[#C2DAD5] text-[13px] text-[#1D6B5F]">
                  <b>শনাক্তকারী চিহ্ন:</b> {pet.marks}
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-[6px] p-6 border border-[#E1E5E2] space-y-4">
            <h3 className="font-bold text-[15px] text-[#111614] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1D6B5F]" />
              <span>মন্তব্য ও সাইটিং আপডেট ({comments.length})</span>
            </h3>

            {user ? (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="আপনি কি একে কোথাও দেখেছেন? তথ্য লিখুন..."
                  className="flex-1 px-3 py-2 bg-white border border-[#E1E5E2] rounded-[6px] text-[13.5px] focus:outline-none focus:border-[#111614]"
                />
                <button
                  type="submit"
                  disabled={commentSubmitting}
                  className="bg-[#111614] hover:bg-black text-white px-4 rounded-[6px] text-[13px] font-semibold flex items-center justify-center transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="p-3 bg-[#F7F8F7] rounded-[6px] border border-[#E1E5E2] text-center text-[13px] text-[#4F5A55]">
                মন্তব্য করতে দয়া করে <Link href="/login" className="text-[#1D6B5F] font-semibold underline">লগইন</Link> করুন।
              </div>
            )}

            <div className="space-y-2 pt-2">
              {comments.map((c) => (
                <div key={c.id} className="p-3 bg-[#F7F8F7] rounded-[6px] border border-[#E1E5E2] space-y-1">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-bold text-[#111614]">{c.author}</span>
                    <span className="text-[#8A948F]">{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="text-[#4F5A55] text-[13px]">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Contact & QR */}
        <div className="space-y-4">
          <div className="bg-white rounded-[6px] p-5 border border-[#E1E5E2] space-y-3">
            <h3 className="font-bold text-[#111614] text-[14.5px]">যোগাযোগের তথ্য</h3>
            {pet.contactPhone ? (
              <a
                href={`tel:${pet.contactPhone}`}
                className="w-full py-2.5 px-4 bg-[#1D6B5F] hover:bg-[#15544a] text-white font-semibold rounded-[6px] text-[13.5px] flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>কল করুন: {pet.contactPhone}</span>
              </a>
            ) : (
              <p className="text-[12.5px] text-[#8A948F]">ফোন নম্বর দেওয়া নেই। নিচে কমেন্টে যোগাযোগ করুন।</p>
            )}
          </div>

          {qrDataUrl && (
            <div className="bg-white rounded-[6px] p-5 border border-[#E1E5E2] text-center space-y-3">
              <h3 className="font-bold text-[#111614] text-[14px]">ডিজিটাল QR কোড</h3>
              <div className="bg-[#F7F8F7] p-3 rounded-[6px] border border-[#E1E5E2] inline-block">
                <img src={qrDataUrl} alt="QR Code" className="w-32 h-32 mx-auto" />
              </div>
              <a
                href={qrDataUrl}
                download={`pawtro-qr-${pet.petName || 'pet'}.png`}
                className="w-full py-2 px-3 bg-[#F1F3F1] hover:bg-[#E1E5E2] text-[#111614] font-medium rounded-[6px] text-[12.5px] flex items-center justify-center gap-1.5 transition-colors"
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
