'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria'        },
  { code: 'US', name: 'United States'  },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'KE', name: 'Kenya'          },
  { code: 'GH', name: 'Ghana'          },
  { code: 'ZA', name: 'South Africa'   },
];

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-zinc-500 uppercase tracking-wider"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export default function SignupPage() {
  const { handleAuthCallback } = useAuth();
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOAuthLoading] = useState<'google' | 'apple' | null>(null);
  const [showPw, setShowPw]     = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    country: 'NG',
  });

  const pwChecks = [
    { label: '8+ characters', pass: form.password.length >= 8 },
    { label: 'Uppercase',     pass: /[A-Z]/.test(form.password) },
    { label: 'Number',        pass: /\d/.test(form.password) },
  ];
  const strength  = pwChecks.filter((c) => c.pass).length;
  const barColor  =
    strength === 1 ? '#EF4444' : strength === 2 ? '#F59E0B' : '#10B981';

  // ── Email/password sign-up ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          // Pass profile hints via data so the callback can read them
          data: {
            given_name:  form.firstName,
            family_name: form.lastName,
            phone:       form.phone || undefined,
            country:     form.country,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // If Supabase requires email confirmation, the session will be null
      // until the user clicks the link. If confirmation is disabled, we get
      // a session immediately.
      if (data.session) {
        await handleAuthCallback(data.session.access_token);
        toast.success('Account created!');
      } else {
        // Email confirmation flow — Supabase sends a magic link
        toast.success('Check your email to confirm your account.');
      }
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // ── OAuth sign-up ──────────────────────────────────────────────────────────
  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOAuthLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setOAuthLoading(null);
      }
    } catch {
      toast.error(`Failed to sign up with ${provider}`);
      setOAuthLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-black font-display text-white tracking-tight mb-2">
          Create an account
        </h1>
        <p className="text-zinc-500 text-sm">
          Already have one?{' '}
          <Link
            href="/auth/login"
            className="text-white font-semibold hover:text-zinc-300 transition-colors underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Social sign-up */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={oauthLoading !== null || loading}
          aria-label="Continue with Google"
          className="h-11 rounded-full border border-white/8 bg-white/[0.02] text-zinc-400 text-sm font-semibold hover:bg-white/4 hover:text-white hover:border-white/15 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {oauthLoading === 'google' ? (
            <Spinner size="sm" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Google
        </button>

        <button
          type="button"
          onClick={() => handleOAuth('apple')}
          disabled={oauthLoading !== null || loading}
          aria-label="Continue with Apple"
          className="h-11 rounded-full border border-white/8 bg-white/[0.02] text-zinc-400 text-sm font-semibold hover:bg-white/4 hover:text-white hover:border-white/15 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {oauthLoading === 'apple' ? (
            <Spinner size="sm" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
          )}
          Apple
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-white/6" />
        <span className="text-zinc-700 text-xs font-medium">or continue with email</span>
        <div className="flex-1 h-px bg-white/6" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" id="signup-firstname">
            <input
              id="signup-firstname"
              type="text"
              required
              className="input"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="John"
              autoComplete="given-name"
            />
          </Field>
          <Field label="Last name" id="signup-lastname">
            <input
              id="signup-lastname"
              type="text"
              required
              className="input"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder="Doe"
              autoComplete="family-name"
            />
          </Field>
        </div>

        <Field label="Email" id="signup-email">
          <input
            id="signup-email"
            type="email"
            required
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Phone (optional)" id="signup-phone">
          <input
            id="signup-phone"
            type="tel"
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+234 000 000 0000"
            autoComplete="tel"
          />
        </Field>

        <Field label="Country" id="signup-country">
          <select
            id="signup-country"
            className="input cursor-pointer"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Password" id="signup-password">
          <div className="relative">
            <input
              id="signup-password"
              type={showPw ? 'text' : 'password'}
              required
              minLength={8}
              className="input pr-10"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength indicator */}
          {form.password.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2 mt-1"
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-0.5 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background: i < strength ? barColor : 'rgba(255,255,255,0.1)',
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-4 flex-wrap">
                {pwChecks.map(({ label, pass }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs">
                    <Check
                      className={cn(
                        'w-3 h-3 transition-colors',
                        pass ? 'text-white' : 'text-zinc-700'
                      )}
                    />
                    <span className={pass ? 'text-zinc-400' : 'text-zinc-700'}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </Field>

        <button
          type="submit"
          disabled={loading || oauthLoading !== null}
          id="signup-submit"
          className="btn-primary w-full h-11 mt-1 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
          style={{ borderRadius: 9999 }}
        >
          {loading ? (
            <>
              <Spinner size="sm" /> Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        <p className="text-xs text-zinc-700 text-center">
          By signing up you agree to our{' '}
          <Link
            href="/legal/terms"
            className="text-zinc-500 hover:text-white transition-colors underline underline-offset-2"
          >
            Terms
          </Link>{' '}
          and{' '}
          <Link
            href="/legal/privacy"
            className="text-zinc-500 hover:text-white transition-colors underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </motion.div>
  );
}
