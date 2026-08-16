import { ShieldCheck, Phone, MapPin, Heart } from 'lucide-react';

export const metadata = {
  title: 'রেসকিউ টিম ও শেল্টার — Pawtro',
  description: 'বাংলাদেশের ভেরিফায়েড অ্যানিমেল রেসকিউ টিম ও স্বেচ্ছাসেবকদের তালিকা।',
};

const TEAMS = [
  {
    id: 't-1',
    name: 'পজ কেয়ার বাংলাদেশ (PAW Care BD)',
    area: 'ঢাকা সমগ্র',
    phone: '01710-000000',
    description: 'রাস্তার আহত এবং অসুস্থ বিড়াল ও কুকুরের জরুরি উদ্ধার ও চিকিৎসা প্রদান।',
    verified: true,
  },
  {
    id: 't-2',
    name: 'কেয়ার ফর পজ (Care For Paws)',
    area: 'মিরপুর, ঢাকা',
    phone: '01810-000000',
    description: 'প্রাণী সংরক্ষণ, রেসকিউ এবং স্পে/নিউটার কার্যক্রমে নিয়োজিত।',
    verified: true,
  },
  {
    id: 't-3',
    name: 'চট্টগ্রাম অ্যানিমেল রেসকিউ ফ্রন্ট',
    area: 'চট্টগ্রাম শহর',
    phone: '01910-000000',
    description: 'চট্টগ্রাম এলাকার নিঃস্ব ও গৃহহীন প্রাণীদের আশ্রয় এবং চিকিৎসা সেবা।',
    verified: true,
  }
];

export default function RescueTeamsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900">ভেরিফায়েড রেসকিউ টিম ও শেল্টার</h1>
        <p className="text-stone-500 text-sm mt-1">
          জরুরি উদ্ধারে অভিজ্ঞ ও নিবেদিত স্বেচ্ছাসেবক দলের সাথে যোগাযোগ করুন
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TEAMS.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg text-stone-900">{t.name}</h3>
                {t.verified && (
                  <span title="ভেরিফায়েড">
                    <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-3">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.area}</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {t.description}
              </p>
            </div>

            <div className="pt-5 mt-4 border-t border-stone-100">
              <a
                href={`tel:${t.phone}`}
                className="w-full py-2.5 px-4 bg-stone-100 hover:bg-amber-600 hover:text-white text-stone-800 font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>কল করুন</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
