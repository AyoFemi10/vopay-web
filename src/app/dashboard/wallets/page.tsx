'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { WalletData } from '@/types/shared';
import {
  Wallet, Plus, ArrowDownRight, ArrowUpRight, Eye, EyeOff, RefreshCw, Copy, CheckCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const CURRENCY_FLAGS: Record<string, string> = {
  NGN: '🇳🇬', USD: '🇺🇸', GBP: '🇬🇧', EUR: '🇪🇺', KES: '🇰🇪', GHS: '🇬🇭', ZAR: '🇿🇦',
};
const CURRENCY_NAMES: Record<string, string> = {
  NGN: 'Nigerian Naira', USD: 'US Dollar', GBP: 'British Pound',
  EUR: 'Euro', KES: 'Kenyan Shilling', GHS: 'Ghanaian Cedi', ZAR: 'South African Rand',
};
const CARD_GRADIENTS: Record<string, string> = {
  USD: 'from-[#1E3A8A] via-[#1D4ED8] to-[#3B82F6]',
  GBP: 'from-[#581C87] via-[#7E22CE] to-[#A855F7]',
  EUR: 'from-[#1E3A5F] via-[#1D4580] to-[#3B76C4]',
  NGN: 'from-[#064E3B] via-[#065F46] to-[#059669]',
  KES: 'from-[#7C2D12] via-[#9A3412] to-[#C2410C]',
  GHS: 'from-[#713F12] via-[#92400E] to-[#B45309]',
  ZAR: 'from-[#111827] via-[#1F2937] to-[#374151]',
};

export default function WalletsPage() {
  const [wallets, setWallets]           = useState<WalletData[]>([]);
  const [loading, setLoading]           = useState(true);
  const [hideBalance, setHideBalance]   = useState(false);
  const [copiedId, setCopiedId]         = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/wallets');
      if (res.data.success) setWallets(res.data.data);
    } catch {
      toast.error('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWallets(); }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalUsd = wallets.reduce((acc, w) => {
    const rate = w.currency === 'NGN' ? 1 / 1500 : w.currency === 'GBP' ? 1.27 : w.currency === 'EUR' ? 1.09 : 1;
    return acc + Number(w.balance) * rate;
  }, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm animate-pulse">Syncing wallets…</p>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-12 max-w-[1400px]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-black text-white">My Wallets</h2>
          <p className="text-text-muted text-sm mt-0.5">Manage your multi-currency balances</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => setHideBalance(!hideBalance)}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-all">
            {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button onClick={fetchWallets}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => setDepositModalOpen(true)} variant="primary" size="sm">
            <Plus className="w-4 h-4" /> Add Money
          </Button>
        </div>
      </div>

      {/* Total balance hero */}
      <motion.div
        className="relative rounded-[2.5rem] overflow-hidden p-8"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #0EA5E9 100%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-accent-light/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Total Portfolio Value</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={hideBalance ? 'h' : 's'}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="text-5xl md:text-6xl font-black font-display text-white tracking-tight leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
            >
              {hideBalance ? '$ ••••••' : formatCurrency(totalUsd, 'USD')}
            </motion.p>
          </AnimatePresence>
          <div className="flex items-center gap-2 mt-4">
            <span className="px-3 py-1 rounded-full bg-white/15 text-white/80 text-xs font-semibold border border-white/15 backdrop-blur-sm">
              Across {wallets.length} active wallet{wallets.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Wallet grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {wallets.map((wallet, i) => {
          const grad = CARD_GRADIENTS[wallet.currency] ?? 'from-gray-800 to-gray-900';
          return (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setSelectedWallet(wallet)}
              className="cursor-pointer group"
            >
              <div className={cn(
                'relative h-52 rounded-[1.75rem] p-6 flex flex-col justify-between overflow-hidden',
                'bg-gradient-to-br', grad,
                'shadow-[0_12px_40px_rgba(0,0,0,0.4)] border border-white/12',
                'transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
              )}>
                {/* Shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/6 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-lg shadow-inner">
                      {CURRENCY_FLAGS[wallet.currency] ?? '💰'}
                    </div>
                    <div>
                      <p className="font-black text-white text-base leading-none">{wallet.currency}</p>
                      <p className="text-[10px] text-white/55 font-medium tracking-wide uppercase mt-0.5">{CURRENCY_NAMES[wallet.currency]}</p>
                    </div>
                  </div>
                  {wallet.isDefault && (
                    <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
                      Default
                    </span>
                  )}
                </div>

                <div className="relative z-10">
                  <p className="text-white/55 text-[10px] uppercase tracking-widest mb-1">Balance</p>
                  <p className="text-2xl font-black font-display text-white leading-none tracking-tight">
                    {hideBalance ? '•••••' : formatCurrency(wallet.balance, wallet.currency)}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    {wallet.accountNumber ? (
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] text-white/60 font-mono tracking-widest">{wallet.accountNumber}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(wallet.accountNumber!, wallet.id); }}
                          className="text-white/30 hover:text-white transition-colors"
                        >
                          {copiedId === wallet.id ? <CheckCheck className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-white/35 uppercase tracking-widest">Digital wallet</p>
                    )}
                    {/* Card chip */}
                    <div className="w-7 h-5 rounded bg-gradient-to-br from-yellow-200/40 to-yellow-500/30 border border-yellow-200/15 shadow-inner" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Add wallet CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: wallets.length * 0.07 }}
          className="h-52 rounded-[1.75rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-accent/40 hover:bg-accent/3 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-accent/15 group-hover:scale-110 transition-all">
            <Plus className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
          </div>
          <p className="text-sm font-bold text-text-muted group-hover:text-white transition-colors uppercase tracking-wider">Add Wallet</p>
        </motion.div>
      </div>

      {/* Wallet Detail Modal */}
      <Modal isOpen={!!selectedWallet} onClose={() => setSelectedWallet(null)}
        title={selectedWallet ? `${selectedWallet.currency} Wallet` : ''}>
        {selectedWallet && (
          <div className="space-y-5">
            <div className={cn(
              'relative rounded-2xl p-5 overflow-hidden',
              'bg-gradient-to-br', CARD_GRADIENTS[selectedWallet.currency] ?? 'from-gray-800 to-gray-900'
            )}>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{CURRENCY_FLAGS[selectedWallet.currency]}</span>
                <div>
                  <p className="text-3xl font-black font-display text-white leading-none">
                    {formatCurrency(selectedWallet.balance, selectedWallet.currency)}
                  </p>
                  <p className="text-white/60 text-sm">{CURRENCY_NAMES[selectedWallet.currency]}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/4 border border-white/8">
                <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1.5">Status</p>
                <Badge variant={selectedWallet.isActive ? 'green' : 'red'}>
                  {selectedWallet.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="p-4 rounded-xl bg-white/4 border border-white/8">
                <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1.5">Type</p>
                <Badge variant="blue">{selectedWallet.isDefault ? 'Default' : 'Secondary'}</Badge>
              </div>
              {selectedWallet.accountNumber && (
                <div className="col-span-2 p-4 rounded-xl bg-white/4 border border-white/8">
                  <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mb-2">Account Number</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white text-sm flex-1">{selectedWallet.accountNumber}</span>
                    <button onClick={() => handleCopy(selectedWallet.accountNumber!, selectedWallet.id)}
                      className="text-text-muted hover:text-accent transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="success" className="flex-1" onClick={() => { setDepositModalOpen(true); setSelectedWallet(null); }}>
                <ArrowDownRight className="w-4 h-4" /> Deposit
              </Button>
              <Button variant="secondary" className="flex-1">
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deposit Modal */}
      <Modal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} title="Add Money">
        <div className="space-y-3">
          <p className="text-text-secondary text-sm mb-4">Choose a funding method</p>
          {[
            { name: 'Paystack',           sub: 'Instant · Card, Bank Transfer', color: 'text-success', bg: 'bg-success/10' },
            { name: 'Flutterwave',        sub: 'Instant · Multiple methods',    color: 'text-accent',  bg: 'bg-accent/10'  },
            { name: 'International Wire', sub: '1–3 business days · SWIFT',     color: 'text-warning', bg: 'bg-warning/10' },
          ].map((method) => (
            <button
              key={method.name}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/4 border border-white/8 hover:border-white/15 hover:bg-white/6 transition-all text-left group"
            >
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', method.bg)}>
                <Wallet className={cn('w-5 h-5', method.color)} />
              </div>
              <div>
                <p className="font-bold text-white text-sm group-hover:text-white">{method.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{method.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
