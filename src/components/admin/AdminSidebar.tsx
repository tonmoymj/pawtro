'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  ShieldCheck,
  Building2,
  Megaphone,
  BarChart3,
  PawPrint,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'ওভারভিউ', icon: LayoutDashboard },
  { href: '/admin/posts', label: 'পোস্ট মডারেশন', icon: FileText },
  { href: '/admin/users', label: 'ইউজার ম্যানেজমেন্ট', icon: Users },
  { href: '/admin/organizations', label: 'রেসকিউ টিম / ক্লিনিক', icon: Building2 },
  { href: '/admin/alerts', label: 'ব্রডকাস্ট অ্যালার্ট', icon: Megaphone },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 bg-[#101B18] text-[#EAEFEC] flex flex-col">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#1D2C27] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-[5px] bg-[#1D6B5F] flex items-center justify-center text-white text-base">
          🐾
        </div>
        <div>
          <div className="font-bold text-[14px] text-white tracking-tight">Pawtro</div>
          <div className="text-[10px] text-[#6EBFA9] font-mono uppercase tracking-widest">
            Admin Panel
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-[#1D6B5F] text-white'
                  : 'text-[#8FA79E] hover:bg-[#182722] hover:text-[#EAEFEC]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#1D2C27]">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#8FA79E] hover:text-[#EAEFEC] text-[12px] transition-colors"
        >
          <PawPrint className="w-3.5 h-3.5" />
          <span>সাইটে ফিরে যান</span>
        </Link>
      </div>
    </aside>
  );
}
