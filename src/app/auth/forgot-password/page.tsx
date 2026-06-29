'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
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
        <h1 className="text-3xl font-display font-bold mb-4">Check your email</h1>
        <p className="text-text-secondary mb-8">
          We sent a password reset link to <br/>
          <span className="text-white font-medium">{email}</span>
        </p>
        <Link href="/auth/login" className="btn-primary w-full justify-center">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to log in
        </Link>
        <h1 className="text-3xl font-display font-bold mb-2">Forgot password?</h1>
        <p className="text-text-secondary">No worries, we'll send you reset instructions.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Email address</label>
          <input 
            type="email" 
            className="input" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2 h-12">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
        </button>
      </form>
    </>
  );
}
