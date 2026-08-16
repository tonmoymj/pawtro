export type PetType = 'lost' | 'found' | 'adoption';
export type Species = 'cat' | 'dog' | 'bird' | 'other';
export type Sex = 'male' | 'female' | 'unknown';
export type PetStatus = 'active' | 'resolved' | 'closed';

export interface PetImage {
  path: string;
  url: string;
}

export interface Pet {
  id?: string;
  userId: string;
  orgId?: string;
  type: PetType;
  species: Species;
  petName?: string;
  breed?: string;
  colors: string[];
  sex: Sex;
  age?: string;
  marks?: string;
  description: string;
  images: PetImage[];
  division: string;
  area: string;
  lat: number;
  lng: number;
  geohash: string;
  eventDate: string;
  status: PetStatus;
  isApproved: boolean;
  reportCount?: number;
  matchCount?: number;
  sightingCount?: number;
  commentCount?: number;
  viewCount?: number;
  contactPhone?: string;
  createdAt: any;
  updatedAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  division?: string;
  photoURL?: string;
  role?: 'user' | 'volunteer' | 'admin' | 'superadmin';
  notifPrefs?: {
    match: boolean;
    sight: boolean;
    digest: boolean;
    remind: boolean;
  };
  createdAt?: any;
}

export interface Comment {
  id?: string;
  petId: string;
  userId: string;
  author: string;
  text: string;
  createdAt: any;
}

export interface Sighting {
  id?: string;
  petId: string;
  userId: string;
  lat: number;
  lng: number;
  area: string;
  note: string;
  date: string;
  imageUrl?: string;
  createdAt: any;
}

export interface Clinic {
  id?: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  hours: string;
  division: string;
}

export interface RescueOrganization {
  id?: string;
  userId: string;
  name: string;
  area: string;
  description: string;
  phone: string;
  verified: boolean;
}
