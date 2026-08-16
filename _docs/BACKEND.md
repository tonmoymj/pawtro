# Pawtro — ব্যাকএন্ড পরিকল্পনা (Firebase স্ট্যাক)

প্রোটোটাইপ (`pawtro-pet-finder.html`, `pawtro-dashboard.html`) যা যা ব্রাউজারেই করে ফেলে, আর যা যা ব্যাকএন্ড ছাড়া সম্ভব নয় — এই ডকুমেন্টে সেই দ্বিতীয় তালিকাটা।

**স্ট্যাক:** Next.js (App Router) + Firebase (Auth / Firestore / Storage / Functions) + Vercel বা Firebase Hosting

**কেন Firebase:** Auth, ডেটাবেস ও ফাইল স্টোরেজ একই জায়গায়, আলাদা auth সার্ভিস লাগে না। ডকুমেন্ট সংখ্যার কোনো স্থায়ী সীমা নেই — সীমা দৈনিক রিড/রাইটে, যা প্রতিদিন রিসেট হয়। একটা কমিউনিটি সাইটে যেখানে ডেটা জমতেই থাকে, এটাই বেশি টেকসই।

**মূল নিরাপত্তা নিয়ম:** Firestore Security Rules-ই এখানে প্রধান রক্ষাকবচ — ডেটাবেস লেভেলে বসে, তাই অ্যাপ কোডে ভুল হলেও এটা আটকাবে। সাধারণ read/write সরাসরি ক্লায়েন্ট থেকেই করা যায় (Rules যাচাই করবে); শুধু ভারী বা সংবেদনশীল কাজ (embedding তৈরি, ম্যাচিং, নোটিফিকেশন, ভেরিফিকেশন) Cloud Functions-এ যাবে।

```
ইউজারের ব্রাউজার
  ├─ সাধারণ read/write → সরাসরি Firestore SDK → Security Rules যাচাই করে
  └─ ভারী কাজ          → Cloud Function (embedding, matching, email, admin)
```

---

## ১. এখন কী কাজ করছে, কী করছে না

| ফিচার | প্রোটোটাইপে | ব্যাকএন্ডে যা লাগবে |
|---|---|---|
| লগইন ও প্রোফাইল | ❌ লোকাল প্রোফাইল সেটআপ | Firebase Auth (Email/Google) + `users` কালেকশন |
| পোস্ট তৈরি, এডিট, ডিলিট | ✅ মেমরি/localStorage | `pets` কালেকশন + Security Rules |
| ছবি আপলোড | ✅ base64 (শুধু নিজের ব্রাউজারে) | Cloud Storage + রিসাইজ |
| ম্যাপ ও দূরত্ব ফিল্টার | ✅ ক্লায়েন্টে haversine | geohash রেঞ্জ কোয়েরি + ক্লায়েন্টে ফাইন ফিল্টার |
| ছবি দিয়ে ম্যাচিং | ⚠️ মক ভেক্টর | CLIP embedding (Function) + cosine similarity |
| ইউজার ড্যাশবোর্ড | ✅ ডেমো ডেটা | `where('userId','==',uid)` কোয়েরি |
| সাইটিং, কমেন্ট, রিপোর্ট, দত্তক আবেদন | ✅ | সাবকালেকশন |
| মেসেজিং | ❌ নেই | `conversations` কালেকশন |
| নোটিফিকেশন | ⚠️ ইন-অ্যাপ বেল | Cloud Function + Resend, FCM পুশ |
| পোস্টার ও QR | ✅ পুরোপুরি ক্লায়েন্টে | কিছু লাগবে না |
| ভেরিফায়েড রেসকিউ টিম | ✅ স্ট্যাটিক তালিকা | `organizations` কালেকশন + admin claim |
| ভেট ক্লিনিক ডিরেক্টরি | ✅ হার্ডকোড | `clinics` কালেকশন |
| মডারেশন | ❌ নেই | custom claims + অ্যাডমিন পেজ |

