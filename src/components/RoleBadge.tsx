'use client';

import React from 'react';
import { Shield, ShieldAlert, Award, User, Sparkles } from 'lucide-react';

interface RoleBadgeProps {
  role?: string | null;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export default function RoleBadge({
  role = 'user',
  size = 'sm',
  showIcon = true,
  className = '',
}: RoleBadgeProps) {
  const normalizedRole = role?.toLowerCase() || 'user';

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11.5px] px-2 py-0.5 gap-1.5',
    md: 'text-[13px] px-2.5 py-1 gap-1.5 font-semibold',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  switch (normalizedRole) {
    case 'superadmin':
      return (
        <span
          title="প্ল্যাটফর্ম প্রতিষ্ঠাতা ও সুপার অ্যাডমিন"
          className={`inline-flex items-center rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-sm ${sizeClasses[size]} ${className}`}
        >
          {showIcon && <Sparkles className={`${iconSizes[size]} text-amber-600 shrink-0`} />}
          <span>👑 সুপার অ্যাডমিন</span>
        </span>
      );

    case 'admin':
      return (
        <span
          title="অ্যাডমিনিস্ট্রেটর"
          className={`inline-flex items-center rounded-full font-bold bg-[#F3F5FA] text-[#34446A] border border-[#CAD3E8] shadow-sm ${sizeClasses[size]} ${className}`}
        >
          {showIcon && <Shield className={`${iconSizes[size]} text-[#34446A] shrink-0`} />}
          <span>🛡️ অ্যাডমিন</span>
        </span>
      );

    case 'volunteer':
      return (
        <span
          title="যাচাইকৃত স্বেচ্ছাসেবক / রেসকিউয়ার"
          className={`inline-flex items-center rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm ${sizeClasses[size]} ${className}`}
        >
          {showIcon && <Award className={`${iconSizes[size]} text-emerald-600 shrink-0`} />}
          <span>🦺 ভলান্টিয়ার</span>
        </span>
      );

    default:
      return (
        <span
          title="সাধারণ সদস্য"
          className={`inline-flex items-center rounded-full font-medium bg-stone-100 text-stone-700 border border-stone-200 ${sizeClasses[size]} ${className}`}
        >
          {showIcon && <User className={`${iconSizes[size]} text-stone-500 shrink-0`} />}
          <span>সদস্য</span>
        </span>
      );
  }
}
