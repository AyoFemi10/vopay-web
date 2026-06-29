'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Lock,
  Bell,
  Shield,
  ChevronRight,
  Camera,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type Tab = 'profile' | 'security' | 'notifications' | 'kyc';

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'security',      label: 'Security',      icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'kyc',           label: 'Verification',  icon: Shield },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile state
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName]   = useState(user?.lastName ?? '');
  const [phone, setPhone]         = useState(user?.phone ?? '');

  // Security state
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showPw, setShowPw]         = useState(false);

  // Notification state
  const [notifs, setNotifs] = useState({
    emailTransactions: true,
    emailMarketing: false,
    pushTransactions: true,
    pushSecurity: true,
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile updated!');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    toast.success('Password changed successfully!');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-text-muted text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Tab Navigation */}
        <div className="lg:col-span-1">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`settings-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                    isActive
                      ? 'text-white'
                      : 'text-text-secondary hover:text-white hover:bg-bg-hover'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="settings-active"
                      className="absolute inset-0 rounded-xl bg-accent/10 border border-accent/20"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <tab.icon className={cn('w-5 h-5 relative z-10', isActive ? 'text-accent' : 'text-text-muted')} />
                  <span className="relative z-10">{tab.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto relative z-10 text-accent hidden lg:block" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* ─── PROFILE ─────────────────────────────────────────── */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="card space-y-6">
                <h3 className="text-lg font-semibold text-white">Personal Information</h3>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-brand flex items-center justify-center text-white text-2xl font-black shadow-glow">
                      {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
                    </div>
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-accent flex items-center justify-center border-2 border-bg-secondary hover:bg-accent-light transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-text-muted">{user?.email}</p>
                    <Badge variant={user?.isVerified ? 'green' : 'yellow'} className="mt-1">
                      {user?.isVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </div>

                <div className="divider" />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="first-name">
                      First Name
                    </label>
                    <input
                      id="first-name"
                      className="input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="last-name">
                      Last Name
                    </label>
                    <input
                      id="last-name"
                      className="input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      id="email"
                      className="input opacity-60 cursor-not-allowed"
                      value={user?.email}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="phone">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      className="input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 000 0000 000"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="btn-primary gap-2">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* ─── SECURITY ────────────────────────────────────────── */}
            {activeTab === 'security' && (
              <form onSubmit={handleSavePassword} className="card space-y-6">
                <h3 className="text-lg font-semibold text-white">Change Password</h3>

                {[
                  { id: 'current-pw', label: 'Current Password', value: currentPw, setter: setCurrentPw },
                  { id: 'new-pw',     label: 'New Password',     value: newPw,     setter: setNewPw },
                  { id: 'confirm-pw', label: 'Confirm Password', value: confirmPw, setter: setConfirmPw },
                ].map(({ id, label, value, setter }) => (
                  <div key={id}>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor={id}>
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        id={id}
                        type={showPw ? 'text' : 'password'}
                        className="input pr-12"
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}

                {newPw && (
                  <div className="space-y-1">
                    {[
                      { label: 'At least 8 characters', pass: newPw.length >= 8 },
                      { label: 'Contains uppercase letter', pass: /[A-Z]/.test(newPw) },
                      { label: 'Contains number', pass: /\d/.test(newPw) },
                    ].map(({ label, pass }) => (
                      <div key={label} className="flex items-center gap-2 text-xs">
                        <span className={pass ? 'text-success' : 'text-text-muted'}>
                          {pass ? '✓' : '○'}
                        </span>
                        <span className={pass ? 'text-success' : 'text-text-muted'}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button type="submit" className="btn-primary gap-2">
                    <Lock className="w-4 h-4" /> Update Password
                  </button>
                </div>

                <div className="divider" />

                <div>
                  <h4 className="font-semibold text-white mb-3">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary border border-bg-border">
                    <div>
                      <p className="text-sm font-medium text-white">Authenticator App</p>
                      <p className="text-xs text-text-muted mt-0.5">Add an extra layer of security</p>
                    </div>
                    <button className="btn-secondary btn-sm">Enable</button>
                  </div>
                </div>
              </form>
            )}

            {/* ─── NOTIFICATIONS ───────────────────────────────────── */}
            {activeTab === 'notifications' && (
              <div className="card space-y-6">
                <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>

                {[
                  { key: 'emailTransactions', label: 'Transaction Alerts', desc: 'Email me about deposits, withdrawals and transfers', group: 'Email' },
                  { key: 'emailMarketing',    label: 'Product Updates',    desc: 'Receive news, tips and promotional offers',         group: 'Email' },
                  { key: 'pushTransactions',  label: 'Transaction Alerts', desc: 'Push notifications for all transaction activity',    group: 'Push' },
                  { key: 'pushSecurity',      label: 'Security Alerts',    desc: 'Login attempts and suspicious activity',             group: 'Push' },
                ].reduce<{ group: string; items: typeof notifs extends Record<string, boolean> ? { key: keyof typeof notifs; label: string; desc: string; group: string }[] : never[] }[]>((acc, item) => {
                  const existing = acc.find((g) => g.group === item.group);
                  if (existing) { existing.items.push(item as never); }
                  else { acc.push({ group: item.group, items: [item as never] }); }
                  return acc;
                }, []).map(({ group, items }) => (
                  <div key={group}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">{group} Notifications</p>
                    <div className="space-y-3">
                      {items.map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary border border-bg-border">
                          <div>
                            <p className="text-sm font-medium text-white">{label}</p>
                            <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                          </div>
                          <button
                            id={`toggle-${key}`}
                            onClick={() => setNotifs((prev) => ({ ...prev, [key]: !prev[key as keyof typeof notifs] }))}
                            className={cn(
                              'w-12 h-6 rounded-full relative transition-colors duration-200',
                              notifs[key as keyof typeof notifs] ? 'bg-accent' : 'bg-bg-hover'
                            )}
                            aria-checked={notifs[key as keyof typeof notifs]}
                            role="switch"
                          >
                            <span
                              className={cn(
                                'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
                                notifs[key as keyof typeof notifs] ? 'left-7' : 'left-1'
                              )}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <button onClick={() => toast.success('Preferences saved!')} className="btn-primary gap-2">
                    <Save className="w-4 h-4" /> Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* ─── KYC / VERIFICATION ──────────────────────────────── */}
            {activeTab === 'kyc' && (
              <div className="card space-y-6">
                <h3 className="text-lg font-semibold text-white">Identity Verification</h3>

                <div className={cn(
                  'flex items-start gap-4 p-4 rounded-xl border',
                  user?.kycStatus === 'APPROVED'
                    ? 'bg-success/10 border-success/20'
                    : user?.kycStatus === 'SUBMITTED'
                    ? 'bg-warning/10 border-warning/20'
                    : 'bg-error/10 border-error/20'
                )}>
                  <Shield className={cn(
                    'w-6 h-6 shrink-0 mt-0.5',
                    user?.kycStatus === 'APPROVED' ? 'text-success' : user?.kycStatus === 'SUBMITTED' ? 'text-warning' : 'text-error'
                  )} />
                  <div>
                    <p className="font-semibold text-white">
                      {user?.kycStatus === 'APPROVED'
                        ? 'Fully Verified'
                        : user?.kycStatus === 'SUBMITTED'
                        ? 'Under Review'
                        : 'Verification Required'}
                    </p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {user?.kycStatus === 'APPROVED'
                        ? 'Your identity has been verified. You have full access to all features.'
                        : user?.kycStatus === 'SUBMITTED'
                        ? 'Your documents are being reviewed. This typically takes 1-2 business days.'
                        : 'Complete identity verification to unlock higher limits and all features.'}
                    </p>
                  </div>
                </div>

                {user?.kycStatus !== 'APPROVED' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-white">Required Documents</h4>
                    {[
                      { title: 'Government-issued ID', desc: 'National ID, Passport or Driver\'s License', done: user?.kycStatus === 'SUBMITTED' },
                      { title: 'Selfie / Liveness Check', desc: 'A clear photo of your face', done: user?.kycStatus === 'SUBMITTED' },
                    ].map(({ title, desc, done }) => (
                      <div key={title} className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary border border-bg-border">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', done ? 'bg-success/10 text-success' : 'bg-bg-hover text-text-muted')}>
                            {done ? '✓' : '○'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{title}</p>
                            <p className="text-xs text-text-muted">{desc}</p>
                          </div>
                        </div>
                        {!done && <button className="btn-secondary btn-sm">Upload</button>}
                      </div>
                    ))}

                    {user?.kycStatus === 'PENDING' && (
                      <button
                        onClick={() => toast.success('KYC submission started!')}
                        className="btn-primary w-full gap-2"
                      >
                        <Shield className="w-4 h-4" /> Start Verification
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
