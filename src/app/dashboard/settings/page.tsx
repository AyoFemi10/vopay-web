'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  User, Lock, Bell, Shield, Smartphone,
  ChevronRight, Camera, Save, Eye, EyeOff, Key,
} from 'lucide-react';

type Tab = 'profile' | 'security' | 'notifications';

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'security',      label: 'Security',      icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile Form
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName]   = useState(user?.lastName ?? '');
  const [phone, setPhone]         = useState((user as any)?.phone ?? '');

  // Security Form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [newPin, setNewPin]           = useState('');
  const [confirmPin, setConfirmPin]   = useState('');
  const [pinLoading, setPinLoading]   = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile updated successfully!');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 8) { toast.error('Min 8 characters'); return; }
    toast.success('Password changed!');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) { toast.error('PINs do not match'); return; }
    if (newPin.length < 4) { toast.error('PIN must be 4–6 digits'); return; }
    setPinLoading(true);
    try {
      await apiClient.post('/users/pin', { pin: newPin });
      toast.success('Transaction PIN set successfully');
      setNewPin(''); setConfirmPin('');
    } catch (err: any) {
      toast.error('Failed to set PIN');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <div>
            <h2 className="text-3xl font-display font-bold text-white mb-2">Settings</h2>
            <p className="text-text-muted text-sm">Manage your account preferences</p>
          </div>
          <Card variant="glass" className="!p-2">
            <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap',
                      isActive ? 'text-white' : 'text-text-secondary hover:text-white hover:bg-white/5'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="settings-active"
                        className="absolute inset-0 rounded-xl bg-accent/20 border border-accent/30 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]"
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      />
                    )}
                    <tab.icon className={cn('w-5 h-5 relative z-10', isActive ? 'text-accent' : 'text-text-muted')} />
                    <span className="relative z-10">{tab.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto relative z-10 text-accent hidden md:block" />}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && (
                <Card variant="glass" className="space-y-8">
                  <h3 className="text-xl font-bold text-white mb-6">Personal Information</h3>
                  
                  <div className="flex items-center gap-6">
                    <div className="relative group cursor-pointer">
                      <div className="w-24 h-24 rounded-full bg-gradient-brand flex items-center justify-center text-white text-3xl font-black shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/20 transition-transform group-hover:scale-105">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </div>
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{user?.firstName} {user?.lastName}</p>
                      <p className="text-sm text-text-muted font-medium mb-2">{user?.email}</p>
                      <Badge variant="green" className="shadow-inner">Verified Account</Badge>
                    </div>
                  </div>

                  <form onSubmit={handleProfileSave} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">First Name</label>
                        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-bg-primary neumorph-inset !border-transparent h-12" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Last Name</label>
                        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-bg-primary neumorph-inset !border-transparent h-12" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Email Address</label>
                        <Input value={user?.email ?? ''} disabled className="bg-bg-primary/50 text-text-muted neumorph-inset !border-transparent h-12 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Phone Number</label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 8900" className="bg-bg-primary neumorph-inset !border-transparent h-12" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-white/5">
                      <Button variant="primary" type="submit" className="w-full sm:w-auto">
                        <Save className="w-4 h-4" /> Save Changes
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Password Change */}
                  <Card variant="glass" className="space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Lock className="w-5 h-5 text-accent" /> Change Password
                    </h3>
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div className="space-y-4">
                        {[
                          { id: 'cur-pw', label: 'Current Password', val: currentPw, set: setCurrentPw },
                          { id: 'new-pw', label: 'New Password',      val: newPw,     set: setNewPw },
                          { id: 'con-pw', label: 'Confirm Password',  val: confirmPw, set: setConfirmPw },
                        ].map(({ id, label, val, set }) => (
                          <div key={id}>
                            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2" htmlFor={id}>{label}</label>
                            <div className="relative">
                              <Input id={id} type={showPw ? 'text' : 'password'} className="bg-bg-primary neumorph-inset !border-transparent h-12 pr-12" value={val} onChange={(e) => set(e.target.value)} placeholder="••••••••" required />
                              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors">
                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end pt-4 border-t border-white/5">
                        <Button variant="primary" type="submit" className="w-full sm:w-auto">
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </Card>

                  {/* Transaction PIN */}
                  <Card variant="glass" className="space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-accent" /> Transaction PIN
                    </h3>
                    <p className="text-text-secondary text-sm font-medium">A separate 4–6 digit PIN is required to authorise outgoing transfers and withdrawals for maximum security.</p>
                    <form onSubmit={handleSetupPin} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">New PIN</label>
                          <Input type="password" inputMode="numeric" pattern="[0-9]*" minLength={4} maxLength={6} placeholder="••••" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} className="bg-bg-primary neumorph-inset !border-transparent h-14 text-center text-2xl tracking-[0.5em] font-mono" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Confirm PIN</label>
                          <Input type="password" inputMode="numeric" pattern="[0-9]*" minLength={4} maxLength={6} placeholder="••••" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} className="bg-bg-primary neumorph-inset !border-transparent h-14 text-center text-2xl tracking-[0.5em] font-mono" />
                        </div>
                      </div>
                      <div className="flex pt-4 border-t border-white/5">
                        <Button variant="success" type="submit" disabled={pinLoading || newPin.length < 4} className="w-full sm:w-auto ml-auto">
                          {pinLoading ? <Spinner size="sm" /> : 'Set PIN'}
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}

              {activeTab === 'notifications' && (
                <Card variant="glass" className="text-center py-20">
                  <Bell className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-white mb-2">Notification Preferences</h3>
                  <p className="text-text-secondary text-sm">Coming soon. You will be able to configure your email and push notifications here.</p>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
