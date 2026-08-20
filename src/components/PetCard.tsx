'use client';

import React from 'react';
import Link from 'next/link';
import { Pet } from '@/types';
import { MapPin, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface PetCardProps {
  pet: Pet;
}

export default function PetCard({ pet }: PetCardProps) {
  const typeBadge = {
    lost: { label: 'হারিয়ে গেছে', bg: 'bg-red-500 text-white' },
    found: { label: 'পাওয়া গেছে', bg: 'bg-emerald-600 text-white' },
    adoption: { label: 'দত্তকের জন্য', bg: 'bg-blue-600 text-white' },
  }[pet.type] || { label: 'সাধারণ', bg: 'bg-stone-500 text-white' };

  const firstImage = (typeof pet.images?.[0] === 'string'
    ? pet.images[0]
    : pet.images?.[0]?.url)
    || (pet.species === 'cat'
      ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80');

  return (
    <Link
      href={`/pet/${pet.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-stone-200 hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      {/* Image container */}
      <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
        <img
          src={firstImage}
          alt={pet.petName || pet.species}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${typeBadge.bg}`}>
            {typeBadge.label}
          </span>
          {pet.status === 'resolved' && (
            <span className="bg-stone-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium">
              সমাধান হয়েছে
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-lg text-stone-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
              {pet.petName || (pet.species === 'cat' ? 'বিড়াল' : pet.species === 'dog' ? 'কুকুর' : 'পোষ্য')}
            </h3>
            {pet.breed && (
              <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md font-medium">
                {pet.breed}
              </span>
            )}
          </div>

          <p className="text-stone-600 text-xs sm:text-sm mt-2 line-clamp-2 leading-relaxed">
            {pet.description || 'বিস্তারিত বিবরণ নেই।'}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-[150px]">
              {pet.area || pet.division || 'বাংলাদেশ'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>{formatDate(pet.eventDate || pet.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
