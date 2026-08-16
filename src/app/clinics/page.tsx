import { Building2, Phone, MapPin, Clock } from 'lucide-react';

export const metadata = {
  title: 'ভেটেরিনারি ক্লিনিক ডিরেক্টরি — Pawtro',
  description: 'বাংলাদেশের সব বড় শহরের জরুরি পেট ক্লিনিক ও চিকিৎসকের তালিকা।',
};

const CLINICS = [
  {
    id: 'c-1',
    name: 'সেন্ট্রাল ভেটেরিনারি হসপিটাল (সরকারি)',
    address: '৪৮ কাজী আলাউদ্দিন রোড, ঢাকা',
    phone: '02-7117825',
    hours: 'সকাল ৯:০০ - বিকেল ৫:০০',
    division: 'ঢাকা',
  },
  {
    id: 'c-2',
    name: 'কেয়ার অ্যান্ড কিউর অ্যানিমেল ক্লিনিক',
    address: 'রোড ১১, বনানী, ঢাকা',
    phone: '01711-000000',
    hours: '২৪ ঘণ্টা জরুরি সেবা',
    division: 'ঢাকা',
  },
  {
    id: 'c-3',
    name: 'চিটাগং পেট হসপিটাল অ্যান্ড ডায়াগনস্টিক',
    address: 'প্রবর্তক মোড়, পাঁচলাইশ, চট্টগ্রাম',
    phone: '01819-000000',
    hours: 'সকাল ১০:০০ - রাত ৮:০০',
    division: 'চট্টগ্রাম',
  },
  {
    id: 'c-4',
    name: 'রাজশাহী অ্যানিমেল কেয়ার',
    address: 'আলুপট্টি মোড়, রাজশাহী',
    phone: '01712-000000',
    hours: 'সকাল ৯:০০ - সন্ধ্যা ৭:০০',
    division: 'রাজশাহী',
  }
];

export default function ClinicsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900">জরুরি ভেট ক্লিনিক ডিরেক্টরি</h1>
        <p className="text-stone-500 text-sm mt-1">
          জরুরি অবস্থায় আপনার নিকটস্থ পশু হাসপাতাল বা ক্লিনিকে যোগাযোগ করুন
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CLINICS.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg text-stone-900">{c.name}</h3>
              <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-2.5 py-1 rounded-lg">
                {c.division}
              </span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-stone-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{c.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                <span>{c.hours}</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={`tel:${c.phone}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs sm:text-sm hover:bg-emerald-100 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>{c.phone}</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
