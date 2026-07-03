'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/ui/Spinner';

/**
 * OAuth Callback Page
 *
 * Supabase redirects here after a successful Google / Apple sign-in.
 * The URL contains a code that we exchange for a session.
 * After obtaining the session we call handleAuthCallback to provision the
 * VOPayX internal profile and navigate to the dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { handleAuthCallback } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Exchange the code in the URL for a Supabase session
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error || !data.session) {
        toast.error(error?.message ?? 'Sign-in failed. Please try again.');
        router.replace('/auth/login');
        return;
      }

      try {
        await handleAuthCallback(data.session.access_token);
      } catch {
        toast.error('Failed to set up your account. Please try again.');
        router.replace('/auth/login');
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <Spinner size="lg" />
      <p className="text-zinc-500 text-sm font-medium animate-pulse">
        Completing sign-in…
      </p>
    </div>
  );
}