---

## ২. Auth — Firebase Authentication

```ts
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const app = initializeApp({ /* config — এগুলো পাবলিক, লুকানোর দরকার নেই */ });
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

- **ইমেইল/পাসওয়ার্ড ও Google** — Spark (ফ্রি) প্ল্যানে ৫০,০০০ MAU পর্যন্ত
- **ফোন OTP এড়িয়ে চলুন** — Spark প্ল্যানে নেই, Blaze লাগে আর প্রতি SMS-এ খরচ। ফোন নম্বর প্রোফাইলে নিন, কিন্তু OTP যাচাই আপাতত বাদ দিন
- সাইনআপের পর একটা `users/{uid}` ডকুমেন্ট তৈরি হবে

**Firebase config পাবলিক** — এটা স্বাভাবিক, লুকানোর জিনিস নয়। নিরাপত্তা আসে Security Rules থেকে, key গোপন রাখা থেকে নয়। শুধু Admin SDK-র service account JSON কখনো ক্লায়েন্টে যাবে না।

---

## ৩. ডেটা মডেল (Firestore)

```
users/{uid}
  displayName, phone, division, photoURL, role, createdAt
  notifPrefs: { match, sight, digest, remind }

pets/{petId}
  userId, orgId?, type, species, petName, breed, colors[],
  sex, age, marks, description,
  images: [{ path, url }],
  embedding: [512 numbers],
  division, area, lat, lng, geohash,
  eventDate, status, isApproved, reportCount,
  matchCount, sightingCount, commentCount, viewCount,
  createdAt, updatedAt

  pets/{petId}/sightings/{id}   → userId, lat, lng, area, note, date
  pets/{petId}/comments/{id}    → userId, author, text, createdAt
  pets/{petId}/reports/{id}     → userId, reason, detail, createdAt
  pets/{petId}/interests/{id}   → userId, petOwnerId, name, phone, home, exp, msg, state

matches/{id}        → lostPetId, foundPetId, score, parts{}, dismissed
conversations/{id}  → petId, participants[uid,uid], lastAt,
                      messages: [{ senderId, text, at }]   ← array, আলাদা ডক নয়
