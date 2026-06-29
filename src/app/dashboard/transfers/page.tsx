'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Send } from 'lucide-react';

export default function TransfersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    receiverEmail: '',
    amount: '',
    currency: 'USD',
    note: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await apiClient.post('/transfers', formData);
      if (data.success) {
        toast.success('Transfer successful!');
        setFormData({ ...formData, receiverEmail: '', amount: '', note: '' });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card glass relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-bg-border">
               <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Send className="w-6 h-6 text-accent" />
               </div>
               <div>
                  <h2 className="text-2xl font-bold">Send Money</h2>
                  <p className="text-sm text-text-secondary">Instant transfers to other VOPayX users</p>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
               <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Recipient Email</label>
                  <input 
                     type="email" 
                     className="input" 
                     required 
                     placeholder="user@example.com"
                     value={formData.receiverEmail}
                     onChange={(e) => setFormData({...formData, receiverEmail: e.target.value})}
                  />
               </div>

               <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                     <label className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
                     <input 
                        type="number" 
                        step="0.01"
                        min="1"
                        className="input font-mono" 
                        required 
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-text-secondary mb-1">Currency</label>
                     <select 
                        className="input cursor-pointer"
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                     >
                        <option value="USD">USD</option>
                        <option value="NGN">NGN</option>
                        <option value="GBP">GBP</option>
                        <option value="EUR">EUR</option>
                     </select>
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Note (Optional)</label>
                  <input 
                     type="text" 
                     className="input" 
                     placeholder="What's this for?"
                     value={formData.note}
                     onChange={(e) => setFormData({...formData, note: e.target.value})}
                  />
               </div>

               <div className="bg-bg-secondary p-4 rounded-xl border border-bg-border mt-2">
                  <div className="flex justify-between text-sm mb-2">
                     <span className="text-text-secondary">Fee</span>
                     <span className="font-medium text-success">Free</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                     <span>Total to debit</span>
                     <span>{formData.amount ? `${formData.currency} ${Number(formData.amount).toFixed(2)}` : '-'}</span>
                  </div>
               </div>

               <button type="submit" disabled={loading} className="btn-primary w-full h-12 mt-4">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Now'}
               </button>
            </form>
         </div>
      </div>
    </div>
  );
}
