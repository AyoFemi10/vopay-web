'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { WalletData } from '@vopay/shared';
import {
  Wallet,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  CheckCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

const CURRENCY_FLAGS: Record<string, string> = {
  NGN: '🇳🇬',
  USD: '🇺🇸',
  GBP: '🇬🇧',
  EUR: '🇪🇺',
  KES: '🇰🇪',
  GHS: '🇬🇭',
  ZAR: '🇿🇦',
};

const CURRENCY_NAMES: Record<string, string> = {
  NGN: 'Nigerian Naira',
  USD: 'US Dollar',
  GBP: 'British Pound',
  EUR: 'Euro',
  KES: 'Kenyan Shilling',
  GHS: 'Ghanaian Cedi',
  ZAR: 'South African Rand',
};

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm">Loading wallets…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Wallets</h2>
          <p className="text-text-muted text-sm mt-1">Manage your multi-currency balances</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all"
            title="Toggle balance"
          >
            {hideBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          <button
            onClick={fetchWallets}
            className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setDepositModalOpen(true)}
            className="btn-primary gap-2"
          >
            <Plus className="w-4 h-4" /> Add Money
          </button>
        </div>
      </div>

      {/* Total Balance Banner */}
      <motion.div
        className="relative rounded-2xl p-6 overflow-hidden bg-gradient-brand shadow-glow"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <p className="text-white/70 text-sm mb-1">Total Portfolio Value</p>
        <p className="text-4xl font-black text-white font-display">
          {hideBalance ? '••••••' : formatCurrency(totalUsd, 'USD')}
        </p>
        <p className="text-white/60 text-xs mt-2">Across {wallets.length} active wallets</p>
      </motion.div>

      {/* Wallet Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {wallets.map((wallet, i) => (
          <motion.div
            key={wallet.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card card-glow cursor-pointer group"
            onClick={() => setSelectedWallet(wallet)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{CURRENCY_FLAGS[wallet.currency] ?? '💰'}</span>
                <div>
                  <p className="font-semibold text-white">{wallet.currency}</p>
                  <p className="text-xs text-text-muted">{CURRENCY_NAMES[wallet.currency]}</p>
                </div>
              </div>
              {wallet.isDefault && (
                <Badge variant="blue">Default</Badge>
              )}
            </div>

            <p className="text-2xl font-black font-display text-white mb-1">
              {hideBalance ? '••••' : formatCurrency(wallet.balance, wallet.currency)}
            </p>
            {Number(wallet.lockedBalance) > 0 && (
              <p className="text-xs text-text-muted">
                {formatCurrency(wallet.lockedBalance, wallet.currency)} locked
              </p>
            )}

            {wallet.accountNumber && (
              <div className="mt-4 flex items-center justify-between gap-2 p-2.5 rounded-lg bg-bg-primary/60 border border-bg-border">
                <p className="text-xs text-text-secondary font-mono truncate">{wallet.accountNumber}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopy(wallet.accountNumber!, wallet.id); }}
                  className="text-text-muted hover:text-accent transition-colors shrink-0"
                >
                  {copiedId === wallet.id ? <CheckCheck className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={(e) => { e.stopPropagation(); setDepositModalOpen(true); }}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium bg-success/10 text-success hover:bg-success/20 transition-colors"
              >
                <ArrowDownRight className="w-3.5 h-3.5" /> Deposit
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
              </button>
            </div>
          </motion.div>
        ))}

        {/* Add wallet card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: wallets.length * 0.07 }}
          className="card flex flex-col items-center justify-center gap-3 min-h-[200px] border-dashed border-2 border-bg-border hover:border-accent/50 text-text-muted hover:text-accent transition-all group"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium">Add new wallet</p>
        </motion.button>
      </div>

      {/* Wallet Detail Modal */}
      <Modal
        isOpen={!!selectedWallet}
        onClose={() => setSelectedWallet(null)}
        title={selectedWallet ? `${selectedWallet.currency} Wallet Details` : ''}
      >
        {selectedWallet && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{CURRENCY_FLAGS[selectedWallet.currency]}</span>
              <div>
                <p className="text-xl font-bold text-white">{formatCurrency(selectedWallet.balance, selectedWallet.currency)}</p>
                <p className="text-text-muted text-sm">{CURRENCY_NAMES[selectedWallet.currency]}</p>
              </div>
            </div>
            <div className="divider" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-muted mb-1">Status</p>
                <Badge variant={selectedWallet.isActive ? 'green' : 'red'}>
                  {selectedWallet.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className="text-text-muted mb-1">Type</p>
                <Badge variant="blue">{selectedWallet.isDefault ? 'Default' : 'Secondary'}</Badge>
              </div>
              {selectedWallet.accountNumber && (
                <div className="col-span-2">
                  <p className="text-text-muted mb-1">Account Number</p>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-primary border border-bg-border font-mono text-sm">
                    {selectedWallet.accountNumber}
                    <button onClick={() => handleCopy(selectedWallet.accountNumber!, selectedWallet.id)} className="ml-auto text-text-muted hover:text-accent">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              <div>
                <p className="text-text-muted mb-1">Locked Balance</p>
                <p className="text-white">{formatCurrency(selectedWallet.lockedBalance, selectedWallet.currency)}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setDepositModalOpen(true); setSelectedWallet(null); }}
                className="btn-success flex-1"
              >
                Deposit
              </button>
              <button className="btn-primary flex-1">Withdraw</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deposit Modal */}
      <Modal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        title="Add Money"
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">Choose a payment method to fund your wallet.</p>
          {['Paystack', 'Flutterwave', 'Bank Transfer'].map((method) => (
            <button
              key={method}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-bg-secondary border border-bg-border hover:border-accent/50 hover:bg-bg-hover transition-all text-left"
            >
              <Wallet className="w-5 h-5 text-accent shrink-0" />
              <div>
                <p className="font-medium text-white text-sm">{method}</p>
                <p className="text-xs text-text-muted">Instant deposit via {method}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
