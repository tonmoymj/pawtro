'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import PostPetModal from '@/components/PostPetModal';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types
export type PetType = 'lost' | 'found' | 'adopt';
export type Species = 'dog' | 'cat' | 'bird' | 'other';

export interface Sighting {
  lat: number;
  lng: number;
  date: string;
  area: string;
  note: string;
}

export interface Comment {
  author: string;
  text: string;
  at: string;
}

export interface Report {
  reason: string;
  detail: string;
  at: number;
}

export interface Interest {
  name: string;
  phone: string;
  home: string;
  exp: string;
  msg: string;
  at: string;
}

export interface Pet {
  id: number;
  type: PetType;
  species: Species;
  breed: string;
  colors: string[];
  name?: string | null;
  photos?: number;
  images?: string[];
  division: string;
  area: string;
  lat: number;
  lng: number;
  date: string;
  sex: string;
  age: string;
  marks: string;
  sig: number[];
  sightings?: Sighting[];
  comments?: Comment[];
  reports?: Report[];
  interests?: Interest[];
  desc: string;
  resolved?: boolean;
  mine?: boolean;
  _new?: number;
  org?: string;
  health?: {
    vaccinated?: string;
    notes?: string;
  } | null;
}

export interface Story {
  id: number;
  petId?: number;
  title: string;
  text: string;
  by: string;
  at: string;
  species: Species;
  image?: string | null;
  area: string;
}

export interface Sub {
  division: string;
  species: string;
  tab: string;
  at: number;
}

const HOME = { lat: 24.3745, lng: 88.6042 };
const TODAY = new Date('2026-08-02');
const SPECIES_BN: Record<Species, string> = { dog: 'কুকুর', cat: 'বিড়াল', bird: 'পাখি', other: 'অন্যান্য' };
const TYPE_CONFIG: Record<PetType, { bn: string; cls: string }> = {
  lost: { bn: 'হারিয়েছে', cls: 'lost' },
  found: { bn: 'পাওয়া গেছে', cls: 'found' },
  adopt: { bn: 'দত্তক', cls: 'adopt' },
};
const TINT: Record<Species, string> = { dog: '#F2EDE6', cat: '#EAEEF2', bird: '#E9F0E9', other: '#F0EBEF' };
const DIVISIONS = ['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'];
const DIVCENTER: Record<string, { lat: number; lng: number }> = {
  'ঢাকা': { lat: 23.8103, lng: 90.4125 },
  'চট্টগ্রাম': { lat: 22.3569, lng: 91.7832 },
  'রাজশাহী': { lat: 24.3745, lng: 88.6042 },
  'খুলনা': { lat: 22.8456, lng: 89.5403 },
  'বরিশাল': { lat: 22.7010, lng: 90.3535 },
  'সিলেট': { lat: 24.8949, lng: 91.8687 },
  'রংপুর': { lat: 25.7439, lng: 89.2752 },
  'ময়মনসিংহ': { lat: 24.7471, lng: 90.4203 },
};

const CLINICS = [
  { name: 'Pet Care', address: 'উপশহর রোড, ক্যান্টনমেন্ট রোড, রাজশাহী', lat: 24.3786, lng: 88.5944, phone: '+8801907395718', hours: 'রোজ ১০টা - রাত ১০টা (শুক্র বিকেল থেকে)', rating: 4.7 },
  { name: 'Birds & Pet Animal Clinic', address: 'রাজশাহী মেট্রোপলিটন এলাকা', lat: 24.3754, lng: 88.6006, phone: '+8801780790526', hours: 'রোজ সকাল ৯টা - রাত ৮টা', rating: 4.3 },
  { name: 'Pet 360°', address: 'ভদ্রা মোড় (বেস্ট বাইয়ের বিপরীতে), রাজশাহী', lat: 24.3754, lng: 88.6212, phone: '+8801771533043', hours: 'শনিবার ২৪ ঘণ্টা, অন্যান্য দিন ১০টা - রাত ১২টা', rating: 5.0 },
  { name: 'Veterinary Teaching Hospital, রাজশাহী বিশ্ববিদ্যালয়', address: 'রাজশাহী বিশ্ববিদ্যালয় ক্যাম্পাস', lat: 24.3759, lng: 88.6341, phone: null, hours: '২৪ ঘণ্টা খোলা', rating: 5.0 },
  { name: 'রানীনগর ভেটেরিনারি হাসপাতাল (সরকারি)', address: 'মান্নাফের মোড়, রাজশাহী', lat: 24.3649, lng: 88.6252, phone: '+880721750291', hours: 'সকাল ৯টা - বিকেল ৪টা (শুক্রবার বন্ধ)', rating: 3.6 },
];

const RESCUE_TEAMS = [
  { name: 'RobinHood The Animal Rescuer', area: 'ঢাকা', verified: true, desc: 'আহত ও পথের প্রাণী উদ্ধার, চিকিৎসা ও পুনর্বাসন। ঢাকায় সক্রিয়, জরুরি কল নেয়।', phone: '+8801970737283' },
  { name: 'Obhoyaronno — Bangladesh Animal Welfare Foundation', area: 'ঢাকা', verified: true, desc: 'নিউটারিং, টিকা ও উদ্ধার কার্যক্রম। মহাখালী ডিএনসিসি মার্কেটে ক্লিনিক আছে।', phone: '+8801718643497' },
  { name: 'Bangladesh Animal Welfare Association (BAWA)', area: 'ঢাকা', verified: true, desc: 'প্রাণী কল্যাণ সংস্থা — উদ্ধার, চিকিৎসা সহায়তা ও দত্তক সমন্বয়।', phone: '+8801346990244' },
];

const INITIAL_DATA: Pet[] = [];

const ROMAN: Record<string, string> = {
  kukur: 'কুকুর', dog: 'কুকুর', biral: 'বিড়াল', beral: 'বিড়াল', cat: 'বিড়াল', pakhi: 'পাখি', bird: 'পাখি',
  khorgosh: 'খরগোশ', khargosh: 'খরগোশ', rabbit: 'খরগোশ',
  sada: 'সাদা', white: 'সাদা', kalo: 'কালো', black: 'কালো', badami: 'বাদামি', brown: 'বাদামি',
  dhusor: 'ধূসর', grey: 'ধূসর', gray: 'ধূসর', komla: 'কমলা', orange: 'কমলা', sobuj: 'সবুজ', green: 'সবুজ',
  holud: 'হলুদ', yellow: 'হলুদ', neel: 'নীল', blue: 'নীল',
  deshi: 'দেশি', desi: 'দেশি', persian: 'পার্সিয়ান', bajrigar: 'বাজরিগার', budgie: 'বাজরিগার',
  harano: 'হারিয়েছে', hariyeche: 'হারিয়েছে', lost: 'হারিয়েছে', paoa: 'পাওয়া', found: 'পাওয়া',
  dottok: 'দত্তক', adopt: 'দত্তক', adoption: 'দত্তক',
  rajshahi: 'রাজশাহী', dhaka: 'ঢাকা', chittagong: 'চট্টগ্রাম', chattogram: 'চট্টগ্রাম', ctg: 'চট্টগ্রাম',
  khulna: 'খুলনা', sylhet: 'সিলেট', barishal: 'বরিশাল', barisal: 'বরিশাল', rangpur: 'রংপুর', mymensingh: 'ময়মনসিংহ',
  belt: 'বেল্ট', tika: 'টিকা', bachcha: 'বাচ্চা',
};

const bn = (n: number | string) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);

const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const t = (x: number) => (x * Math.PI) / 180;
  const dLat = t(b.lat - a.lat);
  const dLng = t(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const daysAgo = (d: string) => Math.round((TODAY.getTime() - new Date(d).getTime()) / 864e5);
const agoText = (d: string) => {
  const n = daysAgo(d);
  return n <= 0 ? 'আজ' : n === 1 ? 'গতকাল' : bn(n) + ' দিন আগে';
};

const cos = (a: number[], b: number[]) => {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const m = (x: number[]) => Math.sqrt(x.reduce((s, v) => s + v * v, 0));
  return dot / (m(a) * m(b));
};

function queryTerms(q: string) {
  const raw = q.trim().toLowerCase();
  if (!raw) return [];
  if (!/[a-z]/.test(raw)) return [raw];
  const out: string[] = [];
  raw.split(/\s+/).forEach((w) => {
    out.push(w);
    if (ROMAN[w]) out.push(ROMAN[w].toLowerCase());
  });
  return out;
}

// Icons
const Icons = {
  paw: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="7" cy="8.5" rx="2.3" ry="3.1" transform="rotate(-18 7 8.5)" />
      <ellipse cx="12" cy="6.4" rx="2.3" ry="3.3" />
      <ellipse cx="17" cy="8.5" rx="2.3" ry="3.1" transform="rotate(18 17 8.5)" />
      <path d="M12 12.2c3.1 0 5.6 2.3 5.6 5 0 2-1.5 3.2-3.4 3.2-1 0-1.6-.4-2.2-.4s-1.2.4-2.2.4c-1.9 0-3.4-1.2-3.4-3.2 0-2.7 2.5-5 5.6-5z" />
    </svg>
  ),
  verified: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[10px] h-[10px] inline-block mr-0.5">
      <path d="M12 2l2.4 2.1 3.1-.5 1 3 2.8 1.5-.7 3.1 1.6 2.8-2.4 2.1.3 3.2-3.1.5-1.7 2.7-2.9-1.3-2.9 1.3-1.7-2.7-3.1-.5.3-3.2-2.4-2.1 1.6-2.8-.7-3.1 2.8-1.5 1-3 3.1.5z" />
      <path d="M9 12.5l2 2 4-4.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  dog: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M12 14c0-4 1-6 2-6s4 3 6 4" />
      <path d="M36 14c0-4-1-6-2-6s-4 3-6 4" />
      <path d="M12 14c0 3-1 5-1 9 0 8 6 13 13 13s13-5 13-13c0-4-1-6-1-9" />
      <circle cx="19" cy="24" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="29" cy="24" r="1.6" fill="currentColor" stroke="none" />
      <path d="M24 29v2M21 33c1 1.2 5 1.2 6 0" />
      <ellipse cx="24" cy="29" rx="2.6" ry="1.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  cat: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M13 20 11 9l8 5" />
      <path d="M35 20 37 9l-8 5" />
      <path d="M13 20c-1 3-1 5-1 7 0 7 5 11 12 11s12-4 12-11c0-2 0-4-1-7" />
      <circle cx="19" cy="25" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="29" cy="25" r="1.6" fill="currentColor" stroke="none" />
      <path d="M24 29.5v1.5M21 32c1 1 5 1 6 0" />
      <path d="M8 27h7M8 31h7M40 27h-7M40 31h-7" />
    </svg>
  ),
  bird: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M30 12a6 6 0 1 0-8.5 5.5C17 20 14 25 14 30c0 5 4 8 9 8s11-5 11-13c0-4-1-7-2-9" />
      <path d="M30 12l6 3-6 3" />
      <circle cx="28" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M20 25c4 2 8 3 12 2" />
      <path d="M20 38l-2 4M27 38l2 4" />
    </svg>
  ),
  other: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="18" cy="14" rx="3.2" ry="8" transform="rotate(-12 18 14)" />
      <ellipse cx="29" cy="14" rx="3.2" ry="8" transform="rotate(12 29 14)" />
      <path d="M15 24c-1 2-2 4-2 7 0 5 5 8 11 8s11-3 11-8c0-3-1-5-2-7" />
      <circle cx="19" cy="29" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="29" cy="29" r="1.5" fill="currentColor" stroke="none" />
      <path d="M24 32v2M21 35c1 1 5 1 6 0" />
    </svg>
  ),
};

