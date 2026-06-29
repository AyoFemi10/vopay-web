'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading]     = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [formData, setFormData]   = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', formData);
      if (data.success) {
        toast.success('Welcome back! 🎉');
        login(data.data.tokens.accessToken, data.data.user, data.data.tokens.expiresIn);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2 text-white">Welcome back</h1>
        <p className="text-text-secondary">Enter your details to access your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="login-email">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            className="input"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="name@company.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-text-secondary" htmlFor="login-password">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-sm font-medium text-accent hover:text-accent-light transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              className="input pr-11"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="btn-primary w-full mt-2 h-12 gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          id="login-submit"
        >
          {loading ? (
            <><Spinner size="sm" /> Signing in…</>
          ) : (
            <>Sign In <ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>
      </form>

      <p className="text-center mt-8 text-text-secondary text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="font-semibold text-white hover:text-accent transition-colors">
          Create one now
        </Link>
      </p>
    </motion.div>
  );
}
