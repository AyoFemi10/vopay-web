'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { MailCheck, Loader2 } from 'lucide-react';

/**
 * Email Verification Page
 *
 * Shown after sign-up when Supabase is configured to require email confirmation.
 * Users click a link in their email which takes them to /auth/callback where
 * the session is established. This page just provides instructions and a
 * resend option.
 */
export default function VerifyEmailPage() {
  const router            = useRouter();
  const { user }          = useAuth();
  const [resending, setResending] = useState(false);

  // Already verified — go to dashboard
  if (user?.isVerified) {
    router.push('/dashboard');
    return null;
  }

  const handleResend = async () => {
    if (!user?.email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Verification email resent. Check your inbox.');
    } catch {
      toast.error('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <MailCheck className="w-8 h-8 text-accent" />
      </div>

      <h1 className="text-3xl font-display font-bold mb-2 text-white">
        Check your email
      </h1>

      <p className="text-text-secondary mb-2">
        We sent a verification link to
      </p>
      <p className="text-white font-semibold mb-8">
        {user?.email || 'your email address'}
      </p>

      <p className="text-text-secondary text-sm mb-6">
        Click the link in the email to verify your account and continue to your
        dashboard. The link expires in 24 hours.
      </p>

      <div className="space-y-3">
        <button
          onClick={handleResend}
          disabled={resending || !user?.email}
          className="w-full h-11 rounded-full border border-white/10 text-zinc-400 text-sm font-semibold hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
          ) : (
            'Resend verification email'
          )}
        </button>

        <p className="text-text-muted text-xs">
          Wrong email?{' '}
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/auth/signup');
            }}
            className="text-zinc-500 hover:text-white transition-colors underline underline-offset-2"
          >
            Start over
          </button>
        </p>
      </div>
    </div>
  );
}