export default function PawtroHome() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [data, setData] = useState<Pet[]>(INITIAL_DATA);
  const [stories, setStories] = useState<Story[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [readNotifs, setReadNotifs] = useState<number[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postModalType, setPostModalType] = useState<'lost' | 'found' | 'adoption'>('lost');

  // Real-time live Firestore data listener
  useEffect(() => {
    try {
      const q = query(collection(db, 'pets'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const livePets: Pet[] = snap.docs.map((docSnap, index) => {
            const d = docSnap.data();
            return {
              id: (index + 1) as any,
              type: (d.type === 'adoption' ? 'adopt' : d.type) as PetType,
              species: (d.species || 'cat') as Species,
              breed: d.breed || 'দেশি',
              colors: Array.isArray(d.colors) && d.colors.length ? d.colors : ['মিশ্র'],
              name: d.petName || (d.species === 'cat' ? 'বিড়াল' : 'কুকুর'),
              photos: d.images?.length || 1,
              images: d.images?.map((im: any) => im.url) || [],
              division: d.division || 'ঢাকা',
              area: d.area || '',
              lat: d.lat || 23.8103,
              lng: d.lng || 90.4125,
              date: d.eventDate || new Date().toISOString().split('T')[0],
              sex: d.sex === 'male' ? 'পুরুষ' : d.sex === 'female' ? 'মহিলা' : 'অজানা',
              age: d.age || '—',
              marks: d.marks || '—',
              sig: [0.5, 0.5, 0.5],
              desc: d.description || '',
              resolved: d.status === 'resolved',
            };
          });
          setData(livePets);
        } else {
          setData([]);
        }
      }, (err) => {
        console.warn('Live pets snapshot fallback:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Live pets listener setup notice:', e);
    }
  }, []);

  // UI state
  const [page, setPage] = useState<'board' | 'stories' | 'help'>('board');
  const [tab, setTab] = useState<string>('all');
  const [species, setSpecies] = useState<string>('all');
  const [division, setDivision] = useState<string>('all');
  const [radius, setRadius] = useState<number>(25);
  const [q, setQ] = useState<string>('');
  const [mineOnly, setMineOnly] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Drawer / Sheet state
  const [drawerMode, setDrawerMode] = useState<'pet' | 'report' | 'interest' | 'story' | 'notifs' | 'form' | 'sighting' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formStep, setFormStep] = useState<number>(1);
  const [formType, setFormType] = useState<PetType>('lost');
  const [formSpecies, setFormSpecies] = useState<Species>('dog');
  const [formName, setFormName] = useState<string>('');
  const [formBreed, setFormBreed] = useState<string>('দেশি');
  const [formColors, setFormColors] = useState<string>('');
  const [formSex, setFormSex] = useState<string>('পুরুষ');
  const [formAge, setFormAge] = useState<string>('');
  const [formDivision, setFormDivision] = useState<string>('রাজশাহী');
  const [formDate, setFormDate] = useState<string>('2026-08-02');
  const [formArea, setFormArea] = useState<string>('');
  const [formMarks, setFormMarks] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formVac, setFormVac] = useState<string>('হ্যাঁ');
  const [formHealth, setFormHealth] = useState<string>('');
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number }>(HOME);

  // Sighting form states
  const [sightingPetId, setSightingPetId] = useState<number | null>(null);
  const [sDate, setSDate] = useState<string>('2026-08-02');
  const [sArea, setSArea] = useState<string>('');
  const [sNote, setSNote] = useState<string>('');
  const [sPicked, setSPicked] = useState<{ lat: number; lng: number }>(HOME);

  // Comment input
  const [commentName, setCommentName] = useState<string>('');
  const [commentText, setCommentText] = useState<string>('');

  // Report input
  const [rReason, setRReason] = useState<string>('ভুয়া বা বিভ্রান্তিকর');
  const [rDetail, setRDetail] = useState<string>('');

  // Interest / Adoption form input
  const [iName, setIName] = useState<string>('');
  const [iPhone, setIPhone] = useState<string>('');
  const [iHome, setIHome] = useState<string>('ফ্ল্যাট');
  const [iExp, setIExp] = useState<string>('আগে পোষ্য ছিল');
  const [iMsg, setIMsg] = useState<string>('');

  // Story form input
  const [stTitle, setStTitle] = useState<string>('');
  const [stText, setStText] = useState<string>('');
  const [stBy, setStBy] = useState<string>('');

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const radiusRingRef = useRef<any>(null);
  const pickMapRef = useRef<any>(null);
  const pickMapContainerRef = useRef<HTMLDivElement>(null);
  const sightingMapRef = useRef<any>(null);
  const sightingMapContainerRef = useRef<HTMLDivElement>(null);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  }, []);

  // Theme toggle
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', current);
    try {
      localStorage.setItem('pawtro:theme', current);
    } catch {}
    showToast(current === 'dark' ? 'ডার্ক মোড চালু' : 'লাইট মোড চালু');
  };

  // Center coordinate
  const currentCenter = useMemo(() => {
    return division === 'all' ? HOME : DIVCENTER[division] || HOME;
  }, [division]);

  // AI Matching algorithm
  const getMatchesFor = useCallback(
    (pet: Pet) => {
      if (pet.type !== 'lost') return [];
      return data
        .filter((o) => o.type === 'found' && o.species === pet.species && !o.resolved)
        .map((o) => {
          const dist = km(pet, o);
          const dayGap = Math.abs(daysAgo(pet.date) - daysAgo(o.date));
          const shared = pet.colors.filter((c) => o.colors.includes(c)).length;
          const colorScore = shared / Math.max(pet.colors.length, o.colors.length);
          const breedBonus = pet.breed && pet.breed === o.breed ? 0.25 : 0;
          const petSig = pet.sig || [0.5, 0.5, 0.5];
          const oSig = o.sig || [0.5, 0.5, 0.5];
          const parts = {
            visual: Math.max(0, cos(petSig, oSig)) * 0.5,
            dist: Math.max(0, 1 - dist / 15) * 0.25,
            traits: Math.min(1, colorScore + breedBonus) * 0.15,
            time: Math.max(0, 1 - dayGap / 30) * 0.1,
          };
          return { pet: o, dist, parts, total: parts.visual + parts.dist + parts.traits + parts.time };
        })
        .filter((m) => m.total >= 0.45)
        .sort((a, b) => b.total - a.total)
        .slice(0, 4);
    },
    [data]
  );

  // Visible posts filtering
  const visiblePets = useMemo(() => {
    const c = currentCenter;
    return data
      .filter((p) => {
        if (tab !== 'all' && p.type !== tab) return false;
        if (species !== 'all' && p.species !== species) return false;
        if (division !== 'all') {
          if (p.division !== division) return false;
        } else if (km(c, p) > radius) return false;
        if (mineOnly && !p.mine) return false;
        if (q) {
          const hay = [p.name, p.breed, p.area, p.division, p.desc, p.marks, ...(p.colors || []), SPECIES_BN[p.species], TYPE_CONFIG[p.type]?.bn]
            .join(' ')
            .toLowerCase();
          const terms = queryTerms(q);
          if (!terms.some((t) => hay.includes(t))) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, tab, species, division, radius, mineOnly, q, currentCenter]);

  // Notifications calculation
  const notifications = useMemo(() => {
    return data.filter(
      (p) =>
        p._new &&
        !readNotifs.includes(p.id) &&
        subs.some(
          (sb) =>
            (sb.division === 'all' || sb.division === p.division) &&
            (sb.species === 'all' || sb.species === p.species) &&
            (sb.tab === 'all' || sb.tab === p.type) &&
            p._new! > sb.at
        )
    );
  }, [data, readNotifs, subs]);

  // Load initial saved data from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pawtro:state');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.data && parsed.data.length) setData(parsed.data);
        if (parsed.stories) setStories(parsed.stories);
        if (parsed.subs) setSubs(parsed.subs);
        if (parsed.read) setReadNotifs(parsed.read);
      }
    } catch {}
  }, []);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem('pawtro:state', JSON.stringify({ data, stories, subs, read: readNotifs, v: 1 }));
    } catch {}
  }, [data, stories, subs, readNotifs]);

  // Main Map Init and Marker Rendering
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([HOME.lat, HOME.lng], 13);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);

      const ring = L.circle([HOME.lat, HOME.lng], {
        radius: 25000,
        color: '#1D6B5F',
        weight: 1,
        fillColor: '#1D6B5F',
        fillOpacity: 0.035,
        dashArray: '4 4',
      }).addTo(map);

      const markers = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      radiusRingRef.current = ring;
      markersLayerRef.current = markers;
    }

    const map = mapInstanceRef.current;
    const markers = markersLayerRef.current;
    const ring = radiusRingRef.current;

    // Update radius ring
    const c = currentCenter;
    ring.setLatLng([c.lat, c.lng]);
    ring.setRadius(radius * 1000);
    ring.setStyle({
      opacity: division === 'all' ? 1 : 0,
      fillOpacity: division === 'all' ? 0.035 : 0,
    });

    // Draw markers
    markers.clearLayers();
    visiblePets.forEach((p) => {
      const isSel = selectedId === p.id;
      const col = p.type === 'lost' ? '#9E3B36' : p.type === 'found' ? '#1D6B5F' : '#46577F';
      const icon = L.divIcon({
        className: '',
        iconSize: isSel ? [20, 20] : [14, 14],
        iconAnchor: isSel ? [10, 10] : [7, 7],
        html: `<div class="pin${isSel ? ' sel' : ''}" style="background:${col}"></div>`,
      });

      L.marker([p.lat, p.lng], { icon })
        .on('click', () => {
          setSelectedId(p.id);
          setDrawerMode('pet');
        })
        .addTo(markers);
    });

    // Sighting trail for active pet
    const sel = data.find((p) => p.id === selectedId);
    if (sel && (sel.sightings || []).length) {
      const pts: [number, number][] = [[sel.lat, sel.lng]];
      [...sel.sightings!].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach((s) => {
        pts.push([s.lat, s.lng]);
        L.marker([s.lat, s.lng], {
          icon: L.divIcon({
            className: '',
            iconSize: [13, 13],
            iconAnchor: [6, 6],
            html: '<div class="pin sight"></div>',
          }),
        })
          .bindTooltip((s.area || 'দেখা গেছে') + ' · ' + agoText(s.date))
          .addTo(markers);
      });
      L.polyline(pts, { color: '#9E3B36', weight: 1.5, dashArray: '4 5', opacity: 0.8 }).addTo(markers);
    }
  }, [visiblePets, selectedId, data, currentCenter, division, radius]);

  // Handle opening a pet
  const openPet = (id: number) => {
    setSelectedId(id);
    setDrawerMode('pet');
    const p = data.find((x) => x.id === id);
    if (p && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([p.lat, p.lng], 15, { duration: 0.6 });
    }
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setSelectedId(null);
  };

  // Open New/Edit Post Wizard
  const openFormModal = (preset?: PetType, editId?: number) => {
    setEditingId(editId || null);
    setFormStep(1);
    const existing = editId ? data.find((x) => x.id === editId) : null;
    if (existing) {
      setDraftImages(existing.images || []);
      setFormType(existing.type);
      setFormSpecies(existing.species);
      setFormName(existing.name || '');
      setFormBreed(existing.breed);
      setFormColors((existing.colors || []).join(', '));
      setFormSex(existing.sex);
      setFormAge(existing.age);
      setFormDivision(existing.division);
      setFormDate(existing.date);
      setFormArea(existing.area);
      setFormMarks(existing.marks);
      setFormDesc(existing.desc);
      setFormVac(existing.health?.vaccinated || 'হ্যাঁ');
      setFormHealth(existing.health?.notes || '');
      setPickedLocation({ lat: existing.lat, lng: existing.lng });
    } else {
      setDraftImages([]);
      setFormType(preset || 'lost');
      setFormSpecies('dog');
      setFormName('');
      setFormBreed('দেশি');
      setFormColors('');
      setFormSex('পুরুষ');
      setFormAge('অজানা');
      setFormDivision('রাজশাহী');
      setFormDate('2026-08-02');
      setFormArea('');
      setFormMarks('');
      setFormDesc('');
      setFormVac('হ্যাঁ');
      setFormHealth('');
      setPickedLocation({ ...HOME });
    }
    setDrawerMode('form');
  };

  // Step 2 Pick Map initializer
  useEffect(() => {
    if (drawerMode === 'form' && formStep === 2) {
      setTimeout(() => {
        if (!pickMapContainerRef.current) return;
        const L = (window as any).L;
        if (!L) return;
        if (pickMapRef.current) {
          pickMapRef.current.remove();
        }
        const pmap = L.map(pickMapContainerRef.current, { zoomControl: false }).setView([pickedLocation.lat, pickedLocation.lng], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(pmap);
        const marker = L.marker([pickedLocation.lat, pickedLocation.lng], {
          icon: L.divIcon({
            className: '',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            html: '<div class="pin sel" style="background:#9E3B36"></div>',
          }),
        }).addTo(pmap);

        pmap.on('click', (e: any) => {
          setPickedLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
          marker.setLatLng(e.latlng);
        });
        pickMapRef.current = pmap;
        pmap.invalidateSize();
      }, 80);
    }
  }, [drawerMode, formStep, pickedLocation]);

  // Sighting Picker Map Initializer
  useEffect(() => {
    if (drawerMode === 'sighting' && sightingPetId) {
      const p = data.find((x) => x.id === sightingPetId);
      if (!p) return;
      setTimeout(() => {
        if (!sightingMapContainerRef.current) return;
        const L = (window as any).L;
        if (!L) return;
        if (sightingMapRef.current) {
          sightingMapRef.current.remove();
        }
        const smap = L.map(sightingMapContainerRef.current, { zoomControl: false }).setView([p.lat, p.lng], 14);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(smap);
        L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: '',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            html: '<div class="pin" style="background:#9E3B36"></div>',
          }),
        })
          .bindTooltip('হারানোর জায়গা')
          .addTo(smap);

        const marker = L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: '',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            html: '<div class="pin sight" style="width:16px;height:16px"></div>',
          }),
        }).addTo(smap);

        setSPicked({ lat: p.lat, lng: p.lng });

        smap.on('click', (e: any) => {
          setSPicked({ lat: e.latlng.lat, lng: e.latlng.lng });
          marker.setLatLng(e.latlng);
        });
        sightingMapRef.current = smap;
        smap.invalidateSize();
      }, 80);
    }
  }, [drawerMode, sightingPetId, data]);

  // Form image upload handler
  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    const remaining = 6 - draftImages.length;
    Array.from(files).slice(0, remaining).forEach((f) => {
      if (!f.type.startsWith('image/')) return;
      const r = new FileReader();
      r.onload = () => {
        if (typeof r.result === 'string') {
          setDraftImages((prev) => [...prev, r.result as string]);
        }
      };
      r.readAsDataURL(f);
    });
  };

  // Submit Post
  const submitPost = () => {
    if (!formDesc.trim()) {
      showToast('একটু বিবরণ লিখুন — এটাই মানুষকে চিনতে সাহায্য করে');
      return;
    }
    const colorArray = formColors ? formColors.split(',').map((x) => x.trim()).filter(Boolean) : ['অজানা'];
    const fields: Partial<Pet> = {
      type: formType,
      species: formSpecies,
      breed: formBreed || 'অজানা',
      colors: colorArray,
      name: formName || null,
      division: formDivision,
      area: formArea || 'রাজশাহী',
      lat: pickedLocation.lat,
      lng: pickedLocation.lng,
      date: formDate,
      sex: formSex,
      age: formAge || 'অজানা',
      marks: formMarks || '—',
      desc: formDesc,
      images: draftImages,
      photos: Math.max(1, draftImages.length),
      health: formType === 'adopt' ? { vaccinated: formVac, notes: formHealth } : null,
    };

    if (editingId) {
      setData((prev) => prev.map((p) => (p.id === editingId ? ({ ...p, ...fields } as Pet) : p)));
      const id = editingId;
      setDrawerMode('pet');
      setSelectedId(id);
      showToast('পরিবর্তন সংরক্ষিত হয়েছে');
      return;
    }

    const newPet: Pet = {
      ...(fields as any),
      id: Math.max(0, ...data.map((x) => x.id)) + 1,
      mine: true,
      _new: Date.now(),
      sightings: [],
      comments: [],
      reports: [],
      interests: [],
      sig: [Math.random(), Math.random(), Math.random()],
    };

    setData((prev) => [...prev, newPet]);
    setTab('all');
    setDivision(newPet.division);
    closeDrawer();
    const ms = getMatchesFor(newPet);
    setTimeout(() => {
      openPet(newPet.id);
      if (ms.length) showToast('পোস্ট প্রকাশিত · ' + bn(ms.length) + 'টি সম্ভাব্য মিল পাওয়া গেছে');
      else if (newPet.type !== 'adopt') showToast('পোস্ট প্রকাশিত — পোস্টার নামিয়ে এলাকায় লাগাতে পারেন');
      else showToast('পোস্ট প্রকাশিত।');
    }, 320);
  };

  // Add Comment
  const handleAddComment = (petId: number) => {
    if (!commentText.trim()) {
      showToast('কিছু লিখুন');
      return;
    }
    const author = commentName.trim() || 'নাম দেননি';
    setData((prev) =>
      prev.map((p) => {
        if (p.id === petId) {
          const comments = p.comments || [];
          return { ...p, comments: [...comments, { author, text: commentText.trim(), at: 'এইমাত্র' }] };
        }
        return p;
      })
    );
    setCommentText('');
    setCommentName('');
    showToast('আপডেট যোগ হয়েছে');
  };

  // Mark Post Resolved
  const handleResolve = (petId: number) => {
    setData((prev) => prev.map((p) => (p.id === petId ? { ...p, resolved: true } : p)));
    const p = data.find((x) => x.id === petId);
    if (p) {
      setStTitle(p.name ? `${p.name} ফিরে এসেছে` : 'ফিরে পেলাম');
      setStText('');
      setStBy('');
      setDrawerMode('story');
    }
  };

  // Save Success Story
  const handleSaveStory = () => {
    if (!stText.trim()) {
      showToast('একটু লিখুন');
      return;
    }
    const p = data.find((x) => x.id === selectedId);
    const newStory: Story = {
      id: Date.now(),
      petId: selectedId || undefined,
      title: stTitle || 'ফিরে পেলাম',
      text: stText.trim(),
      by: stBy.trim() || 'নাম দেননি',
      at: 'আজ',
      species: p ? p.species : 'dog',
      image: p?.images && p.images[0] ? p.images[0] : null,
      area: p ? p.area : 'রাজশাহী',
    };
    setStories((prev) => [newStory, ...prev]);
    closeDrawer();
    setPage('stories');
    showToast('গল্প প্রকাশিত — সাফল্যের গল্প ট্যাবে দেখুন');
  };

  // Save Sighting
  const handleSaveSighting = () => {
    if (!sightingPetId) return;
    setData((prev) =>
      prev.map((p) => {
        if (p.id === sightingPetId) {
          const sightings = p.sightings || [];
          return {
            ...p,
            sightings: [
              ...sightings,
              {
                lat: sPicked.lat,
                lng: sPicked.lng,
                date: sDate,
                area: sArea.trim() || 'ম্যাপে চিহ্নিত জায়গা',
                note: sNote.trim() || 'বিবরণ দেওয়া হয়নি',
              },
            ],
          };
        }
        return p;
      })
    );
    setDrawerMode('pet');
    showToast('ধন্যবাদ — পোস্টদাতাকে জানানো হয়েছে');
  };

  // Save Report
  const handleSaveReport = () => {
    if (!selectedId) return;
    setData((prev) =>
      prev.map((p) => {
        if (p.id === selectedId) {
          const reports = p.reports || [];
          return {
            ...p,
            reports: [...reports, { reason: rReason, detail: rDetail.trim(), at: Date.now() }],
          };
        }
        return p;
      })
    );
    setRDetail('');
    setDrawerMode('pet');
    showToast('রিপোর্ট পাঠানো হয়েছে — ধন্যবাদ');
  };

  // Save Adoption Application
  const handleSaveInterest = () => {
    if (!iName.trim() || !iPhone.trim()) {
      showToast('নাম ও ফোন নম্বর দিন');
      return;
    }
    if (!selectedId) return;
    setData((prev) =>
      prev.map((p) => {
        if (p.id === selectedId) {
          const interests = p.interests || [];
          return {
            ...p,
            interests: [
              ...interests,
              {
                name: iName.trim(),
                phone: iPhone.trim(),
                home: iHome,
                exp: iExp,
                msg: iMsg.trim(),
                at: 'এইমাত্র',
              },
            ],
          };
        }
        return p;
      })
    );
    setIName('');
    setIPhone('');
    setIMsg('');
    setDrawerMode('pet');
    showToast('আবেদন পাঠানো হয়েছে — পোস্টদাতা যোগাযোগ করবেন');
  };

  // Delete Post
  const handleDeletePost = (id: number) => {
    if (!confirm('পোস্টটি স্থায়ীভাবে মুছে ফেলবেন?')) return;
    setData((prev) => prev.filter((p) => p.id !== id));
    closeDrawer();
    showToast('পোস্ট মুছে ফেলা হয়েছে');
  };

  // Subscribe to filter
  const handleSubscribe = () => {
    setSubs((prev) => [...prev, { division, species, tab, at: Date.now() }]);
    showToast('সাবস্ক্রাইব করা হয়েছে — মিলে গেলে বেল আইকনে দেখাবে');
  };

  // WhatsApp Share
  const handleWaShare = (p: Pet) => {
    const txt = `${TYPE_CONFIG[p.type]?.bn}: ${p.name ? p.name + ' — ' : ''}${p.breed} ${SPECIES_BN[p.species]}, ${p.colors.join('/')}।\n${p.area}, ${agoText(p.date)}।\n${p.marks}\nPawtro: pawtro.com/p/${p.id}`;
    window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
  };

  // Text Share
  const handleTextShare = (p: Pet) => {
    const txt = `${TYPE_CONFIG[p.type]?.bn}: ${p.name ? p.name + ' — ' : ''}${p.breed} ${SPECIES_BN[p.species]}, ${p.colors.join('/')}। ${p.area}, ${agoText(p.date)}। Pawtro: pawtro.com/p/${p.id}`;
    if (navigator.share) {
      navigator.share({ title: 'Pawtro', text: txt }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(txt);
      showToast('লেখা কপি হয়েছে — ফেসবুকে পেস্ট করুন');
    } else {
      showToast('শেয়ার করা যায়নি');
    }
  };

  // A4 Poster Generation Popout Window
  const handleMakePoster = (p: Pet) => {
    const head = p.type === 'lost' ? 'হারিয়ে গেছে' : p.type === 'found' ? 'এই পোষ্যটি পাওয়া গেছে' : 'দত্তক দেওয়া হবে';
    const imgTag =
      p.images && p.images.length
        ? `<img src="${p.images[0]}" alt="">`
        : `<div class="ph"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="width:120px;height:120px;opacity:.35;color:#3B4642"><path d="M12 14c0-4 1-6 2-6s4 3 6 4"/><path d="M36 14c0-4-1-6-2-6s-4 3-6 4"/><path d="M12 14c0 3-1 5-1 9 0 8 6 13 13 13s13-5 13-13c0-4-1-6-1-9"/><circle cx="19" cy="24" r="1.6" fill="currentColor" stroke="none"/><circle cx="29" cy="24" r="1.6" fill="currentColor" stroke="none"/><ellipse cx="24" cy="29" rx="2.6" ry="1.8" fill="currentColor" stroke="none"/><path d="M21 33c1 1.2 5 1.2 6 0"/></svg></div>`;

    const w = window.open('', '_blank', 'width=800,height=1000');
    if (!w) {
      showToast('পপ-আপ ব্লক করা আছে — অনুমতি দিন');
      return;
    }
    w.document.write(`<!DOCTYPE html><html lang="bn"><head><meta charset="utf-8">
  <title>Pawtro পোস্টার — ${p.name || p.breed}</title>
  <link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;600;700;800&family=Inter:wght@500;600&display=swap" rel="stylesheet">
  <style>
    @page{size:A4;margin:12mm}
    body{margin:0;font-family:'Anek Bangla',sans-serif;color:#111614;background:#F0F1EF}
    .sheet{width:186mm;min-height:262mm;margin:12px auto;background:#fff;padding:16mm 14mm;box-sizing:border-box;
      border:1px solid #ddd;display:flex;flex-direction:column}
    .kicker{font-size:13pt;letter-spacing:.22em;text-transform:uppercase;font-family:'Inter',sans-serif;
      font-weight:600;color:${p.type === 'lost' ? '#9E3B36' : p.type === 'found' ? '#1D6B5F' : '#46577F'}}
    h1{font-size:44pt;line-height:1;margin:6px 0 0;font-weight:800;letter-spacing:-.03em}
    .sub{font-size:15pt;margin-top:8px;color:#4F5A55}
    .imgbox{margin:16px 0;height:88mm;border:1.5px solid #111614;overflow:hidden;display:grid;place-items:center;background:#F2EDE6}
    .imgbox img{width:100%;height:100%;object-fit:cover}
    .ph svg{width:120px;height:120px;opacity:.35;color:#3B4642}
    table{width:100%;border-collapse:collapse;font-size:12.5pt}
    td{padding:6px 0;border-bottom:1px solid #E1E5E2;vertical-align:top}
    td.k{width:34%;color:#8A948F;font-family:'Inter',sans-serif;font-size:10.5pt;letter-spacing:.04em;text-transform:uppercase;font-weight:600}
    .desc{font-size:13pt;margin:14px 0;line-height:1.5}
    .contact{margin-top:auto;border-top:3px solid #111614;padding-top:12px;display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
    .contact b{font-size:22pt;letter-spacing:-.02em;display:block}
    .contact span{font-size:11pt;color:#4F5A55}
    .tear{margin-top:12px;border-top:1px dashed #8A948F;padding-top:8px;display:flex;gap:6px}
    .tear div{flex:1;font-family:'Inter',sans-serif;font-size:8pt;text-align:center;color:#4F5A55;
      border-left:1px dashed #CDD4D0;padding:6px 2px;line-height:1.35}
    .tear div:first-child{border-left:0}
    .bar{position:fixed;top:0;left:0;right:0;background:#111614;color:#fff;padding:10px;text-align:center;font-size:11pt}
    .bar button{font:inherit;background:#fff;color:#111614;border:0;padding:6px 14px;border-radius:5px;margin-left:10px;cursor:pointer}
    @media print{.bar{display:none}body{background:#fff}.sheet{border:0;margin:0;width:auto;padding:0}}
  </style></head><body>
  <div class="bar">A4 পোস্টার প্রস্তুত
    <button onclick="dl('pdf')">PDF ডাউনলোড</button>
    <button onclick="dl('png')">ছবি (PNG)</button>
    <button onclick="window.print()">প্রিন্ট</button>
    <span id="st" style="margin-left:10px;opacity:.8"></span></div>
  <div class="sheet" style="margin-top:60px">
    <div class="kicker">Pawtro · ${p.area}</div>
    <h1>${head}</h1>
    <div class="sub">${p.name ? p.name + ' — ' : ''}${p.breed} ${SPECIES_BN[p.species]} · ${p.colors.join(', ')}</div>
    <div class="imgbox">${imgTag}</div>
    <table>
      <tr><td class="k">বিশেষ চিহ্ন</td><td>${p.marks}</td></tr>
      <tr><td class="k">লিঙ্গ ও বয়স</td><td>${p.sex} · ${p.age}</td></tr>
      <tr><td class="k">${p.type === 'found' ? 'যেখানে পাওয়া গেছে' : 'যেখানে শেষ দেখা গেছে'}</td><td>${p.area}</td></tr>
      <tr><td class="k">তারিখ</td><td>${new Date(p.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
    </table>
    <p class="desc">${p.desc}</p>
    <div class="contact">
      <div><span>দেখলে বা খোঁজ পেলে জানান</span><b>০১XXX-XXXXXX</b></div>
      <div style="text-align:right;display:flex;align-items:center;gap:12px">
        <div><span>ছবি ও আপডেট</span><b style="font-size:13pt">pawtro.com/p/${p.id}</b>
          <span style="display:block;font-size:9pt">QR স্ক্যান করুন</span></div>
        <div id="qr"></div>
      </div>
    </div>
    <div class="tear">${Array.from({ length: 8 })
      .map(() => `<div>Pawtro<br>pawtro.com/p/${p.id}<br>০১XXX-XXXXXX</div>`)
      .join('')}</div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
  <script>
  const FILE = 'pawtro-poster-${p.id}';
  try{ new QRCode(document.getElementById('qr'),
    {text:'https://pawtro.com/p/${p.id}', width:88, height:88, correctLevel:QRCode.CorrectLevel.H}); }
  catch(err){ document.getElementById('qr').style.display='none'; }
  async function dl(kind){
    const st=document.getElementById('st'); st.textContent='তৈরি হচ্ছে…';
    try{
      await document.fonts.ready;
      const canvas = await html2canvas(document.querySelector('.sheet'),
        {scale:2, backgroundColor:'#ffffff', useCORS:true});
      if(kind==='png'){
        const a=document.createElement('a');
        a.download=FILE+'.png'; a.href=canvas.toDataURL('image/png'); a.click();
      }else{
        const {jsPDF}=window.jspdf;
        const pdf=new jsPDF({unit:'mm',format:'a4',orientation:'portrait'});
        const W=210,H=297, iw=W-12, ih=canvas.height*iw/canvas.width;
        pdf.addImage(canvas.toDataURL('image/jpeg',0.94),'JPEG',6,6,iw,Math.min(ih,H-12));
        pdf.save(FILE+'.pdf');
      }
      st.textContent='ডাউনলোড হয়েছে';
    }catch(e){ st.textContent='সমস্যা হয়েছে — প্রিন্ট থেকে "Save as PDF" ব্যবহার করুন'; }
    setTimeout(()=>st.textContent='',4000);
  }
  <\/script>
  </body></html>`);
    w.document.close();
  };

  const selectedPet = useMemo(() => {
    return data.find((x) => x.id === selectedId) || null;
  }, [data, selectedId]);

  const selectedPetMatches = useMemo(() => {
    return selectedPet ? getMatchesFor(selectedPet) : [];
  }, [selectedPet, getMatchesFor]);

  const nearestClinicForSelected = useMemo(() => {
    if (!selectedPet || selectedPet.type === 'adopt' || selectedPet.resolved) return null;
    return [...CLINICS].sort((a, b) => km(selectedPet, a) - km(selectedPet, b))[0];
  }, [selectedPet]);

  // Counts
  const nearCount = useMemo(() => {
    const c = currentCenter;
    return data.filter((p) => (division === 'all' ? km(c, p) <= radius : p.division === division));
  }, [data, currentCenter, division, radius]);

  return (
    <div>
      {/* ---------- HEADER ---------- */}
      <header>
        <div className="bar">
          <div className="logo cursor-pointer" onClick={() => setPage('board')}>
            <div className="mark">{Icons.paw}</div>
            <b>Pawtro</b>
          </div>
          <nav id="tabs">
            <button
              className="navlink"
              data-page="board"
              aria-current={page === 'board'}
              onClick={() => {
                setPage('board');
                setTimeout(() => mapInstanceRef.current?.invalidateSize(), 60);
              }}
            >
              বোর্ড
            </button>
            <button className="navlink" data-page="stories" aria-current={page === 'stories'} onClick={() => setPage('stories')}>
              সাফল্যের গল্প
            </button>
            <button className="navlink" data-page="help" aria-current={page === 'help'} onClick={() => setPage('help')}>
              সহায়তা কেন্দ্র
            </button>
          </nav>
          <div className="search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input type="search" id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="জাত, রঙ বা এলাকা" />
          </div>
          <button className="themebtn" id="themeBtn" aria-label="থিম বদলান" title="থিম বদলান" onClick={toggleTheme}>
            <svg className="sun" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            <svg className="moon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          </button>
          <button
            className="bell"
            id="bellBtn"
            aria-label="নোটিফিকেশন"
            onClick={() => {
              setDrawerMode('notifs');
              setReadNotifs((prev) => [...prev, ...notifications.map((p) => p.id)]);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
              <path d="M10.5 20a2 2 0 0 0 3 0" />
            </svg>
            {notifications.length > 0 && <b id="bellCount">{bn(notifications.length)}</b>}
          </button>
          <button
            className="btn ghost sm mobonly"
            id="mapToggle"
            onClick={() => {
              document.body.classList.toggle('mapview');
              setTimeout(() => mapInstanceRef.current?.invalidateSize(), 40);
            }}
          >
            ম্যাপ
          </button>
          <button
            className="btn"
            id="newBtn"
            onClick={() => {
              setPostModalType('lost');
              setIsPostModalOpen(true);
            }}
          >
            পোস্ট করুন
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(profile?.role === 'admin' || profile?.role === 'superadmin') && (
                <Link
                  href="/admin"
                  className="btn ghost sm"
                  title="অ্যাডমিন প্যানেল"
                  style={{ color: '#1D6B5F', borderColor: '#1D6B5F', fontWeight: 700 }}
                >
                  <span>🛡️ অ্যাডমিন</span>
                </Link>
              )}
              <Link
                href="/dashboard"
                className="btn ghost sm"
                title="ড্যাশবোর্ড ও প্রোফাইল"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName || 'Profile'}
                    style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
                <span>{profile?.displayName?.split(' ')[0] || 'ড্যাশবোর্ড'}</span>
              </Link>
              <button
                onClick={() => signOut()}
                title="লগআউট করুন"
                className="btn ghost sm"
                style={{ padding: '6px 9px', color: 'var(--ink-3)' }}
                aria-label="লগআউট"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn ghost sm"
              title="লগইন বা সাইনআপ করুন"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>লগইন / সাইনআপ</span>
            </Link>
          )}
        </div>
      </header>

      {/* ---------- PAGE: BOARD ---------- */}
      <div className={`page ${page === 'board' ? 'on' : ''}`} id="pgBoard">
        <section className="hsec">
          <svg className="radar" viewBox="0 0 820 820" aria-hidden="true">
            <circle cx="410" cy="410" r="120" className="hot" />
            <circle cx="410" cy="410" r="200" />
            <circle cx="410" cy="410" r="285" />
            <circle cx="410" cy="410" r="370" />
            <circle cx="410" cy="410" r="405" />
          </svg>
          <div className="hwrap">
            <div>
              <h1>
                আপনার পোষা প্রাণীটি হারিয়ে গেলে খুঁজতে শুরু করুন <em>Pawtro</em> থেকে
              </h1>
              <p className="lead">
                আপনার এলাকার হারানো ও কুড়িয়ে পাওয়া পোষ্যের পোস্ট এক জায়গায়। ছবি, দূরত্ব আর সময় মিলিয়ে Pawtro নিজে থেকেই সম্ভাব্য মিল খুঁজে বের করে — আপনাকে শুধু যাচাই করতে হয়।
              </p>
              <div className="hactions">
                <button
                  className="bigbtn pri"
                  onClick={() => {
                    setPostModalType('lost');
                    setIsPostModalOpen(true);
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.4" />
                  </svg>
                  আমার পোষ্য হারিয়েছে
                </button>
                <button
                  className="bigbtn sec"
                  onClick={() => {
                    setPostModalType('found');
                    setIsPostModalOpen(true);
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  একটি পোষ্য পেয়েছি
                </button>
                <button
                  className="bigbtn sec"
                  onClick={() => {
                    setPostModalType('adoption');
                    setIsPostModalOpen(true);
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  দত্তক দিতে চাই
                </button>
                <button
                  className="bigbtn sec"
                  onClick={() => {
                    setTab('adopt');
                    document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  দত্তক নিতে চাই
                </button>
              </div>
              <div className="hstats">
                <div>
                  <b className="num" id="sActive">
                    {bn(data.filter((p) => !p.resolved).length)}
                  </b>
                  <span>সক্রিয় পোস্ট</span>
                </div>
                <div>
                  <b className="num">১২</b>
                  <span>এই মাসে ফিরেছে</span>
                </div>
                <div>
                  <b className="num">৪৮</b>
                  <span>ঘণ্টায় গড় মিল</span>
                </div>
              </div>
            </div>

            <div className="hcard">
              <div className="hcard-top">
                <span className="t">সম্ভাব্য মিল পাওয়া গেছে</span>
                <span className="s">২ ঘণ্টা আগে</span>
              </div>
              <div className="pair">
                <div className="pcell">
                  <div className="box" style={{ background: '#F2EDE6' }}>
                    {Icons.dog}
                  </div>
                  <div className="lb">হারিয়েছে</div>
                  <div className="nm">বাদশা</div>
                  <div className="pl">উপশহর · ৫ দিন আগে</div>
                </div>
                <div className="joint">
                  <b className="num">৮৭</b>
                  <span>মিল</span>
                </div>
                <div className="pcell">
                  <div className="box" style={{ background: '#F2EDE6' }}>
                    {Icons.dog}
                  </div>
                  <div className="lb">পাওয়া গেছে</div>
                  <div className="nm">নাম অজানা</div>
                  <div className="pl">সাহেব বাজার · ৩ দিন আগে</div>
                </div>
              </div>
              <div className="meter">
                <i style={{ width: '52%', background: '#1D6B5F' }} />
                <i style={{ width: '24%', background: '#5E9084' }} />
                <i style={{ width: '15%', background: '#A99150' }} />
                <i style={{ width: '9%', background: '#B9C2BD' }} />
              </div>
              <div className="legend">
                <span>
                  <i style={{ background: '#1D6B5F' }} />
                  ছবির মিল<em>৯১%</em>
                </span>
                <span>
                  <i style={{ background: '#5E9084' }} />
                  দূরত্ব<em>১.৬ কিমি</em>
                </span>
                <span>
                  <i style={{ background: '#A99150' }} />
                  রঙ ও জাত<em>১০০%</em>
                </span>
                <span>
                  <i style={{ background: '#B9C2BD' }} />
                  সময়<em>৯৩%</em>
                </span>
              </div>
              <div className="hcard-foot">স্কোর কেবল সম্ভাবনা দেখায়। শেষ সিদ্ধান্ত সবসময় মানুষের।</div>
            </div>
          </div>
        </section>

        <section className="how">
          <div className="howwrap">
            <div className="step">
              <div className="n">ধাপ ১</div>
              <h3>পোস্ট করুন</h3>
              <p>ছবি, রঙ, বিশেষ চিহ্ন আর ম্যাপে জায়গা — দুই মিনিটের কাজ।</p>
            </div>
            <div className="step">
              <div className="n">ধাপ ২</div>
              <h3>মিল দেখুন</h3>
              <p>আশপাশের পোস্টের সাথে মিলিয়ে সম্ভাব্য তালিকা নিজে থেকেই আসে।</p>
            </div>
            <div className="step">
              <div className="n">ধাপ ৩</div>
              <h3>যোগাযোগ করুন</h3>
              <p>ফোন নম্বর প্রকাশ না করেই মেসেজে কথা বলুন, তারপর দেখা করুন।</p>
            </div>
          </div>
        </section>

        <div className="secbar">
          <div>
            <h2>আশপাশের পোস্ট</h2>
            <p>দূরত্ব ও ধরন বেছে নিয়ে খুঁজুন, অথবা ম্যাপে দেখুন।</p>
          </div>
        </div>

        <div className="shell" id="browse">
          <aside className="rail">
            <div className="group">
              <span className="lbl">অবস্থা</span>
              <div className="opts" id="fStatus">
                <button className="opt" aria-pressed={tab === 'all'} onClick={() => setTab('all')}>
                  <span>সব</span>
                  <span className="n">{bn(nearCount.length)}</span>
                </button>
                <button className="opt" aria-pressed={tab === 'lost'} onClick={() => setTab('lost')}>
                  <span>
                    <i className="swatch" style={{ background: 'var(--lost)' }} />
                    হারিয়েছে
                  </span>
                  <span className="n">{bn(nearCount.filter((p) => p.type === 'lost').length)}</span>
                </button>
                <button className="opt" aria-pressed={tab === 'found'} onClick={() => setTab('found')}>
                  <span>
                    <i className="swatch" style={{ background: 'var(--found)' }} />
                    পাওয়া গেছে
                  </span>
                  <span className="n">{bn(nearCount.filter((p) => p.type === 'found').length)}</span>
                </button>
                <button className="opt" aria-pressed={tab === 'adopt'} onClick={() => setTab('adopt')}>
                  <span>
                    <i className="swatch" style={{ background: 'var(--adopt)' }} />
                    দত্তক
                  </span>
                  <span className="n">{bn(nearCount.filter((p) => p.type === 'adopt').length)}</span>
                </button>
              </div>
            </div>

            <div className="group">
              <span className="lbl">প্রাণী</span>
              <div className="opts" id="fSpecies">
                <button className="opt" aria-pressed={species === 'all'} onClick={() => setSpecies('all')}>
                  <span>সব</span>
                </button>
                <button className="opt" aria-pressed={species === 'dog'} onClick={() => setSpecies('dog')}>
                  <span>কুকুর</span>
                  <span className="n">{bn(nearCount.filter((p) => (tab === 'all' || p.type === tab) && p.species === 'dog').length)}</span>
                </button>
                <button className="opt" aria-pressed={species === 'cat'} onClick={() => setSpecies('cat')}>
                  <span>বিড়াল</span>
                  <span className="n">{bn(nearCount.filter((p) => (tab === 'all' || p.type === tab) && p.species === 'cat').length)}</span>
                </button>
                <button className="opt" aria-pressed={species === 'bird'} onClick={() => setSpecies('bird')}>
                  <span>পাখি</span>
                  <span className="n">{bn(nearCount.filter((p) => (tab === 'all' || p.type === tab) && p.species === 'bird').length)}</span>
                </button>
                <button className="opt" aria-pressed={species === 'other'} onClick={() => setSpecies('other')}>
                  <span>অন্যান্য</span>
                  <span className="n">{bn(nearCount.filter((p) => (tab === 'all' || p.type === tab) && p.species === 'other').length)}</span>
                </button>
              </div>
            </div>

            <div className="group">
              <span className="lbl">বিভাগ</span>
              <select
                id="fDiv"
                value={division}
                onChange={(e) => {
                  setDivision(e.target.value);
                  const c = e.target.value === 'all' ? HOME : DIVCENTER[e.target.value] || HOME;
                  mapInstanceRef.current?.flyTo([c.lat, c.lng], e.target.value === 'all' ? 13 : 12, { duration: 0.7 });
                }}
              >
                <option value="all">সব বিভাগ</option>
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="group" id="radGroup" style={{ opacity: division === 'all' ? 1 : 0.4 }}>
              <span className="lbl">দূরত্ব</span>
              <input type="range" id="rad" min="1" max="60" value={radius} onChange={(e) => setRadius(+e.target.value)} />
              <div className="rngrow">
                <span>১ কিমি</span>
                <span id="radVal">{bn(radius)} কিমি</span>
              </div>
            </div>

            <div className="group">
              <button
                className="opt"
                id="mineBtn"
                aria-pressed={mineOnly}
                style={{ border: '1px solid var(--line)', width: '100%' }}
                onClick={() => setMineOnly((prev) => !prev)}
              >
                <span>শুধু আমার পোস্ট</span>
                <span className="n" id="mineN">
                  {bn(data.filter((p) => p.mine).length)}
                </span>
              </button>
            </div>

            <div className="group">
              <button className="btn ghost sm block" id="subBtn" style={{ marginBottom: '7px' }} onClick={handleSubscribe}>
                এই ফিল্টারে নতুন এলে জানান
              </button>
              <button
                className="btn ghost sm block"
                id="resetBtn"
                onClick={() => {
                  setTab('all');
                  setSpecies('all');
                  setDivision('all');
                  setRadius(25);
                  setQ('');
                  setMineOnly(false);
                  setSelectedId(null);
                  mapInstanceRef.current?.flyTo([HOME.lat, HOME.lng], 13);
                }}
              >
                ফিল্টার মুছুন
              </button>
            </div>
          </aside>

          <section className="feedwrap">
            <div className="feedhead">
              <div>
                <h1 id="feedTitle">{tab === 'all' ? 'সব পোস্ট' : TYPE_CONFIG[tab as PetType]?.bn}</h1>
                <div className="sub" id="feedSub">
                  {bn(visiblePets.length)} টি ফলাফল · {bn(radius)} কিমির মধ্যে · {division === 'all' ? 'রাজশাহী' : division}
                </div>
              </div>
            </div>
            <div className="feed" id="feed">
              {visiblePets.length ? (
                visiblePets.map((p) => {
                  const t = TYPE_CONFIG[p.type];
                  const ms = getMatchesFor(p);
                  const isSelected = selectedId === p.id;
                  const photoC = p.images && p.images.length ? p.images.length : p.photos || 1;
                  return (
                    <article
                      key={p.id}
                      className={`card ${p.resolved ? 'resolved' : ''} ${isSelected ? 'on' : ''}`}
                      data-id={p.id}
                      tabIndex={0}
                      onClick={() => openPet(p.id)}
                    >
                      <div className="thumb" style={{ background: TINT[p.species], color: '#3B4642' }}>
                        {p.images && p.images.length ? <img src={p.images[0]} alt="" /> : Icons[p.species]}
                        <span className="pcount">{bn(photoC)}</span>
                      </div>
                      <div className="cbody">
                        <div className="row1">
                          <span className={`badge ${p.resolved ? 'b-done' : 'b-' + t.cls}`}>{p.resolved ? 'বন্ধ' : t.bn}</span>
                          <h3>
                            {p.name ? p.name + ' · ' : ''}
                            {p.breed} {SPECIES_BN[p.species]}
                          </h3>
                          {p.org && (
                            <span className="orgbadge">
                              {Icons.verified}
                              ভেরিফায়েড
                            </span>
                          )}
                        </div>
                        <div className="metaline">
                          <span>{p.area}</span>
                          <i>·</i>
                          <span>{agoText(p.date)}</span>
                          <i>·</i>
                          <span className="num">{bn(km(currentCenter, p).toFixed(1))} কিমি</span>
                        </div>
                        <p className="desc">{p.desc}</p>
                        <div className="tags">
                          {p.colors.map((c) => (
                            <span key={c} className="tag">
                              {c}
                            </span>
                          ))}
                          <span className="tag">{p.sex}</span>
                          <span className="tag">{p.age}</span>
                        </div>
                        {(p.reports || []).length >= 3 && (
                          <div className="flagstrip">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M12 8v5M12 17h.01" />
                              <circle cx="12" cy="12" r="9" />
                            </svg>
                            একাধিকবার রিপোর্ট হয়েছে — যাচাই করে নিন
                          </div>
                        )}
                        {ms.length > 0 && (
                          <div className="cue">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                            <span className="num">{bn(ms.length)}</span>টি সম্ভাব্য মিল · সর্বোচ্চ <span className="num">{bn(Math.round(ms[0].total * 100))}%</span>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty">
                  <svg width="48" height="48" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.25, marginBottom: '12px' }}>
                    <ellipse cx="8" cy="12" rx="3.2" ry="4.2" fill="currentColor" />
                    <ellipse cx="14.5" cy="8.5" rx="3" ry="4" fill="currentColor" />
                    <ellipse cx="21" cy="8.5" rx="3" ry="4" fill="currentColor" />
                    <ellipse cx="27" cy="12" rx="3.2" ry="4.2" fill="currentColor" />
                    <path d="M7 19.5c0-5 3.5-8.5 9-8.5s9 3.5 9 8.5c0 3.5-2 5.5-4.5 6.5-1.5.6-3 .5-4.5 0C13.5 24.5 7 23 7 19.5Z" fill="currentColor" />
                  </svg>
                  <h3>{data.length === 0 ? 'এখনো কোনো পোস্ট নেই' : 'এই ফিল্টারে কোনো পোস্ট নেই'}</h3>
                  <p>{data.length === 0
                    ? 'প্রথম হারানো বা পাওয়া পোষ্যের খবর দিন — পুরো এলাকা জানতে পারবে।'
                    : 'দূরত্ব বাড়িয়ে দেখুন, অথবা নতুন একটি পোস্ট দিয়ে খোঁজ শুরু করুন।'
                  }</p>
                  <button className="btn" onClick={() => { setIsPostModalOpen(true); setPostModalType('lost'); }}>
                    প্রথম পোস্ট করুন
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="mappane">
            <div id="map" ref={mapContainerRef} />
            {data.length === 0 && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                bottom: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                pointerEvents: 'none',
              }}>
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '20px 28px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-md)',
                  maxWidth: '240px',
                }}>
                  <svg width="36" height="36" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.3, display: 'block', margin: '0 auto 10px' }}>
                    <ellipse cx="8" cy="12" rx="3.2" ry="4.2" fill="currentColor" />
                    <ellipse cx="14.5" cy="8.5" rx="3" ry="4" fill="currentColor" />
                    <ellipse cx="21" cy="8.5" rx="3" ry="4" fill="currentColor" />
                    <ellipse cx="27" cy="12" rx="3.2" ry="4.2" fill="currentColor" />
                    <path d="M7 19.5c0-5 3.5-8.5 9-8.5s9 3.5 9 8.5c0 3.5-2 5.5-4.5 6.5-1.5.6-3 .5-4.5 0C13.5 24.5 7 23 7 19.5Z" fill="currentColor" />
                  </svg>
                  <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                    ম্যাপে কোনো পোস্ট নেই
                  </p>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-3)', lineHeight: 1.55 }}>
                    প্রথম পোস্ট হলেই এখানে মার্কার দেখাবে
                  </p>
                </div>
              </div>
            )}
            <div className="maplegend">
              <span className="key">
                <i className="dot" style={{ background: 'var(--lost)' }} />
                হারিয়েছে
              </span>
              <span className="key">
                <i className="dot" style={{ background: 'var(--found)' }} />
                পাওয়া গেছে
              </span>
              <span className="key">
                <i className="dot" style={{ background: 'var(--adopt)' }} />
                দত্তক
              </span>
              <span style={{ marginLeft: 'auto' }} id="radiusNote">
                {bn(radius)} কিমি ব্যাসার্ধ
              </span>
            </div>
          </section>
        </div>
      </div>

      {/* ---------- PAGE: STORIES ---------- */}
      <div className={`page ${page === 'stories' ? 'on' : ''}`} id="pgStories">
        <div className="wrap">
          <div style={{ maxWidth: '720px' }}>
            <h2 style={{ fontSize: '26px', letterSpacing: '-.02em' }}>সাফল্যের গল্প</h2>
            <p style={{ color: 'var(--ink-2)', margin: '6px 0 0' }}>
              যে পোস্টগুলো সমাধান হয়েছে। কেউ ফিরে পেলে বা নতুন বাসা পেলে গল্পটা লিখে রাখুন — নতুন কেউ এসে দেখলে আশা পায়, আর সাইটে আস্থাও তৈরি হয়।
            </p>
          </div>
          <div className="storygrid" id="storyGrid" style={{ marginTop: '20px' }}>
            {stories.length ? (
              stories.map((st) => (
                <article key={st.id} className="story">
                  <div className="simg" style={{ background: TINT[st.species] }}>
                    {st.image ? <img src={st.image} alt="" /> : Icons[st.species]}
                  </div>
                  <div className="sbody">
                    <h3>{st.title}</h3>
                    <p>{st.text}</p>
                    <div className="sfoot">
                      <span>{st.by}</span>
                      <span>
                        {st.area} · {st.at}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty" style={{ gridColumn: '1/-1' }}>
                <h3>এখনো কোনো গল্প নেই</h3>
                <p>কোনো পোস্ট "সমাধান হয়েছে" মার্ক করলে গল্প যোগ করার সুযোগ আসবে।</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------- PAGE: HELP CENTRE ---------- */}
      <div className={`page ${page === 'help' ? 'on' : ''}`} id="pgHelp">
        <div className="wrap">
          <div style={{ maxWidth: '720px' }}>
            <h2 style={{ fontSize: '26px', letterSpacing: '-.02em' }}>সহায়তা কেন্দ্র</h2>
            <p style={{ color: 'var(--ink-2)', margin: '6px 0 0' }}>
              পোষ্য হারালে বা আহত কোনো প্রাণী পেলে প্রথম কয়েক ঘণ্টাই সবচেয়ে গুরুত্বপূর্ণ। নিচের ধাপগুলো কাজে লাগবে।
            </p>
          </div>
          <div className="helpgrid">
            <div className="hcell">
              <div className="ic">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </div>
              <h3>প্রথম ২৪ ঘণ্টা</h3>
              <ul>
                <li>হারানোর জায়গার ৫০০ মিটারের মধ্যে বারবার খুঁজুন — বেশিরভাগ পোষ্য কাছেই লুকিয়ে থাকে</li>
                <li>বিড়াল হলে ভোরে বা রাতে, চুপচাপ ডাকুন</li>
                <li>ব্যবহৃত বিছানা বা খাবারের পাত্র বাইরে রাখুন — গন্ধ চিনে ফেরে</li>
                <li>আশপাশের দোকানদার, রিকশাচালক ও দারোয়ানকে জানান</li>
              </ul>
            </div>
            <div className="hcell">
              <div className="ic">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.4" />
                </svg>
              </div>
              <h3>কোথায় খবর দেবেন</h3>
              <ul>
                <li>স্থানীয় পশু উদ্ধারকারী স্বেচ্ছাসেবী গ্রুপ (ফেসবুকে এলাকার নাম দিয়ে খুঁজুন)</li>
                <li>নিকটস্থ ভেটেরিনারি ক্লিনিক — আহত প্রাণী প্রায়ই সেখানে যায়</li>
                <li>উপজেলা প্রাণিসম্পদ দপ্তর</li>
                <li>এখানে পোস্ট করুন, যেন কেউ পেলে মিলিয়ে দেখতে পারে</li>
              </ul>
            </div>
            <div className="hcell">
              <div className="ic">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3l8 4v5c0 5-3.4 8.3-8 9-4.6-.7-8-4-8-9V7z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3>প্রতারণা চিনুন</h3>
              <ul>
                <li>ছবি না দেখিয়ে "টাকা দিলে ফেরত দেব" — প্রতারণা</li>
                <li>কুরিয়ার বা পরিবহন খরচ অগ্রিম চাওয়া — প্রতারণা</li>
                <li>বিকাশ/নগদে অগ্রিম কখনো নয়; সরাসরি দেখা করে হাতে হাতে</li>
                <li>প্রকাশ্য জায়গায়, সম্ভব হলে কাউকে সাথে নিয়ে দেখা করুন</li>
              </ul>
            </div>
            <div className="hcell">
              <div className="ic">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19V6a2 2 0 0 1 2-2h9l5 5v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                  <path d="M8 12h8M8 16h5" />
                </svg>
              </div>
              <h3>পোষ্য পেলে কী করবেন</h3>
              <ul>
                <li>গলার বেল্ট, ট্যাগ বা মাইক্রোচিপ আছে কিনা দেখুন — ভেট চিপ পড়তে পারে</li>
                <li>খাবার ও পানি দিন, জোর করে ধরবেন না</li>
                <li>স্পষ্ট ছবি তুলে "পাওয়া গেছে" পোস্ট দিন</li>
                <li>সব বিশেষ চিহ্ন প্রকাশ করবেন না — একটি গোপন রাখলে আসল মালিক যাচাই করা যায়</li>
              </ul>
            </div>
          </div>

          <div className="secbar" style={{ padding: '34px 0 0', maxWidth: '720px', margin: 0 }}>
            <div>
              <h2 style={{ fontSize: '19px' }}>কাছের ভেট ক্লিনিক</h2>
              <p style={{ fontSize: '13px' }}>রাজশাহীর যাচাই করা ক্লিনিক, দূরত্ব অনুযায়ী সাজানো।</p>
            </div>
          </div>
          <div className="panel" style={{ maxWidth: '720px', padding: '4px 14px', marginTop: '12px' }} id="clinicList">
            {CLINICS.map((v, i) => {
              const dist = km(currentCenter, v);
              return (
                <div key={v.name} className="clinic">
                  <div className="cnum num">{bn(i + 1)}</div>
                  <div className="cw">
                    <div className="ch2">
                      <b>{v.name}</b>
                      <span className="cdist num">{bn(dist.toFixed(1))} কিমি</span>
                    </div>
                    <p className="caddr">{v.address}</p>
                    <div className="cmeta">
                      <span>{v.hours}</span>
                      {v.rating && <span>রেটিং {bn(v.rating.toFixed(1))}/৫</span>}
                      {v.phone && <a href={`tel:${v.phone}`}>কল করুন</a>}
                      <a href={`https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`} target="_blank" rel="noopener noreferrer">
                        ম্যাপে দেখুন
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="secbar" style={{ padding: '30px 0 0', maxWidth: '720px', margin: 0 }}>
            <div>
              <h2 style={{ fontSize: '19px' }}>ভেরিফায়েড রেসকিউ টিম</h2>
              <p style={{ fontSize: '13px' }}>যাচাই করা উদ্ধারকারী সংস্থা — জরুরি অবস্থায় সরাসরি যোগাযোগ করতে পারেন।</p>
            </div>
          </div>
          <div className="verinote" style={{ maxWidth: '720px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <div>
              <b>ভেরিফায়েড</b> মানে সংস্থার নিবন্ধন ও যোগাযোগ তথ্য যাচাই করা হয়েছে। ব্যাজ দেখেও দেখা করার সময় সাধারণ সতর্কতা মেনে চলুন।
            </div>
          </div>
          <div style={{ maxWidth: '720px' }} id="rescueList">
            {RESCUE_TEAMS.map((r) => (
              <div key={r.name} className="rteam">
                <div className="rh">
                  <div>
                    <b>{r.name}</b>
                    <div className="rarea">{r.area}</div>
                  </div>
                  {r.verified && (
                    <span className="orgbadge">
                      {Icons.verified}
                      ভেরিফায়েড
                    </span>
                  )}
                </div>
                <p>{r.desc}</p>
                <div className="cmeta">
                  <a href={`tel:${r.phone}`}>কল করুন</a>
                  <a href={`https://wa.me/${r.phone.replace('+', '')}`} target="_blank" rel="noopener noreferrer">
                    হোয়াটসঅ্যাপ
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="note" style={{ maxWidth: '720px', marginTop: '18px' }}>
            ক্লিনিক ও সংস্থার তালিকা যাচাই করে রাখা হয়েছে, তবে সময়ের সাথে ঠিকানা/নম্বর বদলাতে পারে। লাইভ সাইটে সংস্থাগুলো নিজেরাই অ্যাকাউন্ট খুলে তথ্য হালনাগাদ রাখতে পারবে।
          </div>
        </div>
      </div>

      {/* ---------- SCRIM & SLIDE-OVER SHEET ---------- */}
      <div className={`scrim ${drawerMode ? 'open' : ''}`} id="scrim" onClick={closeDrawer} />
      <aside className={`sheet ${drawerMode ? 'open' : ''}`} id="sheet" aria-hidden={!drawerMode}>
        <div id="sheetIn">
          {/* PET DETAIL DRAWER */}
          {drawerMode === 'pet' && selectedPet && (
            <div>
              <div className="sheethead">
                <span className={`badge ${selectedPet.resolved ? 'b-done' : 'b-' + TYPE_CONFIG[selectedPet.type].cls}`}>
                  {selectedPet.resolved ? 'বন্ধ' : TYPE_CONFIG[selectedPet.type].bn}
                </span>
                <h2>
                  {selectedPet.name ? selectedPet.name + ' · ' : ''}
                  {selectedPet.breed} {SPECIES_BN[selectedPet.species]}
                </h2>
                <button className="x" onClick={closeDrawer} aria-label="বন্ধ করুন">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M5 5l14 14M19 5L5 19" />
                  </svg>
                </button>
              </div>
              <div className="sheetbody">
                <div className="hero" style={{ background: TINT[selectedPet.species], color: '#3B4642', overflow: 'hidden' }}>
                  {selectedPet.images && selectedPet.images.length ? <img src={selectedPet.images[0]} alt="" /> : Icons[selectedPet.species]}
                  <span className="pcount">{bn(selectedPet.images && selectedPet.images.length ? selectedPet.images.length : selectedPet.photos || 1)} টি ছবি</span>
                </div>
                {selectedPet.org && (
                  <div className="meta" style={{ margin: '-8px 0 14px' }}>
                    <span className="orgbadge">
                      {Icons.verified}
                      ভেরিফায়েড
                    </span>{' '}
                    {selectedPet.org} পোস্ট করেছে
                  </div>
                )}
                {nearestClinicForSelected && (
                  <div className="clinic" style={{ marginBottom: '14px', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '10px 12px' }}>
                    <div className="cnum" style={{ background: 'transparent', border: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
                        <circle cx="12" cy="10" r="2.4" />
                      </svg>
                    </div>
                    <div className="cw">
                      <div className="ch2">
                        <b style={{ fontSize: '13px' }}>নিকটতম ভেট ক্লিনিক: {nearestClinicForSelected.name}</b>
                        <span className="cdist num">{bn(km(selectedPet, nearestClinicForSelected).toFixed(1))} কিমি</span>
                      </div>
                      <div className="cmeta">
                        {nearestClinicForSelected.phone && <a href={`tel:${nearestClinicForSelected.phone}`}>কল করুন</a>}
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            closeDrawer();
                            setPage('help');
                          }}
                        >
                          সব ক্লিনিক দেখুন
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                {selectedPet.type !== 'adopt' && !selectedPet.resolved && (
                  <button className="btn block" style={{ marginBottom: '14px' }} onClick={() => handleMakePoster(selectedPet)}>
                    A4 পোস্টার তৈরি করুন — ডাউনলোড বা প্রিন্ট
                  </button>
                )}
                {selectedPet.images && selectedPet.images.length > 1 && (
                  <div className="gallery">
                    {selectedPet.images.slice(0, 8).map((src, i) => (
                      <img key={i} src={src} alt="" onClick={() => window.open(src)} />
                    ))}
                  </div>
                )}
                <p style={{ margin: '0 0 16px', color: 'var(--ink-2)' }}>{selectedPet.desc}</p>
                <dl className="dl">
                  <dt>প্রাণী</dt>
                  <dd>
                    {SPECIES_BN[selectedPet.species]} · {selectedPet.breed}
                  </dd>
                  <dt>রঙ</dt>
                  <dd>{selectedPet.colors.join(', ')}</dd>
                  <dt>লিঙ্গ ও বয়স</dt>
                  <dd>
                    {selectedPet.sex} · {selectedPet.age}
                  </dd>
                  <dt>বিশেষ চিহ্ন</dt>
                  <dd>{selectedPet.marks}</dd>
                  {selectedPet.type === 'adopt' && selectedPet.health && (
                    <>
                      <dt>টিকা</dt>
                      <dd>{selectedPet.health.vaccinated || 'জানা নেই'}</dd>
                      <dt>স্বাস্থ্য নোট</dt>
                      <dd>{selectedPet.health.notes || '—'}</dd>
                    </>
                  )}
                  <dt>এলাকা</dt>
                  <dd>
                    {selectedPet.area}
                    {division === 'all' ? ' · ' + bn(km(HOME, selectedPet).toFixed(1)) + ' কিমি দূরে' : ''}
                  </dd>
                  <dt>তারিখ</dt>
                  <dd>
                    {new Date(selectedPet.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })} ({agoText(selectedPet.date)})
                  </dd>
                </dl>

                {/* POTENTIAL MATCHES */}
                {selectedPet.type === 'lost' && (
                  <div className="sect">
                    <div className="secthead">
                      <h3>সম্ভাব্য মিল</h3>
                      <span className="c num">{bn(selectedPetMatches.length)} টি</span>
                    </div>
                    {selectedPetMatches.length ? (
                      selectedPetMatches.map((m) => {
                        const w = (k: 'visual' | 'dist' | 'traits' | 'time') => ((m.parts[k] / m.total) * 100).toFixed(1) + '%';
                        return (
                          <div key={m.pet.id} className="match" onClick={() => openPet(m.pet.id)}>
                            <div className="mtop">
                              <div className="thumb" style={{ background: TINT[m.pet.species], color: '#3B4642' }}>
                                {m.pet.images && m.pet.images.length ? <img src={m.pet.images[0]} alt="" /> : Icons[m.pet.species]}
                              </div>
                              <div>
                                <div className="mname">
                                  {m.pet.breed} {SPECIES_BN[m.pet.species]}
                                </div>
                                <div className="mplace">
                                  {m.pet.area} · {agoText(m.pet.date)}
                                </div>
                              </div>
                              <div className="score">
                                <b>{bn(Math.round(m.total * 100))}</b>
                                <small>%</small>
                              </div>
                            </div>
                            <div className="meter">
                              <i style={{ width: w('visual'), background: '#1D6B5F' }} />
                              <i style={{ width: w('dist'), background: '#5E9084' }} />
                              <i style={{ width: w('traits'), background: '#A99150' }} />
                              <i style={{ width: w('time'), background: '#B9C2BD' }} />
                            </div>
                            <div className="legend">
                              <span>
                                <i style={{ background: '#1D6B5F' }} />
                                ছবির মিল<em>{bn(Math.round((m.parts.visual / 0.5) * 100))}%</em>
                              </span>
                              <span>
                                <i style={{ background: '#5E9084' }} />
                                দূরত্ব<em>{bn(m.dist.toFixed(1))} কিমি</em>
                              </span>
                              <span>
                                <i style={{ background: '#A99150' }} />
                                রঙ ও জাত<em>{bn(Math.round((m.parts.traits / 0.15) * 100))}%</em>
                              </span>
                              <span>
                                <i style={{ background: '#B9C2BD' }} />
                                সময়ের নৈকট্য<em>{bn(Math.round((m.parts.time / 0.1) * 100))}%</em>
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="note">এখনো কোনো মিল পাওয়া যায়নি। নতুন পোস্ট এলে সিস্টেম নিজে থেকে মিলিয়ে দেখে আপনাকে জানাবে।</div>
                    )}
                    <div className="note">স্কোর কেবল সম্ভাবনা নির্দেশ করে, নিশ্চিত করে না। দেখা করার আগে বিশেষ চিহ্ন ও পুরোনো ছবি মিলিয়ে নিন।</div>
                  </div>
                )}

                {/* SIGHTINGS SECTION */}
                {selectedPet.type === 'lost' && (
                  <div className="sect">
                    <div className="secthead">
                      <h3>কোথায় দেখা গেছে</h3>
                      <span className="c num">{bn((selectedPet.sightings || []).length)} টি</span>
                    </div>
                    {(selectedPet.sightings || []).length ? (
                      [...selectedPet.sightings!]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((s, i) => (
                          <div key={i} className="sight">
                            <div className="pip num">{bn(i + 1)}</div>
                            <div className="w">
                              <div className="sh">
                                <b>{s.area || 'ম্যাপে চিহ্নিত জায়গা'}</b>
                                <em>{agoText(s.date)}</em>
                              </div>
                              <p>{s.note || 'বিবরণ দেওয়া হয়নি'}</p>
                              <p className="num" style={{ color: 'var(--ink-3)', fontSize: '11.5px' }}>
                                {bn(km(selectedPet, s).toFixed(1))} কিমি · {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                              </p>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="note">এখনো কেউ দেখেনি বলে জানায়নি। কেউ দেখলে ম্যাপে পিন দিয়ে জানাতে পারেন — পিনগুলো মিলিয়ে চলার পথ বোঝা যায়।</div>
                    )}
                    <button
                      className="btn ghost block"
                      style={{ marginTop: '10px' }}
                      onClick={() => {
                        setSightingPetId(selectedPet.id);
                        setDrawerMode('sighting');
                      }}
                    >
                      এখানে দেখেছি — জানান
                    </button>
                  </div>
                )}

                {/* COMMENTS SECTION */}
                <div className="sect">
                  <div className="secthead">
                    <h3>আপডেট ও মন্তব্য</h3>
                    <span className="c num">{bn((selectedPet.comments || []).length)} টি</span>
                  </div>
                  {(selectedPet.comments || []).length ? (
                    selectedPet.comments!.map((c, i) => (
                      <div key={i} className="cmt">
                        <div className="ch">
                          <b>{c.author}</b>
                          <em>{c.at}</em>
                        </div>
                        <p>{c.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="note">এখনো কোনো আপডেট নেই। কিছু জানা থাকলে এখানে লিখে রাখুন — সবাই দেখতে পাবে।</div>
                  )}
                  <div className="cmtbox">
                    <input
                      type="text"
                      id="cName"
                      placeholder="আপনার নাম"
                      style={{ maxWidth: '140px' }}
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                    />
                    <input
                      type="text"
                      id="cText"
                      placeholder="যেমন: আজ বিকেলে এই এলাকায় দেখেছি"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button className="btn sm" onClick={() => handleAddComment(selectedPet.id)}>
                      যোগ
                    </button>
                  </div>
                </div>

                {/* ADOPTION INTEREST SECTION */}
                {selectedPet.type === 'adopt' && (
                  <div className="sect">
                    <div className="secthead">
                      <h3>দত্তক নিতে আগ্রহী?</h3>
                      {selectedPet.mine && <span className="c num">{bn((selectedPet.interests || []).length)} টি আবেদন</span>}
                    </div>
                    {selectedPet.mine ? (
                      (selectedPet.interests || []).length ? (
                        selectedPet.interests!.map((it, i) => (
                          <div key={i} className="intcard">
                            <div className="ih">
                              <b>{it.name}</b>
                              <span className="mplace">{it.at}</span>
                            </div>
                            <div className="tagrow">
                              <span className="tag">{it.home}</span>
                              <span className="tag">{it.exp}</span>
                              <span className="tag">{it.phone}</span>
                            </div>
                            <p>{it.msg || 'বার্তা দেওয়া হয়নি'}</p>
                          </div>
                        ))
                      ) : (
                        <div className="note">এখনো কেউ আবেদন করেনি।</div>
                      )
                    ) : (
                      <>
                        <div className="note">দত্তক নেওয়া দীর্ঘমেয়াদি দায়িত্ব। ছোট একটি ফর্ম পূরণ করলে পোস্টদাতা আপনার সাথে যোগাযোগ করবেন।</div>
                        <button className="btn block" style={{ marginTop: '10px' }} onClick={() => setDrawerMode('interest')}>
                          দত্তকের আবেদন করুন
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* ACTIONS */}
                <div className="sect">
                  <div className="secthead">
                    <h3>যোগাযোগ ও প্রচার</h3>
                  </div>
                  {selectedPet.type !== 'adopt' && (
                    <button className="btn block" onClick={() => showToast('মেসেজ পাঠানো হয়েছে — পোস্টদাতা যোগাযোগ করবেন')}>
                      মেসেজ পাঠান
                    </button>
                  )}
                  <div className="btnrow" style={{ marginTop: '8px' }}>
                    <button className="btn ghost" onClick={() => handleMakePoster(selectedPet)}>
                      পোস্টার ছাপুন
                    </button>
                    <button className="btn ghost" onClick={() => handleWaShare(selectedPet)}>
                      হোয়াটসঅ্যাপে পাঠান
                    </button>
                    <button className="btn ghost" onClick={() => handleTextShare(selectedPet)}>
                      লেখা কপি করুন
                    </button>
                    <button className="btn ghost" onClick={() => setDrawerMode('report')}>
                      রিপোর্ট করুন
                    </button>
                  </div>
                  {!selectedPet.resolved && (
                    <button className="btn ghost block" style={{ marginTop: '8px' }} onClick={() => handleResolve(selectedPet.id)}>
                      {selectedPet.type === 'adopt' ? 'নতুন বাসা পেয়েছে' : 'সমাধান হয়েছে'} — পোস্ট বন্ধ করুন
                    </button>
                  )}
                  {selectedPet.mine && (
                    <div className="btnrow" style={{ marginTop: '8px' }}>
                      <button className="btn ghost" onClick={() => openFormModal(undefined, selectedPet.id)}>
                        পোস্ট সম্পাদনা
                      </button>
                      <button className="btn ghost" style={{ color: 'var(--lost)', borderColor: '#E3C9C7' }} onClick={() => handleDeletePost(selectedPet.id)}>
                        মুছে ফেলুন
                      </button>
                    </div>
                  )}
                  <div className="note warn">
                    <b>সতর্কতা:</b> দেখা করার আগে কেউ টাকা, কুরিয়ার ফি বা অগ্রিম চাইলে সেটি প্রতারণা। প্রকাশ্য জায়গায় দেখা করুন, ফোন নম্বর বাইরে শেয়ার করবেন না।
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SIGHTING DRAWER */}
          {drawerMode === 'sighting' && sightingPetId && (
            <div>
              <div className="sheethead">
                <h2>এখানে দেখেছি</h2>
                <button className="x" onClick={() => setDrawerMode('pet')} aria-label="ফিরে যান">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M5 5l14 14M19 5L5 19" />
                  </svg>
                </button>
              </div>
              <div className="sheetbody">
                <div className="note">কোথায় দেখেছেন ম্যাপে পিন দিন। কয়েকজনের রিপোর্ট মিলে চলার পথ বোঝা যায়, তাই নিশ্চিত না হলেও জানান।</div>
                <div className="field" style={{ marginTop: '14px' }}>
                  <label>জায়গা — ম্যাপে ক্লিক করুন</label>
                  <div id="pickmap" ref={sightingMapContainerRef} />
                  <div className="rngrow" style={{ marginTop: '6px' }}>
                    <span>
                      {sPicked.lat.toFixed(4)}, {sPicked.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
                <div className="two">
                  <div className="field">
                    <label>কবে দেখেছেন</label>
                    <input type="date" value={sDate} onChange={(e) => setSDate(e.target.value)} max="2026-08-02" />
                  </div>
                  <div className="field">
                    <label>এলাকার নাম</label>
                    <input type="text" value={sArea} onChange={(e) => setSArea(e.target.value)} placeholder="যেমন: লক্ষ্মীপুর মোড়" />
                  </div>
                </div>
                <div className="field">
                  <label>কী দেখেছেন</label>
                  <textarea
                    rows={3}
                    value={sNote}
                    onChange={(e) => setSNote(e.target.value)}
                    placeholder="কোন দিকে গেল, কেমন অবস্থায় ছিল, গলায় বেল্ট ছিল কিনা"
                  />
                </div>
                <div className="actions">
                  <button className="btn ghost" onClick={() => setDrawerMode('pet')}>
                    বাতিল
                  </button>
                  <button className="btn" onClick={handleSaveSighting}>
                    রিপোর্ট পাঠান
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REPORT DRAWER */}
          {drawerMode === 'report' && (
            <div>
              <div className="sheethead">
                <h2>পোস্ট রিপোর্ট করুন</h2>
                <button className="x" onClick={() => setDrawerMode('pet')} aria-label="ফিরে যান">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M5 5l14 14M19 5L5 19" />
                  </svg>
                </button>
              </div>
              <div className="sheetbody">
                <div className="note">রিপোর্ট গোপন থাকে। একাধিক রিপোর্ট এলে পোস্টে সতর্কবার্তা দেখানো হয় এবং মডারেটর যাচাই করেন।</div>
                <div className="field" style={{ marginTop: '14px' }}>
                  <label>কারণ</label>
                  <select value={rReason} onChange={(e) => setRReason(e.target.value)}>
                    {['ভুয়া বা বিভ্রান্তিকর', 'অনুপযুক্ত বিষয়বস্তু', 'স্প্যাম বা বিজ্ঞাপন', 'সমাধান হয়ে গেছে', 'অন্যান্য'].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>বিস্তারিত</label>
                  <textarea rows={3} value={rDetail} onChange={(e) => setRDetail(e.target.value)} placeholder="কী সমস্যা দেখেছেন" />
                </div>
                <div className="actions">
                  <button className="btn ghost" onClick={() => setDrawerMode('pet')}>
                    বাতিল
                  </button>
                  <button className="btn" onClick={handleSaveReport}>
                    রিপোর্ট পাঠান
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADOPTION INTEREST DRAWER */}
          {drawerMode === 'interest' && (
            <div>
              <div className="sheethead">
                <h2>দত্তকের আবেদন</h2>
                <button className="x" onClick={() => setDrawerMode('pet')} aria-label="ফিরে যান">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M5 5l14 14M19 5L5 19" />
                  </svg>
                </button>
              </div>
              <div className="sheetbody">
                <div className="note">প্রশ্নগুলো ছোট, কিন্তু পোস্টদাতাকে সঠিক বাসা বেছে নিতে সাহায্য করে।</div>
                <div className="two" style={{ marginTop: '14px' }}>
                  <div className="field">
                    <label>আপনার নাম</label>
                    <input type="text" value={iName} onChange={(e) => setIName(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>ফোন</label>
                    <input type="text" value={iPhone} onChange={(e) => setIPhone(e.target.value)} placeholder="০১XXXXXXXXX" />
                  </div>
                </div>
                <div className="two">
                  <div className="field">
                    <label>বাসস্থান</label>
                    <select value={iHome} onChange={(e) => setIHome(e.target.value)}>
                      <option>ফ্ল্যাট</option>
                      <option>উঠান সহ বাসা</option>
                      <option>মেস / শেয়ার্ড</option>
                      <option>অন্যান্য</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>আগের অভিজ্ঞতা</label>
                    <select value={iExp} onChange={(e) => setIExp(e.target.value)}>
                      <option>আগে পোষ্য ছিল</option>
                      <option>এখনো পোষ্য আছে</option>
                      <option>প্রথমবার</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>কেন নিতে চান</label>
                  <textarea rows={3} value={iMsg} onChange={(e) => setIMsg(e.target.value)} placeholder="পরিবারে কারা আছেন, সারাদিন কে দেখবে, ইত্যাদি" />
                </div>
                <div className="actions">
                  <button className="btn ghost" onClick={() => setDrawerMode('pet')}>
                    বাতিল
                  </button>
                  <button className="btn" onClick={handleSaveInterest}>
                    আবেদন পাঠান
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STORY DRAWER */}
          {drawerMode === 'story' && (
            <div>
              <div className="sheethead">
                <h2>গল্পটা লিখে রাখুন</h2>
                <button className="x" onClick={closeDrawer} aria-label="বন্ধ করুন">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M5 5l14 14M19 5L5 19" />
                  </svg>
                </button>
              </div>
              <div className="sheetbody">
                <div className="note">ঐচ্ছিক — তবে গল্পগুলোই নতুন কাউকে আশা দেয় আর সাইটে আস্থা তৈরি করে।</div>
                <div className="field" style={{ marginTop: '14px' }}>
                  <label>শিরোনাম</label>
                  <input type="text" value={stTitle} onChange={(e) => setStTitle(e.target.value)} />
                </div>
                <div className="field">
                  <label>কী হয়েছিল</label>
                  <textarea rows={4} value={stText} onChange={(e) => setStText(e.target.value)} placeholder="কীভাবে খুঁজে পেলেন, কে সাহায্য করল" />
                </div>
                <div className="field">
                  <label>আপনার নাম</label>
                  <input type="text" value={stBy} onChange={(e) => setStBy(e.target.value)} placeholder="নাম" />
                </div>
                <div className="actions">
                  <button className="btn ghost" onClick={closeDrawer}>
                    এখন নয়
                  </button>
                  <button className="btn" onClick={handleSaveStory}>
                    গল্প প্রকাশ করুন
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS DRAWER */}
          {drawerMode === 'notifs' && (
            <div>
              <div className="sheethead">
                <h2>নোটিফিকেশন</h2>
                <button className="x" onClick={closeDrawer} aria-label="বন্ধ করুন">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M5 5l14 14M19 5L5 19" />
                  </svg>
                </button>
              </div>
              <div className="sheetbody">
                {!subs.length && <div className="note">এখনো কোনো সাবস্ক্রিপশন নেই। বাঁ পাশের ফিল্টার থেকে "এই ফিল্টারে নতুন এলে জানান" চাপুন।</div>}
                {subs.length > 0 && <div className="note">সক্রিয় সাবস্ক্রিপশন: {bn(subs.length)} টি</div>}
                <div style={{ marginTop: '12px' }}>
                  {notifications.length ? (
                    notifications.map((p) => (
                      <div key={p.id} className="match" onClick={() => openPet(p.id)}>
                        <div className="mtop">
                          <div className="thumb" style={{ background: TINT[p.species], color: '#3B4642' }}>
                            {p.images && p.images.length ? <img src={p.images[0]} alt="" /> : Icons[p.species]}
                          </div>
                          <div>
                            <div className="mname">
                              {p.name ? p.name + ' · ' : ''}
                              {p.breed} {SPECIES_BN[p.species]}
                            </div>
                            <div className="mplace">
                              {TYPE_CONFIG[p.type].bn} · {p.area}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="note">নতুন কিছু নেই।</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* NEW / EDIT POST WIZARD */}
          {drawerMode === 'form' && (
            <div>
              <div className="sheethead">
                <h2>{editingId ? 'পোস্ট সম্পাদনা' : 'নতুন পোস্ট'}</h2>
                <button className="x" onClick={closeDrawer} aria-label="বন্ধ করুন">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M5 5l14 14M19 5L5 19" />
                  </svg>
                </button>
              </div>
              <div className="sheetbody">
                <div className="steps" id="stepBar">
                  <div className={`stp ${formStep === 1 ? 'on' : formStep > 1 ? 'done' : ''}`} data-s="1">
                    <b>১</b>
                    <span>কী হারিয়েছে</span>
                  </div>
                  <div className={`stp ${formStep === 2 ? 'on' : formStep > 2 ? 'done' : ''}`} data-s="2">
                    <b>২</b>
                    <span>কোথায় ও কখন</span>
                  </div>
                  <div className={`stp ${formStep === 3 ? 'on' : formStep > 3 ? 'done' : ''}`} data-s="3">
                    <b>৩</b>
                    <span>ছবি ও বিবরণ</span>
                  </div>
                </div>

                {formStep === 1 && (
                  <div className="stepbox">
                    <div className="field">
                      <label>পোস্টের ধরন</label>
                      <div className="seg" id="fType">
                        <button data-v="lost" aria-pressed={formType === 'lost'} onClick={() => setFormType('lost')}>
                          <span>হারিয়েছে</span>
                        </button>
                        <button data-v="found" aria-pressed={formType === 'found'} onClick={() => setFormType('found')}>
                          <span>পাওয়া গেছে</span>
                        </button>
                        <button data-v="adopt" aria-pressed={formType === 'adopt'} onClick={() => setFormType('adopt')}>
                          <span>দত্তক দেব</span>
                        </button>
                      </div>
                    </div>
                    <div className="field">
                      <label>প্রাণী</label>
                      <div className="seg four" id="fSp">
                        <button data-v="dog" aria-pressed={formSpecies === 'dog'} onClick={() => setFormSpecies('dog')}>
                          {Icons.dog}
                          <span>কুকুর</span>
                        </button>
                        <button data-v="cat" aria-pressed={formSpecies === 'cat'} onClick={() => setFormSpecies('cat')}>
                          {Icons.cat}
                          <span>বিড়াল</span>
                        </button>
                        <button data-v="bird" aria-pressed={formSpecies === 'bird'} onClick={() => setFormSpecies('bird')}>
                          {Icons.bird}
                          <span>পাখি</span>
                        </button>
                        <button data-v="other" aria-pressed={formSpecies === 'other'} onClick={() => setFormSpecies('other')}>
                          {Icons.other}
                          <span>অন্যান্য</span>
                        </button>
                      </div>
                    </div>
                    <div className="two">
                      <div className="field">
                        <label>নাম (থাকলে)</label>
                        <input type="text" id="fName" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="বাদশা" />
                      </div>
                      <div className="field">
                        <label>জাত</label>
                        <input type="text" id="fBreed" value={formBreed} onChange={(e) => setFormBreed(e.target.value)} />
                      </div>
                    </div>
                    <div className="field">
                      <label>রঙ (কমা দিয়ে)</label>
                      <input
                        type="text"
                        id="fColors"
                        value={formColors}
                        onChange={(e) => setFormColors(e.target.value)}
                        placeholder="বাদামি, সাদা"
                      />
                    </div>
                    <div className="two">
                      <div className="field">
                        <label>লিঙ্গ</label>
                        <select id="fSex" value={formSex} onChange={(e) => setFormSex(e.target.value)}>
                          <option>পুরুষ</option>
                          <option>মহিলা</option>
                          <option>অজানা</option>
                        </select>
                      </div>
                      <div className="field">
                        <label>আনুমানিক বয়স</label>
                        <input type="text" id="fAge" value={formAge} onChange={(e) => setFormAge(e.target.value)} placeholder="যেমন: ২ বছর" />
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="stepbox">
                    <div className="two">
                      <div className="field">
                        <label>বিভাগ</label>
                        <select id="fDivision" value={formDivision} onChange={(e) => setFormDivision(e.target.value)}>
                          {DIVISIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label>তারিখ</label>
                        <input type="date" id="fDate" value={formDate} onChange={(e) => setFormDate(e.target.value)} max="2026-08-02" />
                      </div>
                    </div>
                    <div className="field">
                      <label>জায়গা — ম্যাপে ক্লিক করে পিন বসান</label>
                      <div id="pickmap" ref={pickMapContainerRef} />
                      <div className="rngrow" style={{ marginTop: '6px' }}>
                        <span>
                          {pickedLocation.lat.toFixed(4)}, {pickedLocation.lng.toFixed(4)} · কেন্দ্র থেকে {bn(km(HOME, pickedLocation).toFixed(1))} কিমি
                        </span>
                      </div>
                    </div>
                    <div className="field">
                      <label>এলাকার নাম</label>
                      <input
                        type="text"
                        id="fArea"
                        value={formArea}
                        onChange={(e) => setFormArea(e.target.value)}
                        placeholder="উপশহর, রাজশাহী"
                      />
                    </div>
                    <div className="field">
                      <label>বিশেষ চিহ্ন</label>
                      <input
                        type="text"
                        id="fMarks"
                        value={formMarks}
                        onChange={(e) => setFormMarks(e.target.value)}
                        placeholder="গলায় লাল বেল্ট, বাঁ কানে দাগ"
                      />
                    </div>
                  </div>
                )}

                {formStep === 3 && (
                  <div className="stepbox">
                    <div className="field">
                      <label>ছবি — যত বেশি, মিল পাওয়ার সম্ভাবনা তত বেশি</label>
                      <div className="uploader" onClick={() => document.getElementById('fFiles')?.click()}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M3 17V7a2 2 0 0 1 2-2h3l1.5-2h5L16 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <circle cx="12" cy="12" r="3.6" />
                        </svg>
                        <b>ছবি বেছে নিন</b>
                        <span>মুখ ও বিশেষ চিহ্ন স্পষ্ট দেখা যায় এমন ছবি সবচেয়ে ভালো কাজ করে</span>
                      </div>
                      <input
                        type="file"
                        id="fFiles"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => handleImageUpload(e.target.files)}
                      />
                      <div className="shots" id="shots">
                        {draftImages.map((src, i) => (
                          <div key={i} className="shot">
                            <img src={src} alt="" />
                            <button onClick={() => setDraftImages((prev) => prev.filter((_, idx) => idx !== i))} aria-label="সরান">
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="field">
                      <label>বিবরণ</label>
                      <textarea
                        id="fDesc"
                        rows={3}
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="কোথায়, কখন, কীভাবে — যতটা মনে আছে লিখুন"
                      />
                    </div>
                    {formType === 'adopt' && (
                      <div id="healthBlock">
                        <div className="two">
                          <div className="field">
                            <label>টিকা দেওয়া হয়েছে?</label>
                            <select id="fVac" value={formVac} onChange={(e) => setFormVac(e.target.value)}>
                              <option>হ্যাঁ</option>
                              <option>আংশিক</option>
                              <option>না</option>
                              <option>জানা নেই</option>
                            </select>
                          </div>
                          <div className="field">
                            <label>স্বাস্থ্য নোট</label>
                            <input
                              type="text"
                              id="fHealth"
                              value={formHealth}
                              onChange={(e) => setFormHealth(e.target.value)}
                              placeholder="কৃমির ওষুধ, চিকিৎসা ইত্যাদি"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="note">প্রকাশের আগে পোস্টটি একবার যাচাই করা হয় — সাধারণত কয়েক ঘণ্টার মধ্যে লাইভ হয়।</div>
                  </div>
                )}

                <div className="actions">
                  {formStep > 1 && (
                    <button className="btn ghost" id="backBtn" onClick={() => setFormStep((s) => s - 1)}>
                      পূর্ববর্তী
                    </button>
                  )}
                  {formStep < 3 && (
                    <button
                      className="btn"
                      id="nextBtn"
                      onClick={() => {
                        if (formStep === 1 && !formColors.trim()) {
                          showToast('অন্তত একটি রঙ লিখুন — মিল খোঁজার জন্য এটা জরুরি');
                          return;
                        }
                        if (formStep === 2 && !formArea.trim()) {
                          showToast('এলাকার নাম লিখুন');
                          return;
                        }
                        setFormStep((s) => s + 1);
                      }}
                    >
                      পরবর্তী
                    </button>
                  )}
                  {formStep === 3 && (
                    <button className="btn" id="doneBtn" onClick={submitPost}>
                      {editingId ? 'পরিবর্তন সংরক্ষণ করুন' : 'পোস্ট প্রকাশ করুন'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ---------- TOAST NOTIFICATION ---------- */}
      <div className={`toast ${toastMessage ? 'on' : ''}`} id="toast">
        {toastMessage}
      </div>

      {/* ---------- POST PET POPUP MODAL ---------- */}
      <PostPetModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        initialType={postModalType}
      />
    </div>
  );
}
