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
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-[#101B18] text-[#EAEFEC] border-b border-[#1D2C27] px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-[#1D6B5F] flex items-center justify-center text-white text-base">
            🐾
          </div>
          <div>
            <div className="font-bold text-[14px] text-white tracking-tight leading-none">Pawtro</div>
            <div className="text-[9px] text-[#6EBFA9] font-mono uppercase tracking-widest mt-0.5">Admin Panel</div>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-[#8FA79E] hover:text-white hover:bg-[#182722] transition-colors"
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

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-auto h-screen w-64 shrink-0 bg-[#101B18] text-[#EAEFEC] flex flex-col justify-between border-r border-[#1D2C27] transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {/* Top Header inside Sidebar */}
        <div>
          {/* Desktop Brand Logo */}
          <div className="hidden md:flex px-5 py-5 border-b border-[#1D2C27] items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#1D6B5F] flex items-center justify-center text-white text-base shadow-sm">
              🐾
            </div>
            <div>
              <div className="font-bold text-[15px] text-white tracking-tight">Pawtro</div>
              <div className="text-[10px] text-[#6EBFA9] font-mono uppercase tracking-wider">
                Admin Panel
              </div>
            </div>
          </div>

          {/* Mobile Drawer Header */}
          <div className="md:hidden px-4 py-4 border-b border-[#1D2C27] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#1D6B5F] flex items-center justify-center text-white text-xs">🐾</div>
              <span className="font-bold text-white text-sm">অ্যাডমিন মেনু</span>
            </div>
            <button onClick={() => setMobileOpen(false)} className="text-[#8FA79E] p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Vertical Navigation Menu (Top to Bottom) */}
          <div className="px-3 py-4">
            <nav 
              className="w-full"
              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-[13.5px] font-medium transition-all ${
                      isActive
                        ? 'bg-[#1D6B5F] text-white font-bold shadow-sm'
                        : 'text-[#8FA79E] hover:bg-[#182722] hover:text-white'
                    }`}
                    style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#A5E3D5] shrink-0" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-4 py-5 border-t border-[#1D2C27] flex flex-col gap-2.5">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 text-[#8FA79E] hover:text-white text-[13px] transition-colors py-1 px-2 rounded-lg hover:bg-[#182722]"
          >
            <ShieldCheck className="w-4 h-4 text-[#6EBFA9]" />
            <span>ইউজার ড্যাশবোর্ড</span>
          </Link>
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 text-[#8FA79E] hover:text-white text-[13px] transition-colors py-1 px-2 rounded-lg hover:bg-[#182722]"
          >
            <PawPrint className="w-4 h-4 text-[#8FA79E]" />
            <span>মূল ওয়েবসাইটে যান</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
