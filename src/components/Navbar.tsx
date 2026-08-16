'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  User, 
  LogOut, 
  Menu, 
  X,
  Search,
  Plus
} from 'lucide-react';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E1E5E2]">
      <div className="max-w-[1500px] mx-auto px-5 h-14 flex items-center gap-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 pr-5 border-r border-[#E1E5E2] h-full">
          <div className="w-[26px] h-[26px] rounded-[5px] bg-[#111614] text-white flex items-center justify-center font-bold text-[15px]">
            🐾
          </div>
          <span className="font-bold text-[17px] tracking-tight text-[#111614]">
            Pawtro
          </span>
        </Link>

        {/* Desktop Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 text-[14px]">
          <Link 
            href="/" 
            className="px-3 py-1.5 rounded-[6px] font-semibold text-[#111614] bg-[#F1F3F1] shadow-[inset_0_-2px_0_#111614]"
          >
            ফিড ও খোঁজ
          </Link>
          <Link 
            href="/adoption" 
            className="px-3 py-1.5 rounded-[6px] font-medium text-[#4F5A55] hover:bg-[#F1F3F1] hover:text-[#111614] transition-colors"
          >
            দত্তক
          </Link>
          <Link 
            href="/clinics" 
            className="px-3 py-1.5 rounded-[6px] font-medium text-[#4F5A55] hover:bg-[#F1F3F1] hover:text-[#111614] transition-colors"
          >
            ভেট ক্লিনিক
          </Link>
          <Link 
            href="/rescue-teams" 
            className="px-3 py-1.5 rounded-[6px] font-medium text-[#4F5A55] hover:bg-[#F1F3F1] hover:text-[#111614] transition-colors"
          >
            রেসকিউ টিম
          </Link>
        </nav>

        {/* Right Action / Post Button */}
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/post-pet"
            className="inline-flex items-center gap-1.5 bg-[#111614] hover:bg-black text-white px-3.5 py-1.5 rounded-[6px] text-[13.5px] font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন পোস্ট</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E1E5E2]">
              {(profile?.role === 'admin' || profile?.role === 'superadmin') && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#1D6B5F] text-white hover:bg-[#15544a] transition-colors text-[12.5px] font-bold"
                >
                  <span>🛡️ অ্যাডমিন</span>
                </Link>
              )}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-2 py-1 rounded-[6px] hover:bg-[#F1F3F1] transition-colors text-[13.5px] font-medium text-[#111614]"
              >
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName || 'Profile'}
                    className="w-6 h-6 rounded-full object-cover border border-[#CDD4D0]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#1D6B5F] text-white flex items-center justify-center text-[11px] font-bold">
                    {profile?.displayName?.slice(0, 1) || 'U'}
                  </div>
                )}
                <span>{profile?.displayName?.split(' ')[0] || 'ড্যাশবোর্ড'}</span>
              </Link>
              <button
                onClick={() => signOut()}
                title="লগআউট"
                className="p-1.5 text-[#8A948F] hover:text-[#9E3B36] hover:bg-[#FBF4F3] rounded-[6px] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-[13.5px] font-medium text-[#111614] border border-[#CDD4D0] hover:bg-[#F1F3F1] transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>লগইন</span>
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-[6px] text-[#4F5A55] hover:bg-[#F1F3F1]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E1E5E2] px-5 py-4 space-y-2 text-[14px]">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-[6px] font-medium text-[#111614] bg-[#F1F3F1]"
          >
            ফিড ও খোঁজ
          </Link>
          <Link
            href="/adoption"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-[6px] font-medium text-[#4F5A55] hover:bg-[#F1F3F1]"
          >
            দত্তক
          </Link>
          <Link
            href="/clinics"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-[6px] font-medium text-[#4F5A55] hover:bg-[#F1F3F1]"
          >
            ভেট ক্লিনিক
          </Link>
          <Link
            href="/rescue-teams"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-[6px] font-medium text-[#4F5A55] hover:bg-[#F1F3F1]"
          >
            রেসকিউ টিম
          </Link>
        </div>
      )}
    </header>
  );
}
