'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria'        },
  { code: 'US', name: 'United States'  },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'KE', name: 'Kenya'          },
  { code: 'GH', name: 'Ghana'          },
  { code: 'ZA', name: 'South Africa'   },
];

function Field({ label, id, children }: { label: string; id?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function SignupPage() {
  const router      = useRouter();
  const { login }   = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', country: 'NG',
  });

  const pwChecks = [
    { label: '8+ characters',   pass: form.password.length >= 8 },
    { label: 'Uppercase',        pass: /[A-Z]/.test(form.password) },
    { label: 'Number',           pass: /\d/.test(form.password) },
  ];
  const strength = pwChecks.filter((c) => c.pass).length;
  const barColor = strength === 1 ? '#EF4444' : strength === 2 ? '#F59E0B' : '#10B981';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/register', form);
      if (data.success) {
        toast.success('Account created!');
        login(data.data.tokens.accessToken, data.data.user, data.data.tokens.expiresIn);
        router.push('/auth/verify');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-black font-display text-white tracking-tight mb-2">
          Create an account
        </h1>
        <p className="text-zinc-500 text-sm">
          Already have one?{' '}
          <Link href="/auth/login" className="text-white font-semibold hover:text-zinc-300 transition-colors underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" id="signup-firstname">
            <input
              id="signup-firstname" type="text" required
              className="input"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="John"
            />
          </Field>
          <Field label="Last name" id="signup-lastname">
            <input
              id="signup-lastname" type="text" required
              className="input"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder="Doe"
            />
          </Field>
        </div>

        <Field label="Email" id="signup-email">
          <input
            id="signup-email" type="email" required
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Phone (optional)" id="signup-phone">
          <input
            id="signup-phone" type="tel"
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+234 000 000 0000"
          />
        </Field>

        <Field label="Country" id="signup-country">
          <select
            id="signup-country"
            className="input cursor-pointer"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Password" id="signup-password">
          <div className="relative">
            <input
              id="signup-password"
              type={showPw ? 'text' : 'password'}
              required minLength={8}
              className="input pr-10"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
              aria-label="Toggle password"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength indicator */}
          {form.password.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2 mt-1"
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-0.5 flex-1 rounded-full transition-all duration-300"
                    style={{ background: i < strength ? barColor : 'rgba(255,255,255,0.1)' }}
                  />
                ))}
              </div>
              <div className="flex gap-4 flex-wrap">
                {pwChecks.map(({ label, pass }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs">
                    <Check className={cn('w-3 h-3 transition-colors', pass ? 'text-white' : 'text-zinc-700')} />
                    <span className={pass ? 'text-zinc-400' : 'text-zinc-700'}>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </Field>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          id="signup-submit"
          className="btn-primary w-full h-11 mt-1 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
          style={{ borderRadius: 9999 }}
        >
          {loading ? (
            <><Spinner size="sm" /> Creating account…</>
          ) : (
            <>
              Create account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        <p className="text-xs text-zinc-700 text-center">
          By signing up you agree to our{' '}
          <Link href="/legal/terms" className="text-zinc-500 hover:text-white transition-colors underline underline-offset-2">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="text-zinc-500 hover:text-white transition-colors underline underline-offset-2">
            Privacy Policy
          </Link>.
        </p>
      </form>
    </motion.div>
  );
}
