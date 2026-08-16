'use client';

import React, { useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'কমান্ড সেন্টার', icon: LayoutDashboard },
  { href: '/admin/posts', label: 'পোস্ট মডারেশন', icon: FileText },
  { href: '/admin/users', label: 'ইউজার ও রোল', icon: Users },
  { href: '/admin/organizations', label: 'রেসকিউ টিম ও ক্লিনিক', icon: Building2 },
  { href: '/admin/alerts', label: 'ব্রডকাস্ট অ্যালার্ট', icon: Megaphone },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-[#101B18] text-[#EAEFEC] border-b border-[#1D2C27] px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[5px] bg-[#1D6B5F] flex items-center justify-center text-white text-base">
            🐾
          </div>
          <div>
            <div className="font-bold text-[14px] text-white tracking-tight leading-none">Pawtro</div>
            <div className="text-[9px] text-[#6EBFA9] font-mono uppercase tracking-widest mt-0.5">Admin Panel</div>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-[#8FA79E] hover:text-white hover:bg-[#182722]"
          aria-label="মেনু খুলুন"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
        />
      )}

      {/* Sidebar (Desktop sticky + Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-auto h-screen w-64 md:w-56 shrink-0 bg-[#101B18] text-[#EAEFEC] flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo (Desktop) */}
        <div className="hidden md:flex px-4 py-4 border-b border-[#1D2C27] items-center gap-2.5">
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

        {/* Mobile Header in Drawer */}
        <div className="md:hidden px-4 py-4 border-b border-[#1D2C27] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#1D6B5F] flex items-center justify-center text-white text-xs">🐾</div>
            <span className="font-bold text-white text-sm">অ্যাডমিন মেনু</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-[#8FA79E] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#1D6B5F] text-white shadow-sm'
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
        <div className="px-4 py-4 border-t border-[#1D2C27] space-y-2">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-[#8FA79E] hover:text-[#EAEFEC] text-[12px] transition-colors py-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#6EBFA9]" />
            <span>ইউজার ড্যাশবোর্ড</span>
          </Link>
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-[#8FA79E] hover:text-[#EAEFEC] text-[12px] transition-colors py-1"
          >
            <PawPrint className="w-3.5 h-3.5" />
            <span>মূল ওয়েবসাইটে যান</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
