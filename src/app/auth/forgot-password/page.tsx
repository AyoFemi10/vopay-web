'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSuccess(true);
    } catch {
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <MailCheck className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-4 text-white">
          Check your email
        </h1>
        <p className="text-text-secondary mb-8">
          We sent a password reset link to{' '}
          <br />
          <span className="text-white font-medium">{email}</span>
        </p>
        <Link href="/auth/login" className="btn-primary w-full justify-center">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to log in
        </Link>
        <h1 className="text-3xl font-display font-bold mb-2 text-white">
          Forgot password?
        </h1>
        <p className="text-text-secondary">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="forgot-email"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            Email address
          </label>
          <input
            id="forgot-email"
            type="email"
            className="input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2 h-12 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>
    </>
  );
}
