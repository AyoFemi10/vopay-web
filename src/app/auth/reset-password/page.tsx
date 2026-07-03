'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Reset Password Page
 *
 * Supabase redirects here after the user clicks the password reset email link.
 * Supabase appends `#access_token=...&type=recovery` to the URL hash.
 * The Supabase client automatically detects the recovery session on mount.
 * We then call supabase.auth.updateUser() with the new password.
 */
function ResetPasswordContent() {
  const router = useRouter();
  const [loading, setLoading]          = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword]        = useState('');
  const [confirmPassword, setConfirm]  = useState('');

  // Supabase processes the recovery hash automatically via onAuthStateChange
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password reset successfully!');
      // Sign out all sessions so the user logs in fresh
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch {
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionReady) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Spinner size="lg" />
        <p className="text-zinc-500 text-sm font-medium animate-pulse">
          Verifying reset link…
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2 text-white">
          Set new password
        </h1>
        <p className="text-text-secondary">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            New password
          </label>
          <input
            id="new-password"
            type="password"
            className="input"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            className="input"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2 h-12 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Updating…</>
          ) : (
            'Reset password'
          )}
        </button>
      </form>

      <p className="text-center mt-8 text-text-secondary text-sm">
        <Link
          href="/auth/login"
          className="font-semibold text-white hover:text-accent transition-colors"
        >
          Back to log in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
