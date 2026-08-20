'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  fallbackUrl?: string;
  className?: string;
  variant?: 'default' | 'subtle' | 'ghost' | 'floating';
}

export default function BackButton({
  label = 'ফিরে যান',
  fallbackUrl = '/',
  className = '',
  variant = 'default',
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  const variantClasses = {
    default:
      'bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-700 border border-stone-200 shadow-xs',
    subtle:
      'bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700 border-transparent',
    ghost:
      'bg-transparent hover:bg-stone-100 active:bg-stone-200 text-stone-600 hover:text-stone-900 border-transparent',
    floating:
      'bg-white/90 backdrop-blur-md hover:bg-white text-stone-800 border border-stone-200/80 shadow-md',
  }[variant];

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 group cursor-pointer shrink-0 select-none ${variantClasses} ${className}`}
      aria-label={label}
      title={label}
    >
      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
      <span>{label}</span>
    </button>
  );
}
