import React, { useState, useMemo, useEffect } from 'react';
import { TriagedTicket, FilterState, TriageResponse } from './types';
import { DEMO_TICKETS } from './mockData';
import { UploadCard } from './components/UploadCard';
import { StatSummary } from './components/StatSummary';
import { FilterBar } from './components/FilterBar';
import { TicketTable } from './components/TicketTable';
import { Zap, AlertTriangle, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [tickets, setTickets] = useState<TriagedTicket[]>(DEMO_TICKETS);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>('Demo Dataset (Kaggle Support Tickets)');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>('Loaded 10 demo tickets successfully');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const [filters, setFilters] = useState<FilterState>({
    urgencyFilter: 'all',
    categoryFilter: 'all',
    searchQuery: '',
  });

  // Health check backend status on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (res.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      })
      .catch(() => {
        setBackendStatus('offline');
      });
  }, []);

  // Handle CSV File Upload to Backend Endpoint (/api/tickets/triage)
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/tickets/triage', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Server returned status code ${response.status}`);
      }

      const data: TriageResponse = await response.json();
      setTickets(data.tickets);
      setSuccessMessage(`Successfully processed and triaged ${data.total_tickets} tickets from ${file.name}`);
      setBackendStatus('online');
    } catch (err: any) {
      console.warn('Backend API triage error, offering demo dataset fallback:', err);
      setErrorMessage(`Backend processing error: ${err.message || 'Failed to connect to API server'}. Using fallback demo dataset mode.`);
      setBackendStatus('offline');
    } finally {
      setIsUploading(false);
    }
  };

  // Handler to load benchmark Kaggle demo dataset
  const handleLoadDemo = () => {
    setErrorMessage(null);
    setTickets(DEMO_TICKETS);
    setSelectedFileName('Demo Dataset (Kaggle Support Tickets)');
    setSuccessMessage('Loaded benchmark Kaggle support tickets dataset (10 tickets)');
  };

  // Client-side multi-criteria filtering & search
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Urgency Filter
      if (filters.urgencyFilter !== 'all' && ticket.urgency.toLowerCase() !== filters.urgencyFilter) {
        return false;
      }

      // Category Filter
      if (
        filters.categoryFilter !== 'all' &&
        ticket.issue_type.toLowerCase() !== filters.categoryFilter.toLowerCase()
      ) {
        return false;
      }

      // Multi-field Text Search Query
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase().trim();
        const subjectMatch = ticket.subject.toLowerCase().includes(query);
        const bodyMatch = ticket.body.toLowerCase().includes(query);
        const idMatch = ticket.ticket_id.toLowerCase().includes(query);
        const customerMatch = ticket.customer_id?.toLowerCase().includes(query) ?? false;

        if (!subjectMatch && !bodyMatch && !idMatch && !customerMatch) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, filters]);

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-glass)',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
            }}
          >
            <Zap size={24} style={{ color: '#ffffff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              TechFlow <span className="gradient-text">Support Queue</span>
            </h1>
            <p className="subtext">AI-Driven Automated Ticket Classification & Urgency Prioritization Engine</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            className="badge"
            style={{
              background:
                backendStatus === 'online'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : backendStatus === 'offline'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(148, 163, 184, 0.15)',
              color:
                backendStatus === 'online'
                  ? '#34d399'
                  : backendStatus === 'offline'
                  ? '#fbbf24'
                  : '#94a3b8',
              border: `1px solid ${
                backendStatus === 'online'
                  ? 'rgba(16, 185, 129, 0.35)'
                  : backendStatus === 'offline'
                  ? 'rgba(245, 158, 11, 0.35)'
                  : 'rgba(148, 163, 184, 0.35)'
              }`,
              padding: '6px 12px',
            }}
          >
            {backendStatus === 'online' ? (
              <>
                <ShieldCheck size={14} /> FastAPI + Gemma 4 E2B Connected
              </>
            ) : backendStatus === 'offline' ? (
              <>
                <AlertTriangle size={14} /> Standalone Client Mode (Demo Active)
              </>
            ) : (
              <>
                <RefreshCw size={14} className="animate-spin" /> Connecting API...
              </>
            )}
          </span>
        </div>
      </header>

      {/* Error Toast Notification */}
      {errorMessage && (
        <div className="toast-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
            onClick={() => setErrorMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Toast Notification */}
      {successMessage && !errorMessage && (
        <div className="toast-success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.8rem', color: '#6ee7b7' }}
            onClick={() => setSuccessMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Drag & Drop CSV Upload Card */}
      <UploadCard
        onFileUpload={handleFileUpload}
        onLoadDemo={handleLoadDemo}
        isUploading={isUploading}
        selectedFileName={selectedFileName}
      />

      {/* Statistics Summary Banner */}
      <StatSummary
        tickets={tickets}
        activeUrgencyFilter={filters.urgencyFilter}
        onSelectUrgencyFilter={(urgency) => setFilters({ ...filters, urgencyFilter: urgency })}
      />

      {/* Filter & Live Search Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        totalFilteredCount={filteredTickets.length}
        totalUnfilteredCount={tickets.length}
      />

      {/* Prioritized Ticket Table */}
      <TicketTable
        tickets={filteredTickets}
        onResetFilters={() =>
          setFilters({
            urgencyFilter: 'all',
            categoryFilter: 'all',
            searchQuery: '',
          })
        }
      />
    </div>
  );
};

export default App;
