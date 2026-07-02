'use client';

import { useState, useRef, useEffect } from 'react';
import {
  useQuery,
  useMutation,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Send,
  RefreshCw,
  TicketCheck,
  Bot,
  User,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  ticketCreated?: boolean;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<TicketStatus, 'yellow' | 'blue' | 'green' | 'gray'> = {
  OPEN: 'yellow',
  IN_PROGRESS: 'yellow',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } },
};

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm the VOPayX AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiClient.post('/support/chat', { message });
      return res.data.data as { reply: string; confidence: number; ticketCreated: boolean };
    },
    onSuccess: (data, message) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          timestamp: new Date(),
          ticketCreated: data.ticketCreated,
        },
      ]);
      if (data.ticketCreated) {
        toast('A support ticket has been created for you.', { icon: '🎫' });
      }
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          role: 'assistant',
          text: "I'm having trouble connecting right now. Please try again or open a support ticket.",
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    chatMutation.mutate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[600px]">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex items-start gap-3',
              msg.role === 'user' && 'flex-row-reverse'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                msg.role === 'assistant'
                  ? 'bg-accent/15 border border-accent/25'
                  : 'bg-bg-hover border border-white/10'
              )}
            >
              {msg.role === 'assistant' ? (
                <Bot className="w-4 h-4 text-accent" />
              ) : (
                <User className="w-4 h-4 text-text-secondary" />
              )}
            </div>

            {/* Bubble */}
            <div className={cn('max-w-[75%]', msg.role === 'user' && 'items-end flex flex-col')}>
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'assistant'
                    ? 'bg-[#0D1525] border border-white/6 text-white rounded-tl-sm'
                    : 'bg-accent/15 border border-accent/20 text-white rounded-tr-sm'
                )}
              >
                {msg.text}
              </div>
              {msg.ticketCreated && (
                <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                  <TicketCheck className="w-3.5 h-3.5" />
                  Ticket created for further review
                </div>
              )}
              <p className="text-[10px] text-text-muted mt-1 px-1">
                {format(msg.timestamp, 'h:mm a')}
              </p>
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/15 border border-accent/25">
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <div className="bg-[#0D1525] border border-white/6 rounded-2xl rounded-tl-sm px-4 py-3">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/6 p-4">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 input resize-none py-2.5 min-h-[42px] max-h-[120px]"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
            aria-label="Chat message input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className="btn-primary h-[42px] px-4 shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tickets Tab ──────────────────────────────────────────────────────────────

function TicketsTab() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<SupportTicket[]>({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const res = await apiClient.get('/support/tickets');
      return res.data.data as SupportTicket[];
    },
    retry: false,
  });

  const tickets = isError ? [] : (data ?? []);

  return (
    <div>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <p className="text-sm text-text-muted">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
          aria-label="Refresh tickets"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading tickets…</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
            <TicketCheck className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-text-secondary font-semibold text-sm">No tickets yet</p>
          <p className="text-text-muted text-xs">Your support tickets will appear here</p>
        </div>
      ) : (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="visible"
          className="divide-y divide-white/5"
        >
          {tickets.map((ticket) => (
            <motion.div key={ticket.id} variants={stagger.item}>
              <Link
                href={`/dashboard/support/tickets/${ticket.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.025] transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <TicketCheck className="w-4.5 h-4.5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{ticket.subject}</p>
                  <p className="text-xs text-text-muted mt-0.5 font-mono">{ticket.id.slice(0, 12)}…</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={STATUS_VARIANT[ticket.status] ?? 'gray'}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {format(new Date(ticket.createdAt), 'MMM d')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-white transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function SupportInner() {
  const [activeTab, setActiveTab] = useState<'chat' | 'tickets'>('chat');

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-accent" /> Support
        </h2>
        <p className="text-text-muted text-sm mt-1">Chat with our AI assistant or view your tickets</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0D1525] rounded-xl p-1 border border-white/5 w-fit">
        {(['chat', 'tickets'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize',
              activeTab === tab
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            )}
          >
            {tab === 'chat' ? 'AI Chat' : 'My Tickets'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl bg-[#0D1525] border border-white/5 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChatTab />
            </motion.div>
          ) : (
            <motion.div
              key="tickets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TicketsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/6 text-sm text-text-secondary">
        <AlertCircle className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
        <span>
          Our AI assistant handles most queries instantly. For complex issues, a ticket is created automatically and our team responds within 24 hours.
        </span>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
});

export default function SupportPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupportInner />
    </QueryClientProvider>
  );
}
