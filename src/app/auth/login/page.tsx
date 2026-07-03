'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';

// Shared field wrapper
function Field({
  label,
  children,
  id,
}: {
  label: string;
  children: React.ReactNode;
  id?: string;
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

export default function LoginPage() {
  const { handleAuthCallback } = useAuth();
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOAuthLoading] = useState<'google' | 'apple' | null>(null);
  const [showPw, setShowPw]     = useState(false);
  const [form, setForm]         = useState({ email: '', password: '' });

  // ── Email/password sign-in ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.session) {
        toast.error('Sign-in failed. Please try again.');
        return;
      }

      // Provision / load the VOPayX internal profile
      await handleAuthCallback(data.session.access_token);
      toast.success('Welcome back!');
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // ── OAuth sign-in ──────────────────────────────────────────────────────────
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
      // On success the browser is redirected — no need to clear state
    } catch {
      toast.error(`Failed to sign in with ${provider}`);
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
          Sign in
        </h1>
        <p className="text-zinc-500 text-sm">
          New here?{' '}
          <Link
            href="/auth/signup"
            className="text-white font-semibold hover:text-zinc-300 transition-colors underline underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email" id="login-email">
          <input
            id="login-email"
            type="email"
            required
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Password" id="login-password">
          <div className="relative">
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              required
              className="input pr-10"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="current-password"
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
          <div className="flex justify-end -mt-0.5">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </Field>

        <button
          type="submit"
          disabled={loading}
          id="login-submit"
          className="btn-primary w-full h-11 mt-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <><Spinner size="sm" /> Signing in…</> : 'Sign in'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-white/6" />
        <span className="text-zinc-700 text-xs font-medium">or</span>
        <div className="flex-1 h-px bg-white/6" />
      </div>

      {/* Social sign-in */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Google */}
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={oauthLoading !== null}
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

        {/* Apple */}
        <button
          type="button"
          onClick={() => handleOAuth('apple')}
          disabled={oauthLoading !== null}
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
    </motion.div>
  );
}
