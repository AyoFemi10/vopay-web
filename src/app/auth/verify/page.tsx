'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Redirect if already verified
  useEffect(() => {
    if (user?.isVerified) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/verify-email', { otp: code });
      if (data.success) {
        toast.success('Email verified successfully!');
        updateUser({ isVerified: true });
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { data } = await apiClient.post('/auth/resend-otp');
      if (data.success) {
        toast.success('A new verification code has been sent to your email.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Check your email</h1>
        <p className="text-text-secondary">We sent a 6-digit verification code to <span className="text-white font-medium">{user?.email || 'your email'}</span>.</p>
      </div>

      <form onSubmit={handleVerify} className="flex flex-col gap-6">
        <div className="flex justify-between gap-2 sm:gap-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold font-mono bg-bg-secondary border border-bg-border rounded-xl focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
            />
          ))}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full h-12">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Email'}
        </button>
      </form>

      <div className="text-center mt-8">
        <p className="text-text-secondary text-sm mb-2">Didn't receive the code?</p>
        <button 
          onClick={handleResend} 
          disabled={resending}
          className="font-semibold text-white hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending ? 'Sending...' : 'Click to resend'}
        </button>
      </div>
    </>
  );
}
