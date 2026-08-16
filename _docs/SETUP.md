# Pawtro — সেটআপ গাইড

শূন্য থেকে প্রথম ডিপ্লয় পর্যন্ত। প্রতিটা ধাপ ক্রমে অনুসরণ করুন — আগেরটা শেষ না করে পরেরটায় যাবেন না।

**আর্কিটেকচার ও ডেটা মডেলের জন্য দেখুন `BACKEND.md`।** এই ফাইলে শুধু "কীভাবে চালু করবেন"।

---

## ০. যা আগে থেকে লাগবে

| জিনিস | কীভাবে |
|---|---|
| Node.js ২০+ | `node -v` দিয়ে দেখুন। না থাকলে nodejs.org থেকে LTS |
| Git | `git --version` |
| একটা Google অ্যাকাউন্ট | Firebase-এর জন্য |
| কোড এডিটর | Antigravity / VS Code |

---

## ১. Next.js প্রজেক্ট তৈরি

```bash
npx create-next-app@latest pawtro
```

প্রশ্নগুলোর উত্তর:
```
TypeScript?          Yes
ESLint?              Yes
Tailwind CSS?        Yes
src/ directory?      Yes
App Router?          Yes
Turbopack?           Yes
import alias (@/*)?  Yes
```

```bash
cd pawtro
npm run dev      # http://localhost:3000 খুলে দেখুন চলছে কিনা
```

চললে `Ctrl+C` দিয়ে বন্ধ করুন, পরের ধাপে যান।

---

## ২. প্যাকেজ ইনস্টল

```bash
# Firebase (ক্লায়েন্ট + সার্ভার)
npm i firebase firebase-admin

# ম্যাপ
npm i leaflet react-leaflet
npm i -D @types/leaflet

# জিও কোয়েরি
npm i geofire-common

# পোস্টার (PDF/PNG ডাউনলোড)
npm i html2canvas jspdf qrcode

# ইউটিলিটি
npm i date-fns zod
```

---

## ৩. Firebase প্রজেক্ট তৈরি

### ৩.১ কনসোলে
1. https://console.firebase.google.com → **Add project**
2. নাম: `pawtro` → Continue
3. Google Analytics: **বন্ধ রাখুন** (এখন দরকার নেই, পরে চালু করা যায়) → Create project

### ৩.২ ওয়েব অ্যাপ যোগ
1. প্রজেক্ট ওভারভিউ → `</>` (Web) আইকন
2. App nickname: `pawtro-web`
3. **Firebase Hosting টিক দেবেন না** (Vercel ব্যবহার করব) → Register app
4. যে `firebaseConfig` অবজেক্টটা দেখাবে **সেটা কপি করে রাখুন** — পরের ধাপে লাগবে

### ৩.৩ Authentication চালু
1. বাঁ মেনু → **Authentication** → Get started
2. **Email/Password** → Enable → Save
3. **Google** → Enable → project support email বেছে নিন → Save

> ফোন OTP চালু করবেন না — Spark (ফ্রি) প্ল্যানে নেই, Blaze লাগে।

### ৩.৪ Firestore চালু
1. বাঁ মেনু → **Firestore Database** → Create database
2. **Start in production mode** বেছে নিন (test mode নয় — ওটা ৩০ দিন পর সব বন্ধ করে দেয়)
3. Location: **asia-south1 (Mumbai)** — বাংলাদেশের সবচেয়ে কাছে, লেটেন্সি কম

> লোকেশন একবার বাছলে আর বদলানো যায় না। ভুল করলে নতুন প্রজেক্ট বানাতে হবে।

### ৩.৫ Storage চালু
1. বাঁ মেনু → **Storage** → Get started
2. production mode → একই লোকেশন (asia-south1)

---

## ৪. এনভায়রনমেন্ট ভ্যারিয়েবল

প্রজেক্টের রুটে `.env.local` ফাইল বানান:

```bash
# Firebase client config — এগুলো পাবলিক, ব্রাউজারে যাবে, এটাই স্বাভাবিক
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pawtro.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pawtro
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pawtro.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc

# সার্ভার-সাইড — কখনো NEXT_PUBLIC_ প্রিফিক্স দেবেন না
FIREBASE_ADMIN_PROJECT_ID=pawtro
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@pawtro.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# তৃতীয় পক্ষ (পরে লাগবে, এখন খালি রাখতে পারেন)
RESEND_API_KEY=
REPLICATE_API_TOKEN=
```

