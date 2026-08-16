import { Pet } from '@/types';
import PetCard from '@/components/PetCard';
import { HeartHandshake, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'পোষা প্রাণী দত্তক (Pet Adoption) — Pawtro',
  description: 'বিনামূল্যে বিড়াল ও কুকুর দত্তক নিন। একটি গৃহহীন প্রাণীকে ভালোবাসার পরিবার দিন।',
};

const DEMO_ADOPTIONS: Pet[] = [
  {
    id: 'adopt-1',
    userId: 'user-a1',
    type: 'adoption',
    species: 'cat',
    petName: 'তুলা (Tula)',
    breed: 'পার্সিয়ান মিক্স',
    colors: ['সাদা'],
    sex: 'female',
    age: '২ মাস',
    description: 'খুব আদুরে এবং পটি ট্রেইন্ড। ভালো যত্ন নিতে পারবে এমন পরিবারের জন্য প্রস্তুত।',
    images: [{ path: '', url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&auto=format&fit=crop&q=80' }],
    division: 'চট্টগ্রাম',
    area: 'জিইসি মোড়',
    lat: 22.3569,
    lng: 91.8205,
    geohash: 'wh1p9',
    eventDate: '2026-08-14',
    status: 'active',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'adopt-2',
    userId: 'user-a2',
    type: 'adoption',
    species: 'dog',
    petName: 'রকি (Rocky)',
    breed: 'দেশি পাপি',
    colors: ['বাদামি', 'কালো'],
    sex: 'male',
    age: '৩ মাস',
    description: 'রাস্তা থেকে রেসকিউ করা হয়েছিল। এখন সম্পূর্ণ সুস্থ ও প্রথম ডোজ ডি-ওয়ার্মিং সম্পন্ন।',
    images: [{ path: '', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80' }],
    division: 'ঢাকা',
    area: 'মিরপুর ১০',
    lat: 23.8067,
    lng: 90.3685,
    geohash: 'wh0r3',
    eventDate: '2026-08-13',
    status: 'active',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export default function AdoptionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl mb-12">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>অ্যাডপশন প্রোগ্রাম</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">একটি নিঃসঙ্গ প্রাণীকে নতুন জীবন দিন</h1>
          <p className="text-amber-100 text-sm sm:text-base leading-relaxed">
            পোষা প্রাণী কেনাবেচা নয়, দত্তক নেওয়াই মানবতার পরিচয়। Pawtro-তে সব প্রাণীর দত্তক সম্পূর্ণ বিনামূল্যে।
          </p>
          <div className="pt-2">
            <Link
              href="/post-pet"
              className="inline-flex items-center gap-2 bg-white text-amber-700 hover:bg-stone-100 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>দত্তক দেওয়ার পোস্ট দিন</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-stone-900">দত্তকের জন্য উপলব্ধ পোষ্যবৃন্দ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {DEMO_ADOPTIONS.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      </div>
    </div>
  );
}
