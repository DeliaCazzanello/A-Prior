import { RefObject, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, Check, XCircle, Mail, Calendar, User } from 'lucide-react';
import { InvitationService, EnrichedInvitation } from '../lib/services/invitationService';


interface InvitationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAccepted: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
}

function InvitationCard({
  inv,
  processingId,
  onAccept,
  onReject,
}: {
  inv: EnrichedInvitation;
  processingId: number | null;
  onAccept: (inv: EnrichedInvitation) => void;
  onReject: (inv: EnrichedInvitation) => void;
}) {
  const displayName = inv.senderUsername ?? inv.senderEmail;
  const isProcessing = processingId === inv.id;

  return (
    <div
      className="p-4 rounded-2xl space-y-3 border border-white/20 backdrop-blur-md bg-white/10 relative"
      style={{ color: 'white' }}
    >
      <h3 className="font-semibold text-white">{inv.boardName}</h3>

      <div className="flex items-center gap-1.5 text-xs">
        <User className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} />
        <span style={{ color: 'rgba(255,255,255,0.8)' }}>De: {displayName}</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} />
        <span style={{ color: 'rgba(255,255,255,0.8)' }}>
          {new Date(inv.created_at).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          {' · '}
          {new Date(inv.created_at).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onAccept(inv)}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: '#044B5F' }}
        >
          {isProcessing
            ? <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
            : <Check className="w-3.5 h-3.5" />}
          Aceptar
        </button>
        <button
          type="button"
          onClick={() => onReject(inv)}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold text-white bg-white/5 hover:bg-white/10 transition-all disabled:opacity-40"
        >
          <XCircle className="w-3.5 h-3.5" />
          Rechazar
        </button>
      </div>
    </div>
  );
}

export function InvitationPanel({ isOpen, onClose, onAccepted, anchorRef }: InvitationPanelProps) {
  const [invitations, setInvitations] = useState<EnrichedInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    InvitationService.getPendingInvitations()
      .then(setInvitations)
      .catch(err => console.error('Error cargando invitaciones:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  const handleAccept = async (inv: EnrichedInvitation) => {
    if (inv.id < 0) return;
    setProcessingId(inv.id);
    try {
      await InvitationService.acceptInvitation(inv.id, inv.board_id);
      setInvitations(prev => prev.filter(i => i.id !== inv.id));
      onAccepted();
    } catch {
      alert('No se pudo aceptar la invitación.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (inv: EnrichedInvitation) => {
    if (inv.id < 0) return;
    setProcessingId(inv.id);
    try {
      await InvitationService.rejectInvitation(inv.id);
      setInvitations(prev => prev.filter(i => i.id !== inv.id));
    } catch {
      alert('No se pudo rechazar la invitación.');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  // Calcular posición debajo del botón ancla
  const rect = anchorRef.current?.getBoundingClientRect();
  const dropdownTop = rect ? rect.bottom + 8 : 72;
  const dropdownRight = rect ? window.innerWidth - rect.right : 16;

  return createPortal(
    <>
      <style>{`
        .inv-scroll::-webkit-scrollbar { width: 6px; }
        .inv-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
        .inv-scroll::-webkit-scrollbar-thumb { background: #066E8B; border-radius: 4px; }
        .inv-scroll::-webkit-scrollbar-thumb:hover { background: #0891b2; }
      `}</style>

      {/* Overlay transparente para cerrar al hacer click afuera */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        onClick={onClose}
      />

      {/* Dropdown */}
      <div
        className="rounded-2xl overflow-hidden shadow-2xl border border-white/20"
        style={{
          position: 'fixed',
          top: dropdownTop,
          right: dropdownRight,
          width: '320px',
          maxHeight: '480px',
          zIndex: 50,
          backgroundColor: '#0a1520',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center px-4 py-3 shrink-0 backdrop-blur-md bg-white/10 border-b border-white/20"
          style={{borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="w-7 shrink-0" />

          <div className="flex-1 flex items-center justify-center gap-2 text-white">
            <Mail className="w-4 h-4" />
            <span className="font-semibold text-sm">Invitaciones</span>
            {invitations.length > 0 && (
              <span
                className="text-white text-xs font-bold rounded-full px-2 py-0.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                {invitations.length}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 shrink-0 flex items-center justify-center text-white transition-colors p-1 rounded-md hover:bg-white/10"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

        {/* Lista */}
        <div className="inv-scroll overflow-y-auto p-3 space-y-3" style={{ flex: 1 }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {invitations.map(inv => (
                <InvitationCard
                  key={inv.id}
                  inv={inv}
                  processingId={processingId}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}

              {invitations.length === 0 && (
                <p className="text-center text-xs pt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Sin invitaciones pendientes
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