**Admin credentials কোথায় পাবেন:** Firebase কনসোল → ⚙️ Project settings → **Service accounts** → Generate new private key → JSON ডাউনলোড হবে। সেখান থেকে `project_id`, `client_email`, `private_key` তিনটা তুলে নিন।

> **JSON ফাইলটা কখনো git-এ কমিট করবেন না।** `.gitignore`-এ `.env*.local` আর `*serviceAccount*.json` আছে কিনা দেখে নিন। এই key ফাঁস হলে যে কেউ আপনার পুরো ডেটাবেস পড়তে ও মুছতে পারবে।

**private_key নিয়ে সাবধান:** JSON-এ `\n` লেখা থাকে। `.env.local`-এ ডাবল কোটের ভেতরে রাখুন, আর কোডে ব্যবহারের সময়:
```ts
privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n')
```

---

## ৫. Firebase কোড ফাইল

**`src/lib/firebase.ts`** (ক্লায়েন্ট):
```ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

**`src/lib/firebase-admin.ts`** (সার্ভার):
```ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const app = getApps().length ? getApps()[0] : initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
});

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
```

---

## ৬. Firebase CLI ও Rules ডিপ্লয়

```bash
npm i -g firebase-tools
firebase login
firebase init
```

`firebase init`-এ যা বাছবেন (স্পেসবার দিয়ে টিক, এন্টার দিয়ে কনফার্ম):
```
◉ Firestore
◉ Functions
◉ Storage
◉ Emulators

Project: Use an existing project → pawtro
Firestore rules file:     firestore.rules      (ডিফল্ট)
Firestore indexes file:   firestore.indexes.json
Functions language:       TypeScript
ESLint:                   Yes
Install dependencies now: Yes
Storage rules file:       storage.rules
Emulators:                Auth, Functions, Firestore, Storage
```

এবার `BACKEND.md`-র সেকশন ৪ থেকে Rules কপি করে `firestore.rules` ও `storage.rules`-এ বসান, তারপর:

```bash
firebase deploy --only firestore:rules,storage
```

---

## ৭. Emulator দিয়ে লোকাল টেস্ট (এই ধাপ স্কিপ করবেন না)

```bash
firebase emulators:start
```
খুলবে http://localhost:4000 — এখানে ডেটা দেখতে ও Rules টেস্ট করতে পারবেন।

কোডে emulator-এ কানেক্ট করতে (শুধু ডেভেলপমেন্টে):
```ts
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

**Rules-এর অটোমেটেড টেস্ট** (সবচেয়ে গুরুত্বপূর্ণ ধাপ):
```bash
npm i -D @firebase/rules-unit-testing vitest
```

```ts
// tests/rules.test.ts
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

test('একজন ইউজার অন্যের পোস্ট এডিট করতে পারে না', async () => {
  const env = await initializeTestEnvironment({ projectId: 'pawtro-test' });
  const alice = env.authenticatedContext('alice').firestore();
  const bob   = env.authenticatedContext('bob').firestore();

  await assertSucceeds(setDoc(doc(alice, 'pets/p1'),
    { userId: 'alice', isApproved: false, description: 'test' }));

  await assertFails(updateDoc(doc(bob, 'pets/p1'), { description: 'hacked' }));
});

test('একজন অন্যের ফোন নম্বর পড়তে পারে না', async () => {
  // users/{uid} শুধু নিজের জন্য — assertFails হওয়া উচিত
});
```

```bash
npx vitest
```

দুটো টেস্টই পাস করলে তবেই পরের ধাপে যান। এখানে ভুল থাকলে পরে ধরা পড়ে না, কিন্তু ক্ষতি বড় হয়।

---

## ৮. Composite index

geohash কোয়েরি বা `collectionGroup` চালালে Firestore এরর দেবে — এরর মেসেজেই একটা লিংক থাকবে যেটাতে ক্লিক করলে ইনডেক্স তৈরি হয়ে যায়। ইনডেক্স বানাতে ২-১০ মিনিট লাগে।

