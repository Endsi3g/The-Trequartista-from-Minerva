'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BonsaiPlantLoader } from '@/components/ui/bonsai-plant-loader';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaChecked, setIsCaptchaChecked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  const handleGoogleSso = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/overview`,
          queryParams: { hd: 'minervaflow.com' },
        },
      });
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
    } catch {
      setErrorMsg('Erreur lors de l’initialisation Google SSO.');
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const normalizedEmail = email.trim().toLowerCase();
    const domain = normalizedEmail.split('@')[1];
    const ALLOWED_EXPLICIT = ['kbelceus776@gmail.com', 'theminervabrand@gmail.com'];
    const isAllowedDomain = domain === 'minervaflow.com' || domain === 'minerva.com';
    const isExplicitAllowed = ALLOWED_EXPLICIT.includes(normalizedEmail);

    if (!isAllowedDomain && !isExplicitAllowed) {
      setErrorMsg('Accès restreint aux adresses @minervaflow.com, @minerva.com ou autorisées');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName || normalizedEmail.split('@')[0],
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setSuccessMsg('Compte créé avec succès. Redirection...');
      setTimeout(() => {
        window.location.href = '/overview';
      }, 800);
    } catch {
      setErrorMsg('Erreur de création de compte.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-mv-border rounded-[16px] shadow-mv-md p-6 sm:p-8 max-w-[460px] w-full relative overflow-hidden">
      {/* Loading Overlay from Image 1 */}
      {loading && (
        <BonsaiPlantLoader
          title="Hold tight!"
          subtitle="Your account is being planted..."
        />
      )}

      <h1 className="text-2xl font-extrabold text-mv-ink text-center tracking-tight font-display mb-6">
        Create your free account
      </h1>

      {/* Google SSO Button */}
      <button
        type="button"
        onClick={handleGoogleSso}
        className="w-full py-2.5 px-4 bg-white border border-mv-border rounded-xl text-sm font-semibold text-mv-ink hover:bg-mv-surface transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-mv-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            fill="#EA4335"
          />
        </svg>
        Sign up with Google
      </button>

      {/* Or Divider */}
      <div className="relative my-5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-mv-border" />
        </div>
        <span className="relative bg-white px-3 text-xs font-semibold text-mv-ink-soft uppercase tracking-wider">
          or
        </span>
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-mv-green-tint border border-mv-green/30 text-mv-green text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSignup} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-1 text-left">
          <label htmlFor="email" className="block text-xs font-bold text-mv-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="jdoe.mobbin@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-white border border-mv-border rounded-xl text-sm text-mv-ink placeholder-mv-ink-mute focus:outline-none focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green transition-all"
          />
        </div>

        {/* Full Name Input */}
        <div className="space-y-1 text-left">
          <label htmlFor="fullName" className="block text-xs font-bold text-mv-ink">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-mv-border rounded-xl text-sm text-mv-ink placeholder-mv-ink-mute focus:outline-none focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green transition-all"
          />
        </div>

        {/* Password Input */}
        <div className="space-y-1 text-left">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-bold text-mv-ink">
              Password
            </label>
            <span className="text-[11px] font-semibold text-mv-green">Strong</span>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={10}
              className="w-full px-3.5 py-2.5 pr-10 bg-white border border-mv-border rounded-xl text-sm text-mv-ink placeholder-mv-ink-mute focus:outline-none focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mv-ink-soft hover:text-mv-ink cursor-pointer p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-mv-ink-soft mt-1">
            Your password must be at least 10 characters
          </p>
        </div>

        {/* reCAPTCHA Mock Box */}
        <div className="p-3 bg-[#f9f9f9] border border-[#d3d3d3] rounded-md flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-mv-ink">
            <input
              type="checkbox"
              checked={isCaptchaChecked}
              onChange={(e) => setIsCaptchaChecked(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-mv-green focus:ring-mv-green"
            />
            <span>I&apos;m not a robot</span>
          </label>
          <div className="flex flex-col items-center text-[9px] text-mv-ink-soft">
            <Image src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" width={24} height={24} />
            <span>reCAPTCHA</span>
          </div>
        </div>

        {/* Terms Disclaimer */}
        <p className="text-[11px] text-mv-ink-soft text-center pt-1">
          By creating an account, you accept our{' '}
          <a href="#" className="font-bold underline text-mv-ink hover:text-mv-green">
            terms and conditions
          </a>
        </p>

        {/* Primary CTA Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-[#00a800] hover:bg-[#009000] text-white font-bold text-sm rounded-xl shadow-mv-sm transition-all cursor-pointer disabled:opacity-50 mt-2"
        >
          {loading ? 'Creating Account...' : 'Create Free Account'}
        </button>
      </form>
    </div>
  );
}
