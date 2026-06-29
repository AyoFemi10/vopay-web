'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
    password:  '',
    country:   'NG',
  });

  const pwChecks = [
    { label: 'At least 8 characters',       pass: formData.password.length >= 8 },
    { label: 'Contains uppercase letter',   pass: /[A-Z]/.test(formData.password) },
    { label: 'Contains a number',           pass: /\d/.test(formData.password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/register', formData);
      if (data.success) {
        toast.success('Account created! 🎉');
        login(data.data.tokens.accessToken, data.data.user, data.data.tokens.expiresIn);
        router.push('/auth/verify');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create account');
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
        <h1 className="text-3xl font-display font-bold mb-2 text-white">Create an account</h1>
        <p className="text-text-secondary">Join VOPayX to start moving money globally.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="signup-firstname">First Name</label>
            <input id="signup-firstname" type="text" className="input" required
              value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="John" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="signup-lastname">Last Name</label>
            <input id="signup-lastname" type="text" className="input" required
              value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Doe" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="signup-email">Email address</label>
          <input id="signup-email" type="email" className="input" required
            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="name@company.com" />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="signup-phone">
            Phone Number <span className="text-text-muted">(Optional)</span>
          </label>
          <input id="signup-phone" type="tel" className="input"
            value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+234 000 0000 000" />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="signup-password">Password</label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPw ? 'text' : 'password'}
              className="input pr-11"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min. 8 characters"
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

          {formData.password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 space-y-1"
            >
              {pwChecks.map(({ label, pass }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  {pass
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    : <Circle className="w-3.5 h-3.5 text-text-muted shrink-0" />}
                  <span className={pass ? 'text-success' : 'text-text-muted'}>{label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="btn-primary w-full mt-2 h-12 gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          id="signup-submit"
        >
          {loading ? (
            <><Spinner size="sm" /> Creating account…</>
          ) : (
            <>Create Account <ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>

        <p className="text-xs text-text-muted text-center">
          By signing up, you agree to our{' '}
          <Link href="/legal/terms" className="text-accent hover:underline">Terms of Service</Link> and{' '}
          <Link href="/legal/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
        </p>
      </form>

      <p className="text-center mt-6 text-text-secondary text-sm">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-semibold text-white hover:text-accent transition-colors">
          Sign In
        </Link>
      </p>
    </motion.div>
  );
}