আগে থেকেই বানাতে চাইলে `firestore.indexes.json`-এ:
```json
{
  "indexes": [
    {
      "collectionGroup": "pets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isApproved", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "geohash", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "interests",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "petOwnerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```
```bash
firebase deploy --only firestore:indexes
```

---

## ৯. তৃতীয় পক্ষের সেবা

### Resend (ইমেইল) — ফ্রি ৩,০০০/মাস
1. https://resend.com → সাইনআপ
2. **Domains** → Add domain → `pawtro.com` → দেখানো DNS রেকর্ডগুলো আপনার রেজিস্ট্রারে বসান
3. **API Keys** → Create → `.env.local`-এ `RESEND_API_KEY`

> ডোমেইন যাচাই না করলে শুধু নিজের ইমেইলে পাঠাতে পারবেন (টেস্টের জন্য যথেষ্ট)।

### Replicate (ছবি embedding)
1. https://replicate.com → সাইনআপ
2. Account → API tokens → `.env.local`-এ `REPLICATE_API_TOKEN`
3. বিলিং যোগ করতে হবে, তবে প্রতি ছবিতে খরচ নগণ্য

---

## ১০. ফোল্ডার স্ট্রাকচার

```
pawtro/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # হোম / ফিড
│   │   ├── p/[id]/page.tsx          # পোস্ট ডিটেইল (SEO পেজ)
│   │   ├── dashboard/page.tsx       # ইউজার ড্যাশবোর্ড
│   │   ├── new/page.tsx             # নতুন পোস্ট (৩ ধাপ)
│   │   ├── help/page.tsx            # সহায়তা কেন্দ্র
│   │   ├── stories/page.tsx         # সাফল্যের গল্প
│   │   ├── admin/page.tsx           # মডারেশন
│   │   └── api/
│   │       └── admin/verify/route.ts
│   ├── components/
│   │   ├── PetCard.tsx
│   │   ├── PetMap.tsx               # dynamic import, ssr:false
│   │   ├── MatchMeter.tsx
│   │   ├── PosterButton.tsx
│   │   └── ThemeToggle.tsx
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── firebase-admin.ts
│   │   ├── geo.ts                   # geohash + haversine
│   │   ├── matching.ts              # cosine similarity, স্কোরিং
│   │   └── constants.ts             # DIVISIONS, SPECIES, ROMAN dictionary
│   └── types/index.ts
├── functions/src/index.ts           # embedding, matching, email
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
└── .env.local
```

**Leaflet নিয়ে একটা ফাঁদ:** এটা `window` ব্যবহার করে, তাই সার্ভারে রেন্ডার হলে ক্র্যাশ করবে। সবসময় এভাবে ইমপোর্ট করুন:
```ts
const PetMap = dynamic(() => import('@/components/PetMap'), { ssr: false });
```

---

## ১১. প্রোটোটাইপ থেকে কোড নেওয়া

`pawtro-pet-finder.html` ও `pawtro-dashboard.html` থেকে যা সরাসরি তুলে নিতে পারবেন:

| প্রোটোটাইপে | কোথায় যাবে |
|---|---|
| `:root` CSS ভ্যারিয়েবল ও ডার্ক প্যালেট | `globals.css` |
| `matchesFor()` স্কোরিং লজিক | `lib/matching.ts` |
| `ROMAN` ডিকশনারি, `bn()`, `km()` | `lib/constants.ts`, `lib/geo.ts` |
| পোস্টার HTML টেমপ্লেট + QR | `components/PosterButton.tsx` |
| SVG আইকন (কুকুর/বিড়াল/পাখি/খরগোশ) | `components/icons.tsx` |
| থিম টগল স্ক্রিপ্ট | `app/layout.tsx`-এ inline script |

HTML মার্কআপ JSX-এ রূপান্তর করার সময়: `class` → `className`, `for` → `htmlFor`, ইনলাইন `style` স্ট্রিং → অবজেক্ট।

---

## ১২. Vercel-এ ডিপ্লয়

```bash
git init && git add -A && git commit -m "initial"
gh repo create pawtro --private --source=. --push   # অথবা GitHub-এ ম্যানুয়ালি
```

1. https://vercel.com → Add New → Project → GitHub রিপো বেছে নিন
2. **Environment Variables** — `.env.local`-এর সব লাইন এখানে বসান (Production + Preview দুটোতেই)
3. Deploy