organizations/{id}  → userId, name, area, description, phone, verified
clinics/{id}        → name, address, lat, lng, phone, hours, division
stories/{id}        → petId, title, text, imageUrl, authorName, createdAt
```

**কেন কাউন্টার ফিল্ড (`matchCount`, `commentCount`):** Firestore-এ "কতগুলো আছে" জানতে সবগুলো পড়তে হয়, আর প্রতিটা পড়া রিড কোটা খরচ করে। তাই সংখ্যাগুলো পোস্ট ডকুমেন্টেই রেখে দিন, Function দিয়ে `increment()` করবেন। ড্যাশবোর্ডে এতে একটামাত্র রিডে সব সংখ্যা চলে আসে।

**কেন মেসেজ array-তে:** প্রতিটা মেসেজ আলাদা ডকুমেন্ট হলে থ্রেড খুললেই ৫০-১০০ রিড। array-তে রাখলে **একটা রিড**। থ্রেড খুব লম্বা হলে (৫০০+ মেসেজ) নতুন ডকুমেন্টে ভাগ করবেন, কিন্তু এই সাইটে কথোপকথন সাধারণত ছোট হবে।

---

## ৪. Security Rules — এটাই মূল সুরক্ষা

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn()   { return request.auth != null; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }
    function isAdmin()    { return signedIn() && request.auth.token.admin == true; }

    match /users/{uid} {
      allow read:   if isOwner(uid) || isAdmin();     // ফোন নম্বর কখনো পাবলিক নয়
      allow create: if isOwner(uid);
      allow update: if isOwner(uid) &&
                    request.resource.data.role == resource.data.role;  // নিজেকে admin বানানো যাবে না
      allow delete: if isOwner(uid) || isAdmin();
    }

    match /pets/{petId} {
      allow read: if resource.data.isApproved == true
                  || isOwner(resource.data.userId) || isAdmin();
      allow create: if isOwner(request.resource.data.userId)
                    && request.resource.data.isApproved == false;   // নিজে approve করা যাবে না
      allow update: if (isOwner(resource.data.userId)
                        && request.resource.data.userId == resource.data.userId
                        && request.resource.data.isApproved == resource.data.isApproved)
                    || isAdmin();
      allow delete: if isOwner(resource.data.userId) || isAdmin();

      match /comments/{id} {
        allow read: if true;
        allow create: if isOwner(request.resource.data.userId);
        allow update, delete: if isOwner(resource.data.userId) || isAdmin();
      }
      match /sightings/{id} {
        allow read: if true;
        allow create: if signedIn();
        allow update, delete: if isOwner(resource.data.userId) || isAdmin();
      }
      match /reports/{id} {
        allow read: if isAdmin();                    // রিপোর্ট গোপন
        allow create: if signedIn();
      }
      match /interests/{id} {
        // আবেদন শুধু আবেদনকারী ও পোস্টের মালিক দেখবে
        allow read: if isOwner(resource.data.userId)
                    || isOwner(resource.data.petOwnerId) || isAdmin();
        allow create: if isOwner(request.resource.data.userId);
      }
    }

    match /conversations/{id} {
      allow read:   if signedIn() && request.auth.uid in resource.data.participants;
      allow create: if signedIn() && request.auth.uid in request.resource.data.participants;
      allow update: if signedIn() && request.auth.uid in resource.data.participants;
    }

    match /organizations/{id} {
      allow read: if resource.data.verified == true || isAdmin();
      allow create: if isOwner(request.resource.data.userId)
                    && request.resource.data.verified == false;
      allow update: if isAdmin()
                    || (isOwner(resource.data.userId)
                        && request.resource.data.verified == resource.data.verified);
    }

    match /clinics/{id}  { allow read: if true; allow write: if isAdmin(); }
    match /stories/{id}  { allow read: if true; allow create: if signedIn(); }
    match /matches/{id}  { allow read: if signedIn(); allow write: if false; }  // শুধু Function লিখবে
  }
}
```

**Storage Rules:**
```js
service firebase.storage {
  match /b/{bucket}/o {
    match /pets/{uid}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth.uid == uid
                   && request.resource.size < 3 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

**অ্যাডমিন রোল** custom claim দিয়ে, Firestore ফিল্ড দিয়ে নয় — claim টোকেনে থাকে, তাই Rules-এ চেক করতে অতিরিক্ত রিড লাগে না:
```ts
await admin.auth().setCustomUserClaims(uid, { admin: true });
```

---

## ৫. ছবি — Cloud Storage

```ts
// আপলোডের আগে ব্রাউজারেই রিসাইজ — EXIF/GPS মুছে যায়, স্টোরেজ কয়েকগুণ বাঁচে
async function shrink(file: File, max = 1600, q = 0.8): Promise<Blob> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = img.width * scale; c.height = img.height * scale;
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(b => res(b!), 'image/jpeg', q));
}

const blob = await shrink(file);
const path = `pets/${uid}/${petId}/${crypto.randomUUID()}.jpg`;
await uploadBytes(ref(storage, path), blob);
const url = await getDownloadURL(ref(storage, path));
```

- ফ্রি টিয়ারে ১ GiB — রিসাইজ করলে (~২০০KB/ছবি) প্রায় ৫,০০০ ছবি
- থাম্বনেইলের জন্য **Resize Images** এক্সটেনশন ইনস্টল করে নিন — আপলোড হলেই ছোট সংস্করণ বানিয়ে দেয়
- পোস্ট ডিলিট হলে ছবিও মুছুন (Function দিয়ে), নাহলে অকারণে স্টোরেজ ভরবে

---

## ৬. জিও সার্চ — geohash

Firestore-এ সরাসরি "X কিমির মধ্যে" কোয়েরি নেই, কিন্তু অফিসিয়াল `geofire-common` লাইব্রেরি এটা সহজ করে দেয়:

```ts
import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';

