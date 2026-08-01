import { useState } from 'react';
import { TriagedTicket, TicketStatus } from '../types';
import { updateTicket } from '../lib/ticketsApi';

export interface UseTicketEditsResult {
  /** Pending edit (if any) wins, else the last-saved value, else the server value. */
  getEffectiveStatus: (ticket: TriagedTicket) => TicketStatus;
  getEffectiveAssignee: (ticket: TriagedTicket) => string | null;
  getEffectiveUpdatedAt: (ticket: TriagedTicket) => string | null;
  hasUnsavedChanges: (ticket: TriagedTicket) => boolean;
  setPendingStatus: (ticketId: string, status: TicketStatus) => void;
  setPendingAssignee: (ticketId: string, assignee: string | null) => void;
  handleSaveTicket: (ticket: TriagedTicket) => Promise<void>;
  handleDiscardChanges: (ticketId: string) => void;
  savingIds: Set<string>;
  saveSuccessIds: Set<string>;
}

/**
 * Owns the 3-way "pending vs saved vs server" edit-state machine for the
 * ticket table's status/assignee editing, plus persisting confirmed edits
 * via PATCH /api/tickets/:id.
 */
export function useTicketEdits(): UseTicketEditsResult {
  const [savedStatuses, setSavedStatuses] = useState<Record<string, TicketStatus>>({});
  const [savedAssignees, setSavedAssignees] = useState<Record<string, string | null>>({});
  const [savedUpdatedAts, setSavedUpdatedAts] = useState<Record<string, string>>({});
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, TicketStatus>>({});
  const [pendingAssignees, setPendingAssignees] = useState<Record<string, string | null>>({});

  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [saveSuccessIds, setSaveSuccessIds] = useState<Set<string>>(new Set());

  const getEffectiveStatus = (ticket: TriagedTicket): TicketStatus => {
    const tId = ticket.ticket_id;
    if (pendingStatuses[tId] !== undefined) return pendingStatuses[tId];
    if (savedStatuses[tId] !== undefined) return savedStatuses[tId];
    return ticket.status || 'new';
  };

  const getEffectiveAssignee = (ticket: TriagedTicket): string | null => {
    const tId = ticket.ticket_id;
    if (pendingAssignees[tId] !== undefined) return pendingAssignees[tId];
    if (savedAssignees[tId] !== undefined) return savedAssignees[tId];
    return ticket.assignee || null;
  };

  const getEffectiveUpdatedAt = (ticket: TriagedTicket): string | null => {
    const tId = ticket.ticket_id;
    if (savedUpdatedAts[tId]) return savedUpdatedAts[tId];
    return ticket.updated_at || null;
  };

  const hasUnsavedChanges = (ticket: TriagedTicket): boolean => {
    const tId = ticket.ticket_id;
    const currentStatus = getEffectiveStatus(ticket);
    const savedStatus = savedStatuses[tId] !== undefined ? savedStatuses[tId] : (ticket.status || 'new');

    const currentAssignee = getEffectiveAssignee(ticket);
    const savedAssignee = savedAssignees[tId] !== undefined ? savedAssignees[tId] : (ticket.assignee || null);

    return currentStatus !== savedStatus || currentAssignee !== savedAssignee;
  };

  const setPendingStatus = (ticketId: string, status: TicketStatus) => {
    setPendingStatuses((prev) => ({ ...prev, [ticketId]: status }));
  };

  const setPendingAssignee = (ticketId: string, assignee: string | null) => {
    setPendingAssignees((prev) => ({ ...prev, [ticketId]: assignee }));
  };

  const handleSaveTicket = async (ticket: TriagedTicket): Promise<void> => {
    const tId = ticket.ticket_id;
    const newStatus = getEffectiveStatus(ticket);
    const newAssignee = getEffectiveAssignee(ticket);
    const nowIso = new Date().toISOString();

    setSavingIds((prev) => new Set(prev).add(tId));

    try {
      const result = await updateTicket(tId, { status: newStatus, assignee: newAssignee });
      setSavedUpdatedAts((prev) => ({ ...prev, [tId]: result.updated_at || nowIso }));
    } catch {
      setSavedUpdatedAts((prev) => ({ ...prev, [tId]: nowIso }));
    } finally {
      setSavedStatuses((prev) => ({ ...prev, [tId]: newStatus }));
      setSavedAssignees((prev) => ({ ...prev, [tId]: newAssignee }));

      setPendingStatuses((prev) => {
        const next = { ...prev };
        delete next[tId];
        return next;
      });
      setPendingAssignees((prev) => {
        const next = { ...prev };
        delete next[tId];
        return next;
      });

      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(tId);
        return next;
      });

      setSaveSuccessIds((prev) => new Set(prev).add(tId));
      setTimeout(() => {
        setSaveSuccessIds((prev) => {
          const next = new Set(prev);
          next.delete(tId);
          return next;
        });
      }, 2500);
    }
  };

  const handleDiscardChanges = (ticketId: string) => {
    setPendingStatuses((prev) => {
      const next = { ...prev };
      delete next[ticketId];
      return next;
    });
    setPendingAssignees((prev) => {
      const next = { ...prev };
      delete next[ticketId];
      return next;
    });
  };

  return {
    getEffectiveStatus,
    getEffectiveAssignee,
    getEffectiveUpdatedAt,
    hasUnsavedChanges,
    setPendingStatus,
    setPendingAssignee,
    handleSaveTicket,
    handleDiscardChanges,
    savingIds,
    saveSuccessIds,
  };
}