**Firebase-এ অনুমোদিত ডোমেইন যোগ করুন** — নাহলে লাইভ সাইটে Google লগইন কাজ করবে না:
Firebase কনসোল → Authentication → Settings → **Authorized domains** → Add domain → `pawtro.vercel.app` এবং পরে `pawtro.com`

### কাস্টম ডোমেইন
1. Vercel → Project → Settings → Domains → `pawtro.com` যোগ করুন
2. Vercel যে DNS রেকর্ড দেখাবে সেগুলো রেজিস্ট্রারে বসান (সাধারণত একটা A রেকর্ড + একটা CNAME)
3. DNS ছড়াতে কয়েক মিনিট থেকে কয়েক ঘণ্টা লাগে
4. HTTPS সার্টিফিকেট Vercel নিজেই বানিয়ে দেবে

---

## ১৩. Cloud Functions ডিপ্লয়

Functions-এর জন্য **Blaze প্ল্যান লাগে** (আউটবাউন্ড নেটওয়ার্ক কলের কারণে)। Blaze-এ Spark-এর ফ্রি কোটা বজায় থাকে, শুধু তার উপরে গেলে বিল হয়।

1. Firebase কনসোল → ⚙️ Usage and billing → Modify plan → Blaze
2. **সাথে সাথে বাজেট অ্যালার্ট সেট করুন:** Google Cloud Console → Billing → Budgets & alerts → $5

```bash
cd functions
npm i firebase-functions firebase-admin resend replicate
cd ..
firebase deploy --only functions
```

Functions-এর সিক্রেট আলাদা করে দিতে হয়:
```bash
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set REPLICATE_API_TOKEN
```

---

## ১৪. লঞ্চের আগে চেকলিস্ট

- [ ] Rules টেস্ট পাস করেছে (দুই অ্যাকাউন্ট দিয়ে ক্রস-টেস্ট)
- [ ] `.env.local` ও service account JSON git-এ নেই — `git log -p | grep -i "private_key"` দিয়ে দেখে নিন
- [ ] Firebase Authorized domains-এ আসল ডোমেইন যোগ করা
- [ ] App Check চালু (Firebase কনসোল → App Check → reCAPTCHA Enterprise)
- [ ] বিলিং অ্যালার্ট সেট
- [ ] টার্মস, প্রাইভেসি পলিসি, কমিউনিটি গাইডলাইন পেজ
- [ ] ছবি রিসাইজ কাজ করছে (আপলোড করা ফাইলের সাইজ চেক করুন — ৩০০KB-র নিচে হওয়া উচিত)
- [ ] প্রথম ৩০-৪০টা পোস্ট সিড করা
- [ ] মোবাইলে সব পেজ টেস্ট করা

---

## ১৫. দরকারি কমান্ড

```bash
npm run dev                                    # লোকাল ডেভ
firebase emulators:start                       # লোকাল Firebase
firebase deploy --only firestore:rules         # শুধু Rules
firebase deploy --only functions               # শুধু Functions
firebase deploy --only firestore:indexes       # শুধু ইনডেক্স
npx vitest                                     # Rules টেস্ট
firebase functions:log                         # Function-এর লগ দেখা
```

---

## যেখানে সবচেয়ে বেশি আটকাবেন

| সমস্যা | কারণ ও সমাধান |
|---|---|
| `Missing or insufficient permissions` | Rules আটকাচ্ছে। Emulator UI-তে Requests ট্যাবে দেখুন কোন rule ফেল করল |
| `The query requires an index` | এরর মেসেজের লিংকে ক্লিক করুন, ইনডেক্স তৈরি হয়ে যাবে |
| `window is not defined` | Leaflet বা ব্রাউজার-only কোড SSR-এ চলছে — `dynamic(..., { ssr: false })` |
| Google লগইন কাজ করছে না লাইভে | Authorized domains-এ ডোমেইন যোগ করেননি |
| `Invalid PEM formatted message` | private_key-তে `\n` ঠিকভাবে replace হয়নি |
| রিড কোটা দ্রুত শেষ | `onSnapshot` ফিডে ব্যবহার করছেন, বা পেজিনেশন নেই |
