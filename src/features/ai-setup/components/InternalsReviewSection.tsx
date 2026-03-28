import { useState } from 'react';
import { Check, X, Users, Pencil, MessageSquare } from 'lucide-react';
import { useGetInternals } from '../api/useGetInternals';
import { useReviewInternal } from '../api/useReviewInternal';
import { InternalConversationDrawer } from './InternalConversationDrawer';
import type { InternalReview } from '../api/useGetInternals';

const statusBadge = {
  pending: 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30',
  approved: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  rejected: 'bg-accent-red/15 text-accent-red border-accent-red/30',
};

const statusLabel = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const InternalRow = ({ internal, onViewConversation }: { internal: InternalReview; onViewConversation: (i: InternalReview) => void }) => {
  const [editing, setEditing] = useState(false);
  const [purpose, setPurpose] = useState(internal.modifiedPurpose ?? internal.internalPurpose);
  const review = useReviewInternal();

  const handleApprove = () => {
    review.mutate({
      id: internal.id,
      status: 'approved',
      modifiedPurpose: purpose !== internal.internalPurpose ? purpose : undefined,
    });
    setEditing(false);
  };

  const handleReject = () => {
    review.mutate({ id: internal.id, status: 'rejected' });
  };

  const isPending = internal.status === 'pending';

  return (
    <div className="flex items-start gap-3 p-3 bg-bg-primary border border-border-primary rounded-md">
      <Users size={14} className="text-accent-blue shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            onBlur={() => setEditing(false)}
            className="w-full text-xs text-text-primary bg-bg-secondary border border-border-primary rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent-blue"
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-text-secondary leading-snug truncate">
              {internal.modifiedPurpose ?? internal.internalPurpose}
            </p>
            {isPending && (
              <button
                onClick={() => setEditing(true)}
                className="shrink-0 text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <Pencil size={11} />
              </button>
            )}
          </div>
        )}
        {internal.channelName && (
          <p className="text-[10px] text-accent-blue mt-0.5 truncate">{internal.channelName}</p>
        )}
        {internal.groupJid && (
          <p className="text-[10px] text-text-tertiary mt-0.5 font-mono truncate">grupo: {internal.groupJid}</p>
        )}
        {internal.clientId && (
          <p className="text-[10px] text-text-tertiary mt-0.5 font-mono truncate">cliente: {internal.clientId}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${statusBadge[internal.status]}`}>
          {statusLabel[internal.status]}
        </span>
        <button
          onClick={() => onViewConversation(internal)}
          title="Ver conversación"
          className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <MessageSquare size={14} />
        </button>
        {isPending && (
          <>
            <button
              onClick={handleApprove}
              disabled={review.isPending}
              title="Aprobar"
              className="p-1 rounded hover:bg-accent-green/15 text-text-tertiary hover:text-accent-green transition-colors disabled:opacity-40"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleReject}
              disabled={review.isPending}
              title="Rechazar"
              className="p-1 rounded hover:bg-accent-red/15 text-text-tertiary hover:text-accent-red transition-colors disabled:opacity-40"
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const InternalsReviewSection = () => {
  const { data: internals, isLoading } = useGetInternals();
  const [viewing, setViewing] = useState<InternalReview | null>(null);

  const pending = internals?.filter((i) => i.status === 'pending') ?? [];
  const reviewed = internals?.filter((i) => i.status !== 'pending') ?? [];

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-text-tertiary">Cargando internos...</div>
    );
  }

  if (!internals || internals.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-text-tertiary">
        No hay canales internos pendientes de revisión.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {pending.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase mb-2">
              Pendientes ({pending.length})
            </p>
            <div className="flex flex-col gap-2">
              {pending.map((i) => <InternalRow key={i.id} internal={i} onViewConversation={setViewing} />)}
            </div>
          </div>
        )}
        {reviewed.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase mb-2">
              Revisados ({reviewed.length})
            </p>
            <div className="flex flex-col gap-2">
              {reviewed.map((i) => <InternalRow key={i.id} internal={i} onViewConversation={setViewing} />)}
            </div>
          </div>
        )}
      </div>
      {viewing && (
        <InternalConversationDrawer internal={viewing} onClose={() => setViewing(null)} />
      )}
    </>
  );
};
