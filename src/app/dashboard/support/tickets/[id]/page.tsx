'use client';

import { use, useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  TicketCheck,
  Clock,
  MessageSquare,
  Paperclip,
  Upload,
  Send,
  FileText,
  Image,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface TimelineEvent {
  id: string;
  type: 'STATUS_CHANGE' | 'NOTE' | 'MESSAGE' | 'EVIDENCE';
  description: string;
  createdAt: string;
  author?: string;
}

interface TicketNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

interface TicketAttachment {
  id: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  notes: TicketNote[];
  attachments: TicketAttachment[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<TicketStatus, 'yellow' | 'green' | 'gray'> = {
  OPEN: 'yellow',
  IN_PROGRESS: 'yellow',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <Image className="w-4 h-4 text-blue-400" />;
  return <FileText className="w-4 h-4 text-text-muted" />;
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function TicketDetailInner({ ticketId }: { ticketId: string }) {
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const { data, isLoading, isError } = useQuery<TicketDetail>({
    queryKey: ['ticket-detail', ticketId],
    queryFn: async () => {
      const res = await apiClient.get(`/support/tickets/${ticketId}`);
      return res.data.data as TicketDetail;
    },
    retry: false,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiClient.post(`/support/tickets/${ticketId}/notes`, { content });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Note added');
      setNoteText('');
      qc.invalidateQueries({ queryKey: ['ticket-detail', ticketId] });
    },
    onError: () => toast.error('Failed to add note'),
  });

  const uploadEvidenceMutation = useMutation({
    mutationFn: async (uploadFiles: File[]) => {
      const fd = new FormData();
      uploadFiles.forEach((f) => fd.append('evidence', f));
      const res = await apiClient.post(
        `/support/tickets/${ticketId}/evidence`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Evidence uploaded');
      setFiles([]);
      qc.invalidateQueries({ queryKey: ['ticket-detail', ticketId] });
    },
    onError: () => toast.error('Failed to upload evidence'),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm">Loading ticket…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="card text-center py-20">
        <TicketCheck className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary font-medium">Ticket not found</p>
        <Link href="/dashboard/support" className="btn-secondary mt-6 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Support
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + Header */}
      <div>
        <Link
          href="/dashboard/support"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Support
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-white">{data.subject}</h2>
            <p className="text-xs text-text-muted mt-1 font-mono">{data.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_VARIANT[data.status] ?? 'gray'}>
              {data.status.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-text-muted">
              {format(new Date(data.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
        {data.description && (
          <p className="text-sm text-text-secondary mt-3 leading-relaxed">{data.description}</p>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl bg-[#0D1525] border border-white/5 overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-white/5">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" /> Timeline
          </h3>
        </div>
        {data.timeline.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2">
            <Clock className="w-8 h-8 text-text-muted" />
            <p className="text-text-muted text-sm">No timeline events yet</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {data.timeline.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="flex items-start gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-accent/60 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-relaxed">{event.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {event.author && (
                      <span className="text-xs text-text-muted">{event.author}</span>
                    )}
                    <span className="text-xs text-text-muted">
                      {format(new Date(event.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-2xl bg-[#0D1525] border border-white/5 overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-white/5">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" /> Notes
          </h3>
        </div>
        <div className="px-5 py-4 space-y-4">
          {data.notes.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4">No notes yet</p>
          ) : (
            data.notes.map((note) => (
              <div key={note.id} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                <p className="text-sm text-white leading-relaxed">{note.content}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                  <span className="font-medium">{note.author}</span>
                  <span>·</span>
                  <span>{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
                </div>
              </div>
            ))
          )}

          {/* Add note */}
          <div className="pt-2 border-t border-white/5">
            <label htmlFor="note-input" className="block text-xs font-medium text-text-secondary mb-2">
              Add a note
            </label>
            <textarea
              id="note-input"
              rows={3}
              placeholder="Write a note…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="input w-full resize-none"
            />
            <button
              onClick={() => {
                if (!noteText.trim()) { toast.error('Note cannot be empty'); return; }
                addNoteMutation.mutate(noteText.trim());
              }}
              disabled={addNoteMutation.isPending || !noteText.trim()}
              className="btn-primary mt-2 flex items-center gap-2"
            >
              {addNoteMutation.isPending ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
              Add Note
            </button>
          </div>
        </div>
      </div>

      {/* Evidence */}
      <div className="rounded-2xl bg-[#0D1525] border border-white/5 overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-white/5">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-accent" /> Evidence Attachments
          </h3>
        </div>
        <div className="px-5 py-4 space-y-4">
          {data.attachments.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-2">No attachments yet</p>
          ) : (
            <div className="space-y-2">
              {data.attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <FileIcon mimeType={att.mimeType} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{att.filename}</p>
                    <p className="text-xs text-text-muted">
                      {format(new Date(att.uploadedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload */}
          <div className="pt-2 border-t border-white/5">
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Upload evidence
            </label>
            <div
              className={cn(
                'border-2 border-dashed border-white/10 rounded-xl p-5 text-center cursor-pointer hover:border-accent/30 transition-colors',
                files.length > 0 && 'border-accent/30 bg-accent/5'
              )}
              onClick={() => {
                const el = document.getElementById('evidence-upload') as HTMLInputElement;
                el?.click();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && (document.getElementById('evidence-upload') as HTMLInputElement)?.click()}
              aria-label="Upload evidence files"
            >
              <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
              {files.length > 0 ? (
                <p className="text-sm text-accent font-medium">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
              ) : (
                <p className="text-sm text-text-secondary">Click to select files (images or PDFs)</p>
              )}
            </div>
            <input
              id="evidence-upload"
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              ref={(el) => { (fileInputRef as unknown as React.MutableRefObject<HTMLInputElement | null>).current = el; }}
            />
            {files.length > 0 && (
              <button
                onClick={() => uploadEvidenceMutation.mutate(files)}
                disabled={uploadEvidenceMutation.isPending}
                className="btn-primary mt-3 flex items-center gap-2"
              >
                {uploadEvidenceMutation.isPending ? <Spinner size="sm" /> : <Upload className="w-4 h-4" />}
                Upload {files.length} file{files.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <QueryClientProvider client={queryClient}>
      <TicketDetailInner ticketId={id} />
    </QueryClientProvider>
  );
}