// লেখার সময়
const geohash = geohashForLocation([lat, lng]);   // পোস্টের সাথে সেভ

// পড়ার সময়
const bounds = geohashQueryBounds([centerLat, centerLng], radiusKm * 1000);
const snaps = await Promise.all(bounds.map(b =>
  getDocs(query(collection(db, 'pets'),
    where('isApproved','==',true), where('status','==','open'),
    orderBy('geohash'), startAt(b[0]), endAt(b[1])))
));

const results = snaps.flatMap(s => s.docs)
  .map(d => ({ id: d.id, ...d.data() }))
  .map(p => ({ ...p, dist: distanceBetween([p.lat, p.lng], [centerLat, centerLng]) }))
  .filter(p => p.dist <= radiusKm)
  .sort((a, b) => a.dist - b.dist);
```

geohash কোয়েরি কিছু বাড়তি ফলাফল আনে (বক্স গোল নয়), তাই ক্লায়েন্টে সঠিক দূরত্ব দিয়ে আবার ছেঁকে নিতে হয় — উপরের কোডে সেটাই হচ্ছে।

**সাবধান:** geohash রেঞ্জ কোয়েরির সাথে অন্য `where` মেশালে composite index লাগবে। Firestore কনসোলে এরর মেসেজে সরাসরি ইনডেক্স বানানোর লিংক দেয়, ওটাতে ক্লিক করলেই হয়ে যায়।

---

## ৭. ছবি ম্যাচিং

```ts
// functions/src/index.ts
export const onPetCreated = onDocumentCreated('pets/{petId}', async (event) => {
  const pet = event.data!.data();
  if (!pet.images?.length) return;

  // ১. embedding তৈরি (Replicate / HuggingFace Inference API)
  const embedding = await getCLIPEmbedding(pet.images[0].url);
  await event.data!.ref.update({ embedding });

  if (pet.type !== 'lost') return;

  // ২. একই প্রজাতির খোলা found পোস্ট, একই জিও-বক্সে
  const candidates = await fetchNearbyOpposite(pet, 15 /* km */);

  // ৩. স্কোর — প্রোটোটাইপের একই ওয়েট
  const scored = candidates.map(c => {
    const parts = {
      visual: Math.max(0, cosine(embedding, c.embedding)) * 0.50,
      dist:   Math.max(0, 1 - distanceKm(pet, c) / 15) * 0.25,
      traits: traitScore(pet, c) * 0.15,
      time:   Math.max(0, 1 - dayGap(pet, c) / 30) * 0.10,
    };
    return { c, parts, total: Object.values(parts).reduce((a, b) => a + b, 0) };
  }).filter(m => m.total >= 0.45).sort((a, b) => b.total - a.total).slice(0, 10);

  // ৪. সেভ + কাউন্টার + ইমেইল
  const fs = getFirestore();
  const batch = fs.batch();
  scored.forEach(m => batch.set(fs.collection('matches').doc(), {
    lostPetId: event.params.petId, foundPetId: m.c.id,
    score: m.total, parts: m.parts, dismissed: false,
    createdAt: FieldValue.serverTimestamp(),
  }));
  batch.update(event.data!.ref, { matchCount: FieldValue.increment(scored.length) });
  await batch.commit();

  if (scored.length) await sendMatchEmail(pet.userId, scored.length, scored[0].total);
});
```

**খরচ:** Cloud Functions Spark প্ল্যানে মাসে ২০ লাখ invocation ফ্রি — এই কাজের জন্য যথেষ্ট। শুধু embedding API-র নিজস্ব খরচ থাকবে (প্রতি ছবিতে নগণ্য)।

**স্কোর সম্ভাবনা দেখায়, নিশ্চয়তা নয়** — প্রোটোটাইপের মতোই চূড়ান্ত সিদ্ধান্ত মানুষের হাতে রাখুন। দুটো বাদামি দেশি কুকুর সবসময়ই কাছাকাছি স্কোর পাবে।

---

## ৮. ইউজার ড্যাশবোর্ড

`pawtro-dashboard.html`-এর UI অপরিবর্তিত রেখে ডেটা এখান থেকে আসবে:

```ts
const uid = auth.currentUser!.uid;

