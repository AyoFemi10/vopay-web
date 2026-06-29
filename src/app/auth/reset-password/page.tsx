'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      router.push('/auth/login');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/reset-password', { token, password });
      if (data.success) {
        toast.success('Password reset successfully!');
        router.push('/auth/login');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Set new password</h1>
        <p className="text-text-secondary">Your new password must be different to previously used passwords.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
          <input 
            type="password" 
            className="input" 
            required 
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Confirm Password</label>
          <input 
            type="password" 
            className="input" 
            required 
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Min. 8 characters"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2 h-12">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
        </button>
      </form>

      <p className="text-center mt-8 text-text-secondary text-sm">
        <Link href="/auth/login" className="font-semibold text-white hover:text-accent transition-colors">
          Back to log in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-text-secondary">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
