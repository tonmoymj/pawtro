'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  KeyRound,
  ArrowLeft,
  Check
} from 'lucide-react';
import { verifyRecaptcha } from '@/lib/recaptcha';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const signInWithGoogle = auth?.signInWithGoogle;
  const signInWithEmail = auth?.signInWithEmail;
  const signUpWithEmail = auth?.signUpWithEmail;
  const resetPassword = auth?.resetPassword;
  
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Password Security Rules Calculation
  const securityRules = useMemo(() => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
    
    let score = 0;
    if (minLength) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    let label = 'খুব দুর্বল';
    let color = 'bg-rose-500';
    let textColor = 'text-rose-600';
    let widthPercent = (score / 5) * 100;

    if (score <= 1) {
      label = 'খুব দুর্বল';
      color = 'bg-rose-500';
      textColor = 'text-rose-600';
    } else if (score === 2) {
      label = 'দুর্বল';
      color = 'bg-orange-500';
      textColor = 'text-orange-600';
    } else if (score === 3) {
      label = 'মোটামুটি';
      color = 'bg-amber-500';
      textColor = 'text-amber-600';
    } else if (score === 4) {
      label = 'শক্তিশালী';
      color = 'bg-teal-500';
      textColor = 'text-teal-600';
    } else if (score === 5) {
      label = 'অত্যন্ত শক্তিশালী 🛡️';
      color = 'bg-emerald-500';
      textColor = 'text-emerald-600';
    }

    const isSecure = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

    return {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      score,
      label,
      color,
      textColor,
      widthPercent,
      isSecure
    };
  }, [password]);

  const mapFirebaseError = (errCode: string, defaultMsg: string) => {
    if (errCode.includes('auth/invalid-credential') || errCode.includes('auth/wrong-password') || errCode.includes('auth/user-not-found')) {
      return 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। দয়া করে আবার চেষ্টা করুন।';
    }
    if (errCode.includes('auth/email-already-in-use')) {
      return 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে। দয়া করে লগইন করুন।';
    }
    if (errCode.includes('auth/weak-password')) {
      return 'পাসওয়ার্ডটি খুব দুর্বল। কমপক্ষে ৮ অক্ষরের শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।';
    }
    if (errCode.includes('auth/too-many-requests')) {
      return 'অতিরিক্ত ভুল চেষ্টার কারণে একাউন্ট সাময়িকভাবে লক হয়েছে। কিছুক্ষণ পর চেষ্টা করুন বা পাসওয়ার্ড রিসেট করুন।';
    }
    if (errCode.includes('auth/popup-closed-by-user')) {
      return 'গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছে।';
    }
    if (errCode.includes('auth/network-request-failed')) {
      return 'ইন্টারনেট সংযোগে সমস্যা হয়েছে। দয়া করে সংযোগ পরীক্ষা করুন।';
    }
    return defaultMsg;
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const isHuman = await verifyRecaptcha('google_login');
      if (!isHuman) {
        throw new Error('নিরাপত্তা যাচাইকরণ ব্যর্থ হয়েছে (Bot Detected)। দয়া করে আবার চেষ্টা করুন।');
      }

      await signInWithGoogle?.();
      router.push('/');
    } catch (err: any) {
      setError(mapFirebaseError(err?.code || '', err.message || 'গুগল লগইন ব্যর্থ হয়েছে।'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (!email.trim()) throw new Error('দয়া করে আপনার ইমেইল ঠিকানা লিখুন');

      const isHuman = await verifyRecaptcha('forgot_password');
      if (!isHuman) {
        throw new Error('নিরাপত্তা যাচাইকরণ ব্যর্থ হয়েছে (Bot Detected)। দয়া করে আবার চেষ্টা করুন।');
      }

      await resetPassword?.(email.trim());
      setSuccessMsg('আপনার ইমেইলে একটি পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। ইনবক্স ও স্প্যাম ফোল্ডার চেক করুন।');
    } catch (err: any) {
      setError(mapFirebaseError(err?.code || '', err.message || 'পাসওয়ার্ড রিসেট লিংক পাঠাতে সমস্যা হয়েছে।'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const action = mode === 'signup' ? 'signup' : 'login';
      const isHuman = await verifyRecaptcha(action);
      if (!isHuman) {
        throw new Error('নিরাপত্তা যাচাইকরণ ব্যর্থ হয়েছে (Bot Detected)। দয়া করে আবার চেষ্টা করুন।');
      }

      if (mode === 'signup') {
        if (!name.trim()) throw new Error('দয়া করে আপনার নাম লিখুন');
        
        // Strict Security Validation
        if (!securityRules.minLength) {
          throw new Error('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।');
        }
        if (!securityRules.hasUppercase) {
          throw new Error('পাসওয়ার্ডে কমপক্ষে একটি বড় হাতের অক্ষর (A-Z) থাকতে হবে।');
        }
        if (!securityRules.hasLowercase) {
          throw new Error('পাসওয়ার্ডে কমপক্ষে একটি ছোট হাতের অক্ষর (a-z) থাকতে হবে।');
        }
        if (!securityRules.hasNumber) {
          throw new Error('পাসওয়ার্ডে কমপক্ষে একটি সংখ্যা (0-9) থাকতে হবে।');
        }
        if (!securityRules.hasSpecial) {
          throw new Error('পাসওয়ার্ডে কমপক্ষে একটি বিশেষ চিহ্ন (!@#$%^&* ইত্যাদি) থাকতে হবে।');
        }
        if (password !== confirmPassword) {
          throw new Error('দুই ঘরের পাসওয়ার্ড মেলেনি। দয়া করে নিশ্চিত করুন।');
        }

        await signUpWithEmail?.(email.trim(), password, name.trim());
      } else {
        await signInWithEmail?.(email.trim(), password);
      }
      router.push('/');
    } catch (err: any) {
      setError(mapFirebaseError(err?.code || '', err.message || 'লগইন বা সাইনআপে সমস্যা হয়েছে।'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white p-7 sm:p-9 rounded-3xl border border-stone-200 shadow-xl">
        
        {/* Top Header */}
        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3 shadow-inner">
            {mode === 'forgot' ? (
              <KeyRound className="w-6 h-6" />
            ) : mode === 'signup' ? (
              <UserPlus className="w-6 h-6" />
            ) : (
              <LogIn className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            {mode === 'forgot'
              ? 'পাসওয়ার্ড রিসেট করুন'
              : mode === 'signup'
              ? 'নতুন নিরাপদ অ্যাকাউন্ট খুলুন'
              : 'লগইন করুন'}
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            {mode === 'forgot'
              ? 'আপনার অ্যাকাউন্টের ইমেইল দিন, আমরা রিসেট লিংক পাঠাব'
              : 'Pawtro প্ল্যাটফর্মে সুরক্ষিতভাবে প্রবেশ করুন'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Mode: Forgot Password Form */}
        {mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">আপনার নিবন্ধিত ইমেইল</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>রিসেট লিংক পাঠান</span>}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-stone-600 hover:text-stone-900 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>লগইনে ফিরে যান</span>
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 font-semibold text-stone-700 text-sm flex items-center justify-center gap-3 transition-colors mb-5 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>গুগল দিয়ে প্রবেশ করুন</span>
            </button>

            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <span className="relative bg-white px-3 text-xs text-stone-400 font-medium">অথবা ইমেইল দিয়ে</span>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">আপনার পুরো নাম</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="যেমন: তানভীর আহমেদ"
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">ইমেইল ঠিকানা</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700">পাসওয়ার্ড</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] text-amber-600 hover:underline font-medium"
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'কমপক্ষে ৮ অক্ষরের শক্তিশালী পাসওয়ার্ড' : 'আপনার পাসওয়ার্ড'}
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Meter & Live Security Checklist on Sign Up */}
              {mode === 'signup' && password.length > 0 && (
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5 text-xs">
                  {/* Strength Bar */}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-600">পাসওয়ার্ডের শক্তি:</span>
                    <span className={`font-bold ${securityRules.textColor}`}>
                      {securityRules.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${securityRules.color} transition-all duration-300`}
                      style={{ width: `${securityRules.widthPercent}%` }}
                    />
                  </div>

                  {/* Requirements Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${securityRules.minLength ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
                      {securityRules.minLength ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-stone-300 ml-1 mr-1" />}
                      <span>কমপক্ষে ৮ অক্ষর</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${securityRules.hasUppercase ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
                      {securityRules.hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-stone-300 ml-1 mr-1" />}
                      <span>বড় হাতের অক্ষর (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${securityRules.hasLowercase ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
                      {securityRules.hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-stone-300 ml-1 mr-1" />}
                      <span>ছোট হাতের অক্ষর (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${securityRules.hasNumber ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
                      {securityRules.hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-stone-300 ml-1 mr-1" />}
                      <span>সংখ্যা (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 col-span-1 sm:col-span-2 ${securityRules.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
                      {securityRules.hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-stone-300 ml-1 mr-1" />}
                      <span>বিশেষ চিহ্ন (!@#$%^&* ইত্যাদি)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password Field for Sign Up */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">পাসওয়ার্ড নিশ্চিত করুন</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="পাসওয়ার্ডটি পুনরায় লিখুন"
                      className={`w-full pl-10 pr-10 py-2.5 bg-stone-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-red-400 focus:ring-red-400'
                          : 'border-stone-200 focus:ring-amber-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                      title={showConfirmPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-[11px] text-red-600 mt-1">পাসওয়ার্ড মিলছে না</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (mode === 'signup' && (!securityRules.isSecure || password !== confirmPassword))}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'signup' ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>নিরাপদ অ্যাকাউন্ট তৈরি করুন</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>লগইন করুন</span>
                  </>
                )}
              </button>
            </form>

            {/* Mode Switcher */}
            <div className="text-center mt-5">
              <button
                onClick={() => {
                  setMode(mode === 'signup' ? 'login' : 'signup');
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-xs sm:text-sm text-amber-600 hover:underline font-semibold"
              >
                {mode === 'signup' ? 'আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন' : 'অ্যাকাউন্ট নেই? সাইনআপ করুন'}
              </button>
            </div>
          </>
        )}

        <div className="mt-7 pt-4 border-t border-stone-100 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
          <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
          <span>reCAPTCHA ও ইন্ডাস্ট্রি-স্ট্যান্ডার্ড সিকিউরিটি দ্বারা সুরক্ষিত</span>
        </div>
      </div>
    </div>
  );
}