// আমার পোস্ট — কাউন্টার ফিল্ড থাকায় একবারেই সব সংখ্যা চলে আসে
const myPets = await getDocs(query(collection(db, 'pets'),
  where('userId','==',uid), orderBy('createdAt','desc')));

// দত্তক আবেদন — collectionGroup দিয়ে সব পোস্টের interests একসাথে
const apps = await getDocs(query(collectionGroup(db, 'interests'),
  where('petOwnerId','==',uid), orderBy('createdAt','desc')));
```

`interests` ডকুমেন্টে `petOwnerId` ফিল্ডটা লেখার সময়ই বসিয়ে দিন — নাহলে প্রতিটা আবেদনের জন্য আলাদা করে পোস্ট পড়তে হবে, আর রিড কোটা নষ্ট হবে। `collectionGroup` কোয়েরির জন্য একটা ইনডেক্স লাগবে।

---

## ৯. মেসেজিং

- এক থ্রেড = এক ডকুমেন্ট, মেসেজগুলো array-তে (সেকশন ৩ দ্রষ্টব্য)
- `arrayUnion()` দিয়ে নতুন মেসেজ যোগ, `onSnapshot()` দিয়ে রিয়েল-টাইম আপডেট
- **প্রথম যোগাযোগ সবসময় ইন-অ্যাপ, ফোন নম্বর ছাড়া** — এতে স্ক্যামের প্রধান পথ (সরাসরি কল করে টাকা চাওয়া) বন্ধ থাকে
- দুজনে কথা বলার পর কেউ চাইলে নিজে নম্বর শেয়ার করে WhatsApp-এ যেতে পারবে — তাতে লম্বা কথোপকথন আপনার ডেটাবেসেও জমে না

---

## ১০. নোটিফিকেশন

| ট্রিগার | চ্যানেল | কখন |
|---|---|---|
| নতুন ম্যাচ | ইমেইল + FCM | সাথে সাথে |
| নতুন সাইটিং | ইমেইল + FCM | সাথে সাথে |
| এলাকায় নতুন পোস্ট | ইমেইল | দিনে একবার ডাইজেস্ট |
| পোস্ট ৭ দিন পুরোনো | ইমেইল | রিমাইন্ডার |

- **ইমেইল:** Resend (ফ্রি ৩,০০০/মাস), Cloud Function থেকে
- **পুশ:** FCM — Firebase-এ বিল্ট-ইন ও সম্পূর্ণ ফ্রি, আলাদা সার্ভিস লাগে না
- **শিডিউল:** `onSchedule('every day 09:00')`; Spark-এ Cloud Scheduler সীমিত হলে Vercel Cron ব্যবহার করুন
- প্রতিটা ইমেইলে আনসাবস্ক্রাইব লিংক, আর `users.notifPrefs` মেনে চলা

---

## ১১. মডারেশন ও ভেরিফিকেশন

- নতুন পোস্ট `isApproved: false` — Rules-এ ইউজার নিজে এটা বদলাতে পারে না
- **ভেরিফায়েড রেসকিউ টিম:** `organizations` ডকুমেন্ট `verified: false` অবস্থায় তৈরি হয়, শুধু admin claim থাকা ইউজার `true` করতে পারে। যাচাই হলে সংস্থার পোস্টে ব্যাজ দেখাবে (প্রোটোটাইপে `p.org` চেক যেভাবে হচ্ছে)
- **ভেট ক্লিনিক:** `clinics` কালেকশন, শুধু admin লিখতে পারবে। বছরে ১-২ বার তথ্য যাচাই করলেই চলে
- `reportCount` ৩+ হলে Function দিয়ে `isApproved: false` করে রিভিউ কিউতে পাঠান
- ভেরিফিকেশন একবার দিয়ে ভুলে যাবেন না — সমস্যা হলে ফিরিয়ে নেওয়ার প্রক্রিয়াও রাখুন
- **রেট লিমিট:** Function-এ চেক করুন এক ইউজার দিনে ৫টার বেশি পোস্ট বা ২০টার বেশি কমেন্ট করছে কিনা

---

## ১২. প্রাইভেসি

- **ফোন নম্বর কখনো পাবলিক নয়** — `users` ডকুমেন্ট Rules দিয়ে বন্ধ, শুধু নিজে ও admin পড়তে পারে
- **লোকেশন ঝাপসা করুন** — পাবলিক ম্যাপে ~২০০ মিটার র‍্যান্ডম অফসেট দেখান, আসল স্থানাঙ্ক শুধু ম্যাচিং হিসাবে ব্যবহার হবে
- ছবি রিসাইজে EXIF/GPS এমনিতেই মুছে যায়
- সমাধান হওয়া পোস্ট ৯০ দিন পর `archived`, ছবি মুছে স্টোরেজ খালি
- **অ্যাকাউন্ট ডিলিট** — ড্যাশবোর্ডে বাটন আছে; Function দিয়ে সব পোস্ট, ছবি, কমেন্ট মুছে তারপর Auth অ্যাকাউন্ট ডিলিট

---

## ১৩. ফ্রি টিয়ার — কতদূর যাবে

**Spark প্ল্যান (ফ্রি):**

| সেবা | সীমা |
|---|---|
| Firestore | দিনে ৫০,০০০ রিড, ২০,০০০ রাইট, ২০,০০০ ডিলিট; ১ GiB স্টোরেজ |
| Auth | ৫০,০০০ MAU (ইমেইল ও সোশ্যাল) |
| Cloud Storage | ১ GiB, মাসে ১০ GiB ডাউনলোড |
| Cloud Functions | মাসে ২০ লাখ invocation |
| FCM পুশ | সীমাহীন, ফ্রি |
| Hosting | ১ GiB স্টোরেজ, মাসে ১০ GiB ট্রান্সফার |

**দৈনিক ৫০,০০০ রিড মানে বাস্তবে কী:** ফিডে ২০টা পোস্ট দেখালে = ২০ রিড। মানে দিনে ~২,৫০০ বার ফিড ব্রাউজিং। প্রতিদিন রিসেট হয়, তাই জমে না — এটাই ডকুমেন্ট-সীমাভিত্তিক সার্ভিসের চেয়ে বড় সুবিধা।

**রিড বাঁচানোর তিনটা নিয়ম:**
1. কাউন্টার ফিল্ড ব্যবহার করুন, বারবার `.count()` কোয়েরি নয়
2. পেজিনেশন — `limit(20)` + `startAfter()`, একবারে সব নয়
3. `onSnapshot` শুধু যেখানে সত্যিই রিয়েল-টাইম দরকার (মেসেজ থ্রেড), ফিডে নয় — লিসেনার প্রতিবার আপডেটে রিড খরচ করে

**ফোন OTP বাদ দিন** — Spark-এ নেই, Blaze লাগে, আর SMS প্রতি $0.01–0.06।

**যখন Blaze-এ যেতে হবে:** Blaze-এ Spark-এর ফ্রি কোটা বজায় থাকে, শুধু তার উপরে গেলে বিল হয়। বিলিং অ্যালার্ট (যেমন $5) সেট করে রাখুন যাতে হঠাৎ খরচ বেড়ে না যায়।

---

## ১৪. যা তালিকায় ছিল না কিন্তু দরকার

| আইটেম | কেন | কখন |
|---|---|---|
| **App Check** | Firebase-এর নিজস্ব সুরক্ষা — শুধু আপনার আসল অ্যাপ থেকে আসা রিকোয়েস্ট গ্রহণ করবে, বট/স্ক্রিপ্ট আটকাবে | লঞ্চের আগে |
| **বিলিং অ্যালার্ট** | Blaze-এ গেলে হঠাৎ খরচ বেড়ে যাওয়া ঠেকাতে | Blaze-এ যাওয়ার দিন |
| **টার্মস ও প্রাইভেসি পলিসি** | ফোন, লোকেশন, ছবি জমা হচ্ছে | লঞ্চের আগে |
| **কমিউনিটি গাইডলাইন** | রিপোর্ট মডারেশনে সিদ্ধান্ত নেওয়ার ভিত্তি | লঞ্চের আগে |
| **এরর মনিটরিং** | Crashlytics/Sentry — Rules বা Function ভাঙলে জানার উপায় | লঞ্চের আগে |
| **বাংলা/English টগল** | শহুরে অনেক ইউজার ইংরেজিতে স্বচ্ছন্দ | লঞ্চের পরপর |
| **SEO পেজ** (`/p/[id]`, sitemap, OG ইমেজ) | QR স্ক্যানে সঠিক পেজ, ফেসবুক শেয়ারে ছবিসহ প্রিভিউ | লঞ্চের পরপর |
| **ডেটা ব্যাকআপ** | Firestore export নিয়মিত করা | লঞ্চের পরপর |
| **লঞ্চ/সিডিং** | খালি সাইট কেউ ব্যবহার করে না — স্থানীয় পেট রেসকিউ ফেসবুক গ্রুপে যোগাযোগ করে প্রথম ৩০–৪০টা পোস্ট নিজে ভরে রাখা | লঞ্চের দিন |

---

## ১৫. কাজের ক্রম

1. Firebase প্রজেক্ট তৈরি, Auth (Email + Google) চালু
2. Firestore + Storage Rules লেখা ও ডিপ্লয় — **এই ধাপেই দুটো অ্যাকাউন্ট দিয়ে ক্রস-টেস্ট**
3. `users` ডকুমেন্ট + প্রোফাইল পেজ
4. পোস্ট CRUD + ছবি আপলোড (রিসাইজসহ)
5. ফিড, ফিল্টার, geohash জিও সার্চ + composite index
6. ইউজার ড্যাশবোর্ড (`pawtro-dashboard.html`-এর UI বসিয়ে)
7. Cloud Function: embedding + ম্যাচিং
8. সাইটিং, কমেন্ট, রিপোর্ট, দত্তক আবেদন
9. মেসেজিং
10. ইমেইল নোটিফিকেশন + FCM + শিডিউল
11. অ্যাডমিন পেজ + custom claims + সংস্থা ভেরিফিকেশন
12. App Check, নীতিমালা পেজ, এরর মনিটরিং
13. SEO পেজ + OG ইমেজ
14. সিডিং ও লঞ্চ

**ধাপ ২-এর টেস্টটা স্কিপ করবেন না।** Firebase Emulator Suite (`firebase emulators:start`) দিয়ে লোকালি Rules টেস্ট করা যায়, এমনকি অটোমেটেড টেস্টও লেখা যায় — এটাই এই স্ট্যাকের সবচেয়ে বড় সুবিধা, কাজে লাগান। দুটো টেস্ট অ্যাকাউন্ট বানিয়ে দেখুন একজন আরেকজনের পোস্ট এডিট করতে বা ফোন নম্বর পড়তে পারে কিনা।
